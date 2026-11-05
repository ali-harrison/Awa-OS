'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/supabase/server'
import { logActivity } from '@/lib/logger'
import type { ClientType, ClientStatus } from '@/types'

function generateSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Māori → maori, not mori
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function clientFields(formData: FormData) {
  return {
    name: (formData.get('name') as string)?.trim(),
    email: (formData.get('email') as string)?.trim().toLowerCase(),
    phone: (formData.get('phone') as string) || null,
    company: (formData.get('company') as string) || null,
    type: ((formData.get('type') as string) || 'other') as ClientType,
    status: ((formData.get('status') as string) || 'lead') as ClientStatus,
  }
}

export async function createClientAction(formData: FormData): Promise<{ error: string } | null> {
  const { supabase } = await requireUser()

  const fields = clientFields(formData)
  if (!fields.name || !fields.email) return { error: 'Name and email are required.' }

  // Always suffixed, which also keeps slugs clear of the /portal/login-style routes
  const slug = `${generateSlug(fields.company || fields.name)}-${Date.now().toString(36)}`

  const { data: created, error } = await supabase
    .from('clients')
    .insert({ ...fields, slug, portal_access: false })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logActivity({ type: 'audit', entity: 'client', entity_id: created.id, action: 'created', meta: { name: fields.name, email: fields.email } })

  revalidatePath('/clients')
  return null
}

export async function updateClientAction(formData: FormData): Promise<{ error: string } | null> {
  const { supabase } = await requireUser()

  const id = formData.get('id') as string
  const fields = clientFields(formData)
  if (!fields.name || !fields.email) return { error: 'Name and email are required.' }

  const { error } = await supabase.from('clients').update(fields).eq('id', id)
  if (error) return { error: error.message }

  await logActivity({ type: 'audit', entity: 'client', entity_id: id, action: 'updated', meta: { name: fields.name, email: fields.email } })

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return null
}

export async function togglePortalAccessAction(id: string, current: boolean) {
  const { supabase } = await requireUser()
  await supabase.from('clients').update({ portal_access: !current }).eq('id', id)
  revalidatePath(`/clients/${id}`)
}
