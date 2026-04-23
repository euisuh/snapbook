import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tips, tipCategories, categories } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await db.select().from(tips).where(eq(tips.id, id))
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const joins = await db.select().from(tipCategories).where(eq(tipCategories.tipId, id))
  const catIds = joins.map((j) => j.categoryId)
  const cats = catIds.length ? await db.select().from(categories).where(inArray(categories.id, catIds)) : []

  return NextResponse.json({ ...rows[0], categories: cats })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { title, notes, categoryIds } = body as any

  const updates: Record<string, any> = {}
  if (title !== undefined) updates.title = title
  if (notes !== undefined) updates.notes = notes

  if (Object.keys(updates).length) {
    await db.update(tips).set(updates).where(eq(tips.id, id))
  }

  if (Array.isArray(categoryIds)) {
    await db.delete(tipCategories).where(eq(tipCategories.tipId, id))
    if (categoryIds.length) {
      await db.insert(tipCategories).values(categoryIds.map((cid: string) => ({ tipId: id, categoryId: cid })))
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.delete(tips).where(eq(tips.id, id))
  return NextResponse.json({ ok: true })
}
