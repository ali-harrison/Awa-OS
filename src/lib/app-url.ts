import { headers } from 'next/headers'

/** Origin of the current request, so links in emails always point at this deployment. */
export async function getAppUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}
