import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { createId } from '@paralleldrive/cuid2'

export async function GET() {
  const rows = await db.select().from(categories).orderBy(categories.name)
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { name } = body as { name?: string }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  const id = createId()
  await db.insert(categories).values({ id, name: name.trim(), isPreset: false })
  return NextResponse.json({ id, name: name.trim(), isPreset: false }, { status: 201 })
}
