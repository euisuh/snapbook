// app/api/ingest/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockInsert = { values: vi.fn().mockResolvedValue(undefined) }
const mockUpdate = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue(undefined) }

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue(mockInsert),
    update: vi.fn().mockReturnValue(mockUpdate),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'vid1', status: 'ready', sourceUrl: 'http://ig.com' }]),
    }),
  },
}))
vi.mock('@/lib/media/ytdlp', () => ({ downloadVideo: vi.fn().mockResolvedValue({ mediaPath: '/data/media/vid1.mp4' }) }))
vi.mock('@/lib/media/ffmpeg', () => ({
  extractSceneFrames: vi.fn().mockResolvedValue(['/data/frames/vid1/0001.jpg']),
  generateVideoThumbnail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@paralleldrive/cuid2', () => ({ createId: () => 'vid-new-id' }))

describe('POST /api/ingest', () => {
  it('returns 400 without url', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/ingest', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 202 with id on valid url', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/ingest', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://instagram.com/reel/test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(202)
    const data = await res.json()
    expect(data.id).toBe('vid-new-id')
  })
})
