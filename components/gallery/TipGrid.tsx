'use client'

import TipCard from './TipCard'
import type { TipWithCategories } from '@/types/tip'

interface TipGridProps {
  tips: TipWithCategories[]
}

export default function TipGrid({ tips }: TipGridProps) {
  if (tips.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400 text-sm">
        No tips found.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tips.map((tip) => (
        <TipCard key={tip.id} tip={tip} />
      ))}
    </div>
  )
}
