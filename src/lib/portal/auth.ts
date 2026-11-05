import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import {
  PORTAL_COOKIE,
  PORTAL_COOKIE_MAX_AGE,
  decodePortalSession,
  encodePortalSession,
  type PortalSession,
} from './session'

const PORTAL_CLIENT_COLUMNS = 'id, name, company, email, slug, type, portal_access'

/**
 * The client who may view this slug, or null.
 *
 * In `next dev` a missing session falls back to a lookup by slug, so portal pages
 * can be previewed without logging in. Vercel always runs NODE_ENV=production.
 */
export const getPortalClient = cache(async (slug: string) => {
  const supabase = createServiceClient()
  const cookieStore = await cookies()
  const session = decodePortalSession(cookieStore.get(PORTAL_COOKIE)?.value)

  if (session && session.clientSlug === slug) {
    const { data } = await supabase
      .from('clients')
      .select(PORTAL_CLIENT_COLUMNS)
      .eq('id', session.clientId)
      .maybeSingle()
    return data?.portal_access ? data : null
  }

  if (process.env.NODE_ENV === 'development') {
    const { data } = await supabase
      .from('clients')
      .select(PORTAL_CLIENT_COLUMNS)
      .eq('slug', slug)
      .maybeSingle()
    return data
  }

  return null
})

/**
 * Portal pages, route handlers and Server Actions all start here. The proxy only
 * gates URLs, and it can't see revoked access, so each entry point checks for itself.
 */
export async function requirePortalClient(slug: string) {
  const client = await getPortalClient(slug)
  if (!client) redirect(`/portal/login?slug=${encodeURIComponent(slug)}`)
  return client
}

/** The client's most recent project — the one the portal is about. */
export async function getLatestProject(clientId: string) {
  const { data } = await createServiceClient()
    .from('projects')
    .select('id, name, status, estimated_completion')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

/** Log the browser in as this client. Call from a Server Action or route handler. */
export async function setPortalSession(session: PortalSession) {
  const cookieStore = await cookies()
  cookieStore.set(PORTAL_COOKIE, encodePortalSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PORTAL_COOKIE_MAX_AGE,
    path: '/portal',
  })
}

/** Turn on portal access and issue a one-time setup token. */
export async function generatePortalToken(clientId: string): Promise<string> {
  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + PORTAL_COOKIE_MAX_AGE * 1000).toISOString()

  const { error } = await createServiceClient()
    .from('clients')
    .update({ portal_access: true, portal_token: token, portal_token_expires_at: expires })
    .eq('id', clientId)

  if (error) throw new Error(`Could not create portal token: ${error.message}`)
  return token
}

/** Validate a token string against the DB. Returns the client row on success. */
export async function validatePortalToken(token: string) {
  const { data } = await createServiceClient()
    .from('clients')
    .select('id, slug, portal_token_expires_at, portal_access')
    .eq('portal_token', token)
    .maybeSingle()

  if (!data?.portal_access || !data.portal_token_expires_at) return null
  if (new Date(data.portal_token_expires_at) < new Date()) return null

  return data
}
