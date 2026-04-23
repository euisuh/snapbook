'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { TipWithCategories } from '@/types/tip'

interface TipCardProps {
  tip: TipWithCategories
}

export default function TipCard({ tip }: TipCardProps) {
  const [imgError, setImgError] = useState(false)
  const thumbSrc = tip.thumbPath
    ? `/api/media/thumbs/${tip.id}.jpg`
    : `/api/media/media/${tip.mediaPath.split('/').pop()}`

  return (
    <Link href={`/tips/${tip.id}`} className="block group">
      <Card className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer h-full">
        <div className="relative aspect-video w-full bg-zinc-100">
          {imgError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 text-zinc-400 text-xs">
              No image
            </div>
          ) : (
            <Image
              src={thumbSrc}
              alt={tip.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <CardContent className="pt-3 pb-4 flex flex-col gap-2">
          <h3 className="font-medium text-sm leading-snug text-zinc-900 line-clamp-2">
            {tip.title}
          </h3>
          {tip.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tip.categories.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="text-xs">
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}
          {tip.notes && (
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
              {tip.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
