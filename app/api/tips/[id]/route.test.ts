// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockTip = {
  id: 't1',
  title: 'Golden Hour',
  mediaType: 'screenshot',
  mediaPath: '/data/media/t1.jpg',
  thumbPath: '/data/thumbs/t1.jpg',
  status: 'ready',
  createdAt: 1000,
  videoId: null,
  frameTimeMs: null,
  sourceUrl: null,
  notes: 'Great light',
}

const mockSelectChain = { from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) }

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue(mockSelectChain),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  },
}))

describe('GET /api/tips/:id', () => {
  it('returns 200 with tip and categories when found', async () => {
    const { db } = await import('@/lib/db')
    const selectMock = db.select as ReturnType<typeof vi.fn>
    selectMock
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockTip]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      })

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/tips/t1')
    const res = await GET(req, { params: Promise.resolve({ id: 't1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('t1')
    expect(data.title).toBe('Golden Hour')
    expect(Array.isArray(data.categories)).toBe(true)
  })

  it('returns 404 when tip not found', async () => {
    const { db } = await import('@/lib/db')
    const selectMock = db.select as ReturnType<typeof vi.fn>
    selectMock.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    })

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/tips/nonexistent')
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Not found')
  })
})

describe('PATCH /api/tips/:id', () => {
  it('returns 200 with { ok: true } when updating title', async () => {
    const { PATCH } = await import('./route')
    const req = new NextRequest('http://localhost/api/tips/t1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 't1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })
})

describe('DELETE /api/tips/:id', () => {
  it('returns 200 with { ok: true } when tip found', async () => {
    const { db } = await import('@/lib/db')
    const selectMock = db.select as ReturnType<typeof vi.fn>
    selectMock.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 't1' }]),
    })

    const { DELETE } = await import('./route')
    const req = new NextRequest('http://localhost/api/tips/t1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 't1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it('returns 404 when tip not found', async () => {
    const { db } = await import('@/lib/db')
    const selectMock = db.select as ReturnType<typeof vi.fn>
    selectMock.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    })

    const { DELETE } = await import('./route')
    const req = new NextRequest('http://localhost/api/tips/missing', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Not found')
  })
})
