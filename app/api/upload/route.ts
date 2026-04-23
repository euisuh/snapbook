import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { createId } from '@paralleldrive/cuid2'
import { generateThumbnail } from '@/lib/media/thumbnail'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
const MAX_BYTES = 100 * 1024 * 1024

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })

  const mediaDir = process.env.MEDIA_DIR ?? '/data/media'
  await mkdir(mediaDir, { recursive: true })

  const id = createId()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const mediaPath = path.join(mediaDir, `${id}.${ext}`)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(mediaPath, buffer)

  let thumbPath: string | null = null
  if (file.type.startsWith('image/')) {
    thumbPath = await generateThumbnail(mediaPath, id).catch(() => null)
  }

  const mediaType = file.type.startsWith('video/') ? 'video_frame' : 'screenshot'

  return NextResponse.json({
    id, mediaPath, thumbPath, mediaType,
    mediaUrl: `/api/media/media/${id}.${ext}`,
    thumbUrl: thumbPath ? `/api/media/thumbs/${id}.jpg` : null,
  }, { status: 201 })
}
