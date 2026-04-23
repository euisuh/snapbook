import Link from 'next/link'
import GalleryClient from '@/components/gallery/GalleryClient'
import type { TipWithCategories } from '@/types/tip'
import type { Category } from '@/lib/db/schema'

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

export default async function Home() {
  const [tipsRes, categoriesRes] = await Promise.all([
    fetch(`${BASE_URL}/api/tips`, { cache: 'no-store' }),
    fetch(`${BASE_URL}/api/categories`, { cache: 'no-store' }),
  ])

  const tips: TipWithCategories[] = tipsRes.ok ? await tipsRes.json() : []
  const categories: Category[] = categoriesRes.ok ? await categoriesRes.json() : []

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-semibold text-zinc-900 tracking-tight">
            Snapbook
          </Link>
          <Link
            href="/admin"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <GalleryClient tips={tips} categories={categories} />
      </main>
    </div>
  )
}
