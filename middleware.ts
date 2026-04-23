import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'dev-secret-change-me-in-production'
  )
}

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'DELETE'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')
  const isMutatingApi =
    MUTATING_METHODS.has(request.method) &&
    (pathname.startsWith('/api/tips') ||
      pathname.startsWith('/api/ingest') ||
      pathname.startsWith('/api/upload'))

  if (!isAdminPage && !isMutatingApi) return NextResponse.next()

  const token = request.cookies.get('auth')?.value

  if (token) {
    try {
      await jwtVerify(token, getSecret())
      return NextResponse.next()
    } catch {
      // fall through to redirect/401
    }
  }

  if (isAdminPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export const config = {
  matcher: ['/admin/:path*', '/api/tips/:path*', '/api/ingest/:path*', '/api/upload/:path*'],
}
