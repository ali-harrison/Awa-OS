import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

export const PORTAL_COOKIE = 'portal_session'
export const PORTAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface PortalSession {
  clientId: string
  clientSlug: string
}

/** Read and validate the portal session cookie. Returns null if invalid/expired. */
export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(PORTAL_COOKIE)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PortalSession
    if (!parsed.clientId || !parsed.clientSlug) return null
    return parsed
  } catch {
    return null
  }
}

/** Generate a new portal access token for a client and store it in the DB. */
export async function generatePortalToken(clientId: string): Promise<string> {
  const supabase = await createServiceClient()
  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + PORTAL_COOKIE_MAX_AGE * 1000).toISOString()

  await supabase
    .from('clients')
    .update({ portal_token: token, portal_token_expires_at: expires })
    .eq('id', clientId)

  return token
}

/** Validate a token string against the DB. Returns the client row on success. */
export async function validatePortalToken(token: string) {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('clients')
    .select('id, slug, portal_token, portal_token_expires_at, portal_access, portal_password_hash')
    .eq('portal_token', token)
    .single()

  if (!data) return null
  if (!data.portal_access) return null
  if (!data.portal_token_expires_at) return null
  if (new Date(data.portal_token_expires_at) < new Date()) return null

  return data
}
