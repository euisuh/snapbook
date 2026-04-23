import { describe, it, expect, vi, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  verifyPassword: vi.fn().mockImplementation(async (p: string) => p === 'correct-password'),
  signToken: vi.fn().mockResolvedValue('mock.jwt.token'),
}))

beforeAll(() => {
  process.env.ADMIN_PASSWORD = 'correct-password'
  process.env.JWT_SECRET = 'test-secret-32chars-for-testing!!'
})

describe('POST /api/auth', () => {
  it('returns 200 and sets cookie on correct password', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password: 'correct-password' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Set-Cookie')).toContain('auth=')
  })

  it('returns 401 on wrong password', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/auth', () => {
  it('clears the auth cookie', async () => {
    const { DELETE } = await import('./route')
    const req = new NextRequest('http://localhost/api/auth', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const cookie = res.headers.get('Set-Cookie')
    expect(cookie).toContain('auth=;')
  })
})
