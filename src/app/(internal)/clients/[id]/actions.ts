'use server'

import { getAppUrl } from '@/lib/app-url'
import { generatePortalToken } from '@/lib/portal/auth'
import { requireUser } from '@/lib/supabase/server'

export async function generatePortalLinkAction(clientId: string): Promise<string> {
  await requireUser()
  const token = await generatePortalToken(clientId)
  return `${await getAppUrl()}/portal/access?token=${token}`
}
