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
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTips = tips.filter((tip) => {
    const matchesCategory =
      selectedId === null || tip.categories.some((cat) => cat.id === selectedId)
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      q === '' ||
      tip.title.toLowerCase().includes(q) ||
      (tip.notes ?? '').toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex flex-col gap-6">
      <input
        type="search"
        placeholder="Search tips..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full max-w-sm rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-0"
      />
      <CategoryFilter categories={categories} selectedId={selectedId} onChange={setSelectedId} />
      {filteredTips.length === 0 ? (
        <p className="text-zinc-500 text-sm py-16 text-center">
          {tips.length === 0 ? (
            <>
              No tips yet.{' '}
              <a href="/admin" className="underline">
                Add some →
              </a>
            </>
          ) : (
            'No tips match your search.'
          )}
        </p>
      ) : (
        <TipGrid tips={filteredTips} />
      )}
    </div>
  )
}
