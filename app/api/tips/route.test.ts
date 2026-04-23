// app/api/tips/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockTips = [
  { id: 't1', title: 'Tip A', mediaType: 'screenshot', mediaPath: '/data/media/t1.jpg', thumbPath: '/data/thumbs/t1.jpg', status: 'ready', createdAt: 1000, videoId: null, frameTimeMs: null, sourceUrl: null, notes: null },
]
const mockSelect = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockResolvedValue(mockTips), leftJoin: vi.fn().mockReturnThis() }
const mockInsert = { values: vi.fn().mockResolvedValue(undefined) }

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue(mockSelect),
    insert: vi.fn().mockReturnValue(mockInsert),
  },
}))
vi.mock('@paralleldrive/cuid2', () => ({ createId: () => 'new-id-123' }))

describe('GET /api/tips', () => {
  it('returns tip list', async () => {
    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/tips')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('POST /api/tips', () => {
  it('returns 400 when title missing', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/tips', {
      method: 'POST',
      body: JSON.stringify({ mediaPath: '/data/media/x.jpg', mediaType: 'screenshot' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 201 with valid payload', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/tips', {
      method: 'POST',
      body: JSON.stringify({ title: 'A tip', mediaPath: '/data/media/x.jpg', mediaType: 'screenshot', categoryIds: [] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('new-id-123')
  })
})
