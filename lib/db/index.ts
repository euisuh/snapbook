import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { seedCategories } from './seed'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'db.sqlite')

function createTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ingested_videos (
      id TEXT PRIMARY KEY,
      source_url TEXT NOT NULL,
      media_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error_msg TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      is_preset INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tips (
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
    CREATE TABLE IF NOT EXISTS tip_categories (
      tip_id TEXT NOT NULL REFERENCES tips(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (tip_id, category_id)
    );
  `)
}

declare global {
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

function initDb() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const sqlite = new Database(DB_PATH)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  createTables(sqlite)

  const db = drizzle(sqlite, { schema })
  seedCategories(db)
  return db
}

export const db = globalThis.__db ?? (globalThis.__db = initDb())
