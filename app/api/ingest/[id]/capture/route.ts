import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ingestedVideos } from '@/lib/db/schema'
import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
import { extractFrameAt } from '@/lib/media/ffmpeg'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { timeMs } = body as { timeMs?: number }

  if (typeof timeMs !== 'number') {
    return NextResponse.json({ error: 'timeMs required' }, { status: 400 })
  }

  const rows = await db.select().from(ingestedVideos).where(eq(ingestedVideos.id, id))
  if (!rows.length || rows[0].status !== 'ready' || !rows[0].mediaPath) {
    return NextResponse.json({ error: 'Video not found or not ready' }, { status: 404 })
  }

  const frameId = createId()
  const framePath = await extractFrameAt(rows[0].mediaPath, id, timeMs, frameId)

  return NextResponse.json({
    frameId,
    path: framePath,
    url: `/api/media/frames/${id}/${path.basename(framePath)}`,
    timeMs,
  })
}
