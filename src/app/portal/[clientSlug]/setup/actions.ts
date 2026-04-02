'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { validatePortalToken, PORTAL_COOKIE, PORTAL_COOKIE_MAX_AGE } from '@/lib/portal/auth'
import { hashPassword } from '@/lib/portal/password'

export async function setupPasswordAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match.' }
  }

  const client = await validatePortalToken(token)
  if (!client) {
    return { error: 'This setup link has expired. Please request a new one.' }
  }

  const hash = await hashPassword(password)
  const supabase = await createServiceClient()
  await supabase
    .from('clients')
    .update({ portal_password_hash: hash })
    .eq('id', client.id)

  // Burn the token — one-time use only
  await supabase
    .from('clients')
    .update({ portal_token: null, portal_token_expires_at: null })
    .eq('id', client.id)

  // Set session cookie and clear the temporary setup cookie
  const session = JSON.stringify({ clientId: client.id, clientSlug: client.slug })
  const cookieStore = await cookies()
  cookieStore.set('portal_setup_token', '', { maxAge: 0, path: '/portal' })
  cookieStore.set(PORTAL_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PORTAL_COOKIE_MAX_AGE,
    path: '/portal',
  })

  redirect(`/portal/${client.slug}`)
}
