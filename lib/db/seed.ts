import { categories } from './schema'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { createId } from '@paralleldrive/cuid2'

const PRESET_CATEGORIES = [
  'Lighting',
  'Composition',
  'Exposure',
  'Color',
  'Focus',
  'Editing',
  'Equipment',
  'Other',
]

export function seedCategories(db: BetterSQLite3Database<any>) {
  for (const name of PRESET_CATEGORIES) {
    db.insert(categories)
      .values({ id: createId(), name, isPreset: true })
      .onConflictDoNothing()
      .run()
  }
}
