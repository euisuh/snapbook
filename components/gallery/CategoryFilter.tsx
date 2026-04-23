'use client'

import type { Category } from '@/lib/db/schema'

interface CategoryFilterProps {
  categories: Category[]
  selectedId: string | null
  onChange: (id: string | null) => void
}

export default function CategoryFilter({
  categories,
  selectedId,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selectedId === null
            ? 'bg-zinc-900 text-white'
            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedId === cat.id
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
