import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ingestedVideos } from '@/lib/db/schema'
import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
import { downloadVideo } from '@/lib/media/ytdlp'
import { extractSceneFrames, generateVideoThumbnail } from '@/lib/media/ffmpeg'
import path from 'path'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { url } = body as { url?: string }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  const id = createId()
  await db.insert(ingestedVideos).values({
    id,
    sourceUrl: url,
    status: 'pending',
    createdAt: Date.now(),
  })

  // Fire-and-forget async processing
  processVideo(id, url).catch(console.error)

  return NextResponse.json({ id }, { status: 202 })
}

async function processVideo(id: string, url: string) {
  try {
    await db.update(ingestedVideos).set({ status: 'processing' }).where(eq(ingestedVideos.id, id))
    const { mediaPath } = await downloadVideo(url, id)
    await db.update(ingestedVideos).set({ mediaPath, status: 'processing' }).where(eq(ingestedVideos.id, id))
    const thumbPath = path.join('/data/thumbs', `${id}.jpg`)
    await generateVideoThumbnail(mediaPath, thumbPath).catch(() => {})
    await extractSceneFrames(mediaPath, id).catch(() => {})
    await db.update(ingestedVideos).set({ status: 'ready' }).where(eq(ingestedVideos.id, id))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await db.update(ingestedVideos).set({ status: 'error', errorMsg: msg }).where(eq(ingestedVideos.id, id))
  }
}
