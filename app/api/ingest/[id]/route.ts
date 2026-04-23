import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ingestedVideos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { readdir } from 'fs/promises'
import path from 'path'
import fs from 'fs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await db.select().from(ingestedVideos).where(eq(ingestedVideos.id, id))
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const video = rows[0]
  let frames: Array<{ path: string; url: string }> = []
  const framesDir = path.join('/data/frames', id)
  if (video.status === 'ready' && fs.existsSync(framesDir)) {
    const files = await readdir(framesDir).catch(() => [])
    frames = files
      .filter((f) => f.endsWith('.jpg'))
      .sort()
      .map((f) => ({ path: path.join(framesDir, f), url: `/api/media/frames/${id}/${f}` }))
  }

  return NextResponse.json({
    ...video,
    videoUrl: video.mediaPath ? `/api/media/media/${path.basename(video.mediaPath)}` : null,
    frames,
  })
}
