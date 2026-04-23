import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tips, categories, tipCategories } from '@/lib/db/schema'
import { createId } from '@paralleldrive/cuid2'
import { eq, desc, asc, inArray } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const categoryId = searchParams.get('category')

  let rows: any[]
  if (categoryId) {
    const tipIds = await db
      .select({ tipId: tipCategories.tipId })
      .from(tipCategories)
      .where(eq(tipCategories.categoryId, categoryId))
      .orderBy(asc(tipCategories.tipId))
    const ids = tipIds.map((r) => r.tipId)
    rows = ids.length
      ? await db.select().from(tips).where(inArray(tips.id, ids)).orderBy(desc(tips.createdAt))
      : []
  } else {
    rows = await db.select().from(tips).where(eq(tips.status, 'ready')).orderBy(desc(tips.createdAt))
  }

  // Attach categories to each tip
  const allCats = await db.select().from(categories).orderBy(asc(categories.name))
  const catMap = Object.fromEntries(allCats.map((c) => [c.id, c]))

  const joins = await db.select().from(tipCategories).orderBy(asc(tipCategories.tipId))
  const tipCatMap: Record<string, typeof allCats> = {}
  for (const j of joins) {
    if (!tipCatMap[j.tipId]) tipCatMap[j.tipId] = []
    if (catMap[j.categoryId]) tipCatMap[j.tipId].push(catMap[j.categoryId])
  }

  return NextResponse.json(
    rows.map((t) => ({ ...t, categories: tipCatMap[t.id] ?? [] }))
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { title, notes, mediaType, mediaPath, thumbPath, videoId, frameTimeMs, sourceUrl, categoryIds } = body as any

  if (!title || !mediaType || !mediaPath) {
    return NextResponse.json({ error: 'title, mediaType, mediaPath required' }, { status: 400 })
  }

  const id = createId()
  await db.insert(tips).values({
    id,
    title,
    notes: notes ?? null,
    mediaType,
    mediaPath,
    thumbPath: thumbPath ?? null,
    videoId: videoId ?? null,
    frameTimeMs: frameTimeMs ?? null,
    sourceUrl: sourceUrl ?? null,
    status: 'ready',
    createdAt: Date.now(),
  })

  if (Array.isArray(categoryIds) && categoryIds.length) {
    await db.insert(tipCategories).values(
      categoryIds.map((cid: string) => ({ tipId: id, categoryId: cid }))
    )
  }

  return NextResponse.json({ id }, { status: 201 })
}
