import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const ingestedVideos = sqliteTable('ingested_videos', {
  id: text('id').primaryKey(),
  sourceUrl: text('source_url').notNull(),
  mediaPath: text('media_path'),
  status: text('status', { enum: ['pending', 'processing', 'ready', 'error'] })
    .notNull()
    .default('pending'),
  errorMsg: text('error_msg'),
  createdAt: integer('created_at').notNull(),
})

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  isPreset: integer('is_preset', { mode: 'boolean' }).notNull().default(false),
})

export const tips = sqliteTable('tips', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  notes: text('notes'),
  mediaType: text('media_type', { enum: ['video_frame', 'screenshot'] }).notNull(),
  mediaPath: text('media_path').notNull(),
  thumbPath: text('thumb_path'),
  videoId: text('video_id').references(() => ingestedVideos.id),
  frameTimeMs: integer('frame_time_ms'),
  sourceUrl: text('source_url'),
  status: text('status', { enum: ['pending', 'ready', 'error'] })
    .notNull()
    .default('ready'),
  createdAt: integer('created_at').notNull(),
})

export const tipCategories = sqliteTable(
  'tip_categories',
  {
    tipId: text('tip_id')
      .notNull()
      .references(() => tips.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.tipId, t.categoryId] }) })
)

export type Tip = typeof tips.$inferSelect
export type NewTip = typeof tips.$inferInsert
export type Category = typeof categories.$inferSelect
export type IngestedVideo = typeof ingestedVideos.$inferSelect
