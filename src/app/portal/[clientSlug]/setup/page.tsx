import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { validatePortalToken } from '@/lib/portal/auth'
import SetupFormClient from './SetupFormClient'

export default async function SetupPage({
  searchParams,
}: {
  params: Promise<{ clientSlug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  // Token can come from URL param or the setup cookie set by /portal/access
  const { token: tokenParam } = await searchParams
  const cookieStore = await cookies()
  const token = tokenParam ?? cookieStore.get('portal_setup_token')?.value

  if (!token) redirect('/portal/expired')

  const client = await validatePortalToken(token)
  if (!client) redirect('/portal/expired')

  return <SetupFormClient token={token} />
}
