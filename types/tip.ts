import type { Tip, Category } from '@/lib/db/schema'

export type TipWithCategories = Tip & { categories: Category[] }
