// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.ADMIN_PASSWORD = 'test-password-123'
  process.env.JWT_SECRET = 'test-secret-for-unit-tests-32chars'
})

describe('auth', () => {
  it('verifyPassword returns true for correct password', async () => {
    const { verifyPassword } = await import('./auth')
    expect(await verifyPassword('test-password-123')).toBe(true)
  })

  it('verifyPassword returns false for wrong password', async () => {
    const { verifyPassword } = await import('./auth')
    expect(await verifyPassword('wrong-password')).toBe(false)
  })

  it('signToken + verifyToken round-trip succeeds', async () => {
    const { signToken, verifyToken } = await import('./auth')
    const token = await signToken()
    expect(typeof token).toBe('string')
    expect(await verifyToken(token)).toBe(true)
  })

  it('verifyToken returns false for garbage', async () => {
    const { verifyToken } = await import('./auth')
    expect(await verifyToken('not-a-token')).toBe(false)
  })
})
