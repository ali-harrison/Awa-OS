// src/app/portal/[clientSlug]/setup/page.tsx

import { redirect } from 'next/navigation'
import { validatePortalToken } from '@/lib/portal/auth'
import SetupFormClient from './SetupFormClient'

export default async function SetupPage({
  searchParams,
}: {
  params: Promise<{ clientSlug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    redirect('/portal/expired')
  }

  const client = await validatePortalToken(token)

  if (!client) {
    redirect('/portal/expired')
  }

  // Token is valid — render the form, passing token down as a prop
  return <SetupFormClient token={token} />
}
