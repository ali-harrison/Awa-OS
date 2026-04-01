'use server'

import { generatePortalToken } from '@/lib/portal/auth'

export async function generatePortalLinkAction(clientId: string): Promise<string> {
  const token = await generatePortalToken(clientId)
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  return `${base}/portal/access?token=${token}`
}
