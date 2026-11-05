import { redirect } from 'next/navigation'
import { validatePortalToken } from '@/lib/portal/auth'
import SetupFormClient from './SetupFormClient'

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token || !(await validatePortalToken(token))) redirect('/portal/expired')

  return <SetupFormClient token={token} />
}
