import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, signToken } from '@/lib/auth'

const COOKIE_OPTIONS = [
  'Path=/',
  'HttpOnly',
  'SameSite=Strict',
  'Max-Age=86400',
  ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
].join('; ')

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { password } = body as { password?: string }

  if (!password || typeof password !== 'string' || !(await verifyPassword(password))) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = await signToken()
  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', `auth=${token}; ${COOKIE_OPTIONS}`)
  return response
}

export async function DELETE(_request: NextRequest) {
  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', `auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`)
  return response
}
