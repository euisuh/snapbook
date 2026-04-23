'use client'

import { useState } from 'react'
import CategoryFilter from './CategoryFilter'
import TipGrid from './TipGrid'
import type { TipWithCategories } from '@/types/tip'
import type { Category } from '@/lib/db/schema'

interface GalleryClientProps {
  tips: TipWithCategories[]
  categories: Category[]
}

export default function GalleryClient({ tips, categories }: GalleryClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredTips =
    selectedId === null
      ? tips
      : tips.filter((tip) => tip.categories.some((cat) => cat.id === selectedId))

  return (
    <div className="flex flex-col gap-6">
      <CategoryFilter
        categories={categories}
        selectedId={selectedId}
        onChange={setSelectedId}
      />
      <TipGrid tips={filteredTips} />
    </div>
  )
}
