'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { setPortalSession } from '@/lib/portal/auth'
import { verifyPassword } from '@/lib/portal/password'

export async function portalLoginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const slug = formData.get('slug') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { data } = await createServiceClient()
    .from('clients')
    .select('id, slug, email, portal_access, portal_password_hash')
    .ilike('email', email)

  // ilike treats _ and % as wildcards, so confirm the match. Emails aren't unique —
  // one person can run two client accounts — so try the one they came from first.
  const accounts = (data ?? [])
    .filter((c) => c.email.toLowerCase() === email && c.portal_access)
    .sort((a, b) => Number(b.slug === slug) - Number(a.slug === slug))

  if (accounts.length === 0) {
    return { error: 'Invalid email or password.' }
  }

  if (accounts.every((c) => !c.portal_password_hash)) {
    return { error: 'Your account isn\'t set up yet. Please use the setup link from your welcome email.' }
  }

  for (const account of accounts) {
    if (account.portal_password_hash && (await verifyPassword(password, account.portal_password_hash))) {
      await setPortalSession({ clientId: account.id, clientSlug: account.slug })
      redirect(`/portal/${account.slug}`)
    }
  }

  return { error: 'Invalid email or password.' }
}
