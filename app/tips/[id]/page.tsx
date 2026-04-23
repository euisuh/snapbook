import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { TipWithCategories } from '@/types/tip'
import path from 'path'

const BASE = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

export default async function TipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${BASE}/api/tips/${id}`, { cache: 'no-store' })
  if (!res.ok) notFound()
  const tip: TipWithCategories = await res.json()

  const imageUrl = `/api/media/media/${path.basename(tip.mediaPath)}`
  const formattedDate = new Date(tip.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center h-14">
          <Link href="/" className="text-lg font-semibold text-zinc-900 tracking-tight">
            Snapbook
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← Gallery
        </Link>

        {/* Full image */}
        <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-zinc-100">
          <Image
            src={imageUrl}
            alt={tip.title}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-zinc-900">{tip.title}</h1>

        {/* Category badges */}
        {tip.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tip.categories.map((cat) => (
              <Badge key={cat.id} variant="secondary">
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Notes */}
        {tip.notes && (
          <p className="whitespace-pre-wrap text-zinc-700 leading-relaxed">{tip.notes}</p>
        )}

        {/* Metadata */}
        <div className="flex flex-col gap-2 text-sm text-zinc-500">
          {tip.frameTimeMs != null && (
            <span>Video frame at {(tip.frameTimeMs / 1000).toFixed(1)}s</span>
          )}

          {tip.sourceUrl && (
            <a
              href={tip.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
            >
              Source
            </a>
          )}

          <span>{formattedDate}</span>
        </div>
      </main>
    </div>
  )
}
