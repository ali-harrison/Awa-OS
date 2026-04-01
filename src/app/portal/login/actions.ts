'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PORTAL_COOKIE, PORTAL_COOKIE_MAX_AGE } from '@/lib/portal/auth'
import { verifyPassword } from '@/lib/portal/password'

export async function portalLoginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const slug = formData.get('slug') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createServiceClient()
  const { data: client } = await supabase
    .from('clients')
    .select('id, slug, portal_access, portal_password_hash')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!client || !client.portal_access || !client.portal_password_hash) {
    return { error: 'Invalid email or password.' }
  }

  const valid = await verifyPassword(password, client.portal_password_hash)
  if (!valid) {
    return { error: 'Invalid email or password.' }
  }

  const session = JSON.stringify({ clientId: client.id, clientSlug: client.slug })
  const cookieStore = await cookies()
  cookieStore.set(PORTAL_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PORTAL_COOKIE_MAX_AGE,
    path: '/portal',
  })

  redirect(`/portal/${client.slug}`)
}
