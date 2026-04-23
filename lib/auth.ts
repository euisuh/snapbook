import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  const s = process.env.JWT_SECRET ?? 'dev-secret-change-me-in-production'
  return new TextEncoder().encode(s)
}

// Lazy singleton — hashed once on first call, reused after
let _hash: string | null = null
function getPasswordHash(): string {
  if (_hash) return _hash
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error('ADMIN_PASSWORD env var not set')
  _hash = bcrypt.hashSync(password, 10)
  return _hash
}

export async function verifyPassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, getPasswordHash())
}

export async function signToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}
