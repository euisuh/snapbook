import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { tips, categories, tipCategories, ingestedVideos } from '../schema'
import { seedCategories } from '../seed'
import { eq } from 'drizzle-orm'

function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('journal_mode = WAL')
  return sqlite
}

describe('schema', () => {
  it('creates tables and inserts a tip', () => {
    const sqlite = createTestDb()
    const db = drizzle(sqlite)

    sqlite.exec(`
      CREATE TABLE ingested_videos (
        id TEXT PRIMARY KEY,
        source_url TEXT NOT NULL,
        media_path TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        error_msg TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        is_preset INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE tips (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        notes TEXT,
        media_type TEXT NOT NULL,
        media_path TEXT NOT NULL,
        thumb_path TEXT,
        video_id TEXT REFERENCES ingested_videos(id),
        frame_time_ms INTEGER,
        source_url TEXT,
        status TEXT NOT NULL DEFAULT 'ready',
        created_at INTEGER NOT NULL
      );
      CREATE TABLE tip_categories (
        tip_id TEXT NOT NULL REFERENCES tips(id) ON DELETE CASCADE,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (tip_id, category_id)
      );
    `)

    const typedDb = drizzle(sqlite, { schema: { tips, categories, tipCategories, ingestedVideos } })

    typedDb.insert(categories).values({ id: 'cat1', name: 'Lighting', isPreset: true }).run()
    typedDb.insert(tips).values({
      id: 'tip1',
      title: 'Golden hour trick',
      mediaType: 'screenshot',
      mediaPath: '/data/media/tip1.jpg',
      status: 'ready',
      createdAt: Date.now(),
    }).run()
    typedDb.insert(tipCategories).values({ tipId: 'tip1', categoryId: 'cat1' }).run()

    const result = typedDb.select().from(tips).where(eq(tips.id, 'tip1')).all()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Golden hour trick')
  })

  it('seedCategories inserts preset categories', () => {
    const sqlite = createTestDb()
    sqlite.exec(`
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        is_preset INTEGER NOT NULL DEFAULT 0
      );
    `)
    const db = drizzle(sqlite, { schema: { categories } })
    seedCategories(db)
    const rows = db.select().from(categories).all()
    expect(rows.length).toBeGreaterThanOrEqual(8)
    expect(rows.every(r => r.isPreset)).toBe(true)
  })
})
