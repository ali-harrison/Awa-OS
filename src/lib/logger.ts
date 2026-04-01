'use server'

import { createClient } from '@/lib/supabase/server'

interface LogActivityParams {
  type: 'email' | 'audit' | 'change'
  entity?: string
  entity_id?: string
  action?: string
  meta?: Record<string, unknown>
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('activity_log').insert({
      type: params.type,
      entity: params.entity ?? null,
      entity_id: params.entity_id ?? null,
      action: params.action ?? null,
      meta: params.meta ?? {},
      performed_by: user?.id ?? null,
    })
  } catch (err) {
    console.error('[logActivity] failed silently:', err)
  }
}
