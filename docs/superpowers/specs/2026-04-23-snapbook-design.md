# Snapbook — Design Spec
_2026-04-23_

## Problem

Photography tips ("꿀팁") are scattered across Instagram posts and Reels. No quick way to pull up a visual reference when explaining a technique to family. Text descriptions don't substitute for seeing the actual technique.

## Solution

Self-hosted web service for saving and organizing photo-taking tips with their visual references. Paste an Instagram URL or upload a screenshot, add a title and category, get a clean browsable gallery.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router | Full-stack, single codebase |
| ORM | Drizzle + better-sqlite3 | Lightweight, SQLite-native |
| Styling | Tailwind CSS + shadcn/ui | Fast UI, consistent components |
| Media download | yt-dlp | Battle-tested Instagram/Reels downloader |
| Frame extraction | ffmpeg | Scene detection + frame export |
| Image processing | sharp | Thumbnail generation for screenshots |
| Auth | bcrypt + JWT (jose) | Stateless, no user table needed |
| Deployment | Docker single container | Simple self-host on NAS/home server |

---

## Architecture

Single Next.js monolith. API routes handle all backend logic. yt-dlp and ffmpeg run as child processes. All media and DB stored on a Docker volume at `/data`.

### Route Map

```
/                         gallery (public)
/tips/[id]                tip detail (public)
/admin                    add tip form (auth required)
/admin/review/[videoId]   frame review after video ingest (auth required)
/admin/login              login page
/api/tips                 GET list, POST create
/api/tips/[id]            GET, PATCH, DELETE
/api/ingest               POST url → trigger yt-dlp + scene detect
/api/ingest/[id]          GET status poll
/api/ingest/[id]/capture  POST timestamp → extract single frame
/api/upload               POST multipart file upload
/api/auth                 POST login, DELETE logout
```

---

## Data Model

### `ingested_videos`
Holds raw downloaded videos before tips are extracted from them.

| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | cuid |
| source_url | TEXT | Original Instagram URL |
| media_path | TEXT | `/data/media/<id>.mp4` |
| status | TEXT | `pending` \| `processing` \| `ready` \| `error` |
| error_msg | TEXT | nullable |
| created_at | INTEGER | Unix ms |

### `tips`
One row per saved tip. Can be a standalone screenshot/upload or a frame extracted from an ingested video.

| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | cuid |
| title | TEXT | Required |
| notes | TEXT | Optional freetext |
| media_type | TEXT | `video_frame` \| `screenshot` |
| media_path | TEXT | `/data/media/<id>.<ext>` or `/data/frames/<videoId>/<frameId>.jpg` |
| thumb_path | TEXT | `/data/thumbs/<id>.jpg` |
| video_id | TEXT FK | → `ingested_videos.id`, nullable |
| frame_time_ms | INTEGER | Timestamp in source video, nullable |
| source_url | TEXT | Original URL for reference display, nullable |
| status | TEXT | `pending` \| `ready` \| `error` |
| created_at | INTEGER | Unix ms |

### `categories`

| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | cuid |
| name | TEXT UNIQUE | |
| is_preset | INTEGER | 1 = built-in, 0 = user-created |

Preset categories: Lighting, Composition, Exposure, Color, Focus, Editing, Equipment, Other.

### `tip_categories`
Join table (many-to-many).

| Column | Type |
|---|---|
| tip_id | TEXT FK |
| category_id | TEXT FK |

### File Layout in Container
```
/data/
  db.sqlite
  media/        ← downloaded videos + uploaded screenshots
  frames/       ← extracted video frames (organized by video_id)
  thumbs/       ← JPEG thumbnails for all tips
```

---

## Key Flows

### Add tip via Instagram URL
1. Admin pastes URL → POST `/api/ingest`
2. `ingested_videos` row created, `status=pending`; id returned immediately
3. Server spawns `yt-dlp` async → saves to `/data/media/<id>.mp4`
4. ffmpeg scene detection: `ffmpeg -i input.mp4 -vf "select='gt(scene,0.4)',showinfo" -vsync vfr /data/frames/<videoId>/%04d.jpg`
5. Row updated to `ready`
6. Frontend redirects to `/admin/review/<id>`

### Add tip via file upload
1. Admin drops file → POST `/api/upload` (multipart)
2. File saved to `/data/media/<id>.<ext>`
3. `sharp` generates thumbnail → `/data/thumbs/<id>.jpg`
4. `tips` row created with `status=ready` immediately
5. Redirect to admin with success state

### Review video frames (`/admin/review/[videoId]`)
- Video player (HTML5 `<video>`) with scrubber
- "Capture frame" button → POST `/api/ingest/[videoId]/capture` with timestamp → ffmpeg extracts single frame
- Auto-detected frames displayed as grid; unselected by default (dimmed)
- Click frame to select; inline title + category picker per frame
- Manual captures labeled "manual"
- "Save N tips →" button → batch POST to `/api/tips`

### Browse gallery (`/`)
- Loads all `tips` where `status=ready`, sorted `created_at DESC`
- Category filter pill tabs: All + each category with at least one tip
- Uniform card grid (4:3 thumbnail, title below, category label)
- Client-side category filter (no full reload)

### Auth
- `ADMIN_PASSWORD` env var bcrypt-hashed at app startup, stored in module scope
- POST `/api/auth` validates password → sets `HttpOnly; Secure; SameSite=Strict` JWT cookie (24h)
- Middleware checks JWT on all `/admin/*` routes and mutating API routes (`POST/PATCH/DELETE`)
- No user table; stateless

---

## UI Design

- **Theme:** Light (white/light gray backgrounds, black text, subtle borders)
- **Gallery:** Uniform card grid, 4:3 aspect ratio thumbnails, title + category below
- **Tip detail:** Full-width media (video autoplay muted, or image), title, categories, notes, source URL reference
- **Admin add form:** URL input OR file dropzone (mutually exclusive), title, category multi-select (preset pills + "new" button), notes textarea
- **Review screen:** Video player + "capture frame" → frame grid with inline editing per frame

---

## Docker

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache python3 py3-pip ffmpeg && pip3 install yt-dlp
WORKDIR /app
COPY . .
RUN npm ci && npm run build
VOLUME /data
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
services:
  snapbook:
    build: .
    ports: ["3000:3000"]
    volumes:
      - ./data:/data
    environment:
      ADMIN_PASSWORD: changeme
      JWT_SECRET: replace-with-random-string
      DATABASE_URL: /data/db.sqlite
      MEDIA_DIR: /data/media
      MAX_VIDEO_SIZE_MB: "500"
    restart: unless-stopped
```

---

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `ADMIN_PASSWORD` | — | Yes |
| `JWT_SECRET` | — | Yes |
| `DATABASE_URL` | `/data/db.sqlite` | No |
| `MEDIA_DIR` | `/data/media` | No |
| `MAX_VIDEO_SIZE_MB` | `500` | No |

---

## Path to Public

Minimal changes needed:
1. Swap `better-sqlite3` → `@vercel/postgres` or `pg` in Drizzle config
2. Swap `/data/media` → S3 (add `AWS_*` env vars, replace `fs.writeFile` with `S3.putObject`)
3. Auth already stateless — no changes needed
4. Add rate limiting middleware on ingest route

No structural rewrites required.

---

## Out of Scope (v1)

- Search / full-text tips
- Tip ordering / drag-to-reorder
- Multiple admin users
- Comments or reactions
- Mobile app
- Notifications
