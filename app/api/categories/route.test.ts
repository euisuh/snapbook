// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { id: 'c1', name: 'Lighting', isPreset: true },
        { id: 'c2', name: 'Composition', isPreset: true },
      ]),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  },
}))
vi.mock('@paralleldrive/cuid2', () => ({ createId: () => 'new-cat-id' }))

describe('GET /api/categories', () => {
  it('returns 200 with categories array', async () => {
    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(2)
  })
})

describe('POST /api/categories', () => {
  it('returns 201 with created category for valid name', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Perspective' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('new-cat-id')
    expect(data.name).toBe('Perspective')
    expect(data.isPreset).toBe(false)
  })

  it('returns 400 when name is missing', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/categories', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('name required')
  })
})
