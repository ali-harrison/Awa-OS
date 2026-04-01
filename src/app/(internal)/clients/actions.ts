'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/logger'
import type { ClientType, ClientStatus } from '@/types'

function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function createClientAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = (formData.get('phone') as string) || null
  const company = (formData.get('company') as string) || null
  const type = formData.get('type') as ClientType
  const status = formData.get('status') as ClientStatus

  if (!name || !email) return { error: 'Name and email are required.' }

  const slug = generateSlug(company || name)

  const supabase = await createSupabaseClient()

  // Handle slug collision by appending timestamp
  const finalSlug = `${slug}-${Date.now().toString(36)}`

  const { error } = await supabase.from('clients').insert({
    name, email, phone, company, type, status,
    slug: finalSlug,
    portal_access: false,
  })

  if (error) return { error: error.message }

  const { data: created } = await supabase.from('clients').select('id').eq('slug', finalSlug).single()
  await logActivity({ type: 'audit', entity: 'client', entity_id: created?.id, action: 'created', meta: { name, email } })

  revalidatePath('/clients')
  return null
}

export async function updateClientAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = (formData.get('phone') as string) || null
  const company = (formData.get('company') as string) || null
  const type = formData.get('type') as ClientType
  const status = formData.get('status') as ClientStatus

  if (!name || !email) return { error: 'Name and email are required.' }

  const supabase = await createSupabaseClient()
  const { error } = await supabase
    .from('clients')
    .update({ name, email, phone, company, type, status })
    .eq('id', id)

  if (error) return { error: error.message }

  await logActivity({ type: 'audit', entity: 'client', entity_id: id, action: 'updated', meta: { name, email } })

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return null
}

export async function togglePortalAccessAction(id: string, current: boolean) {
  const supabase = await createSupabaseClient()
  await supabase.from('clients').update({ portal_access: !current }).eq('id', id)
  revalidatePath(`/clients/${id}`)
}
