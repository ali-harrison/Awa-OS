'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { setPortalSession, validatePortalToken } from '@/lib/portal/auth'
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

  // One update, so the token is only burned if the password actually saved
  const { error } = await createServiceClient()
    .from('clients')
    .update({
      portal_password_hash: await hashPassword(password),
      portal_token: null,
      portal_token_expires_at: null,
    })
    .eq('id', client.id)

  if (error) {
    return { error: 'Something went wrong saving your password. Please try again.' }
  }

  await setPortalSession({ clientId: client.id, clientSlug: client.slug })
  redirect(`/portal/${client.slug}`)
}
