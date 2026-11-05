import { createHmac, timingSafeEqual } from 'crypto'

// Kept free of next/headers and Supabase so proxy.ts can import it.

export const PORTAL_COOKIE = 'portal_session'
export const PORTAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface PortalSession {
  clientId: string
  clientSlug: string
}

function sessionSecret(): string {
  const secret = process.env.PORTAL_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('PORTAL_SESSION_SECRET is not set')
  return secret
}

function sign(payload: string): Buffer {
  return createHmac('sha256', sessionSecret()).update(`portal-session:${payload}`).digest()
}

/** Serialise a session as `payload.signature`, so the browser can't edit it. */
export function encodePortalSession(session: PortalSession): string {
  const exp = Math.floor(Date.now() / 1000) + PORTAL_COOKIE_MAX_AGE
  const payload = Buffer.from(JSON.stringify({ ...session, exp })).toString('base64url')
  return `${payload}.${sign(payload).toString('base64url')}`
}

/** Returns the session only if the signature is valid and it hasn't expired. */
export function decodePortalSession(cookie: string | undefined): PortalSession | null {
  if (!cookie) return null

  const [payload, signature, ...rest] = cookie.split('.')
  if (!payload || !signature || rest.length > 0) return null

  const expected = sign(payload)
  const given = Buffer.from(signature, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null

  try {
    const { clientId, clientSlug, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!clientId || !clientSlug || typeof exp !== 'number') return null
    if (exp < Date.now() / 1000) return null
    return { clientId, clientSlug }
  } catch {
    return null
  }
}
