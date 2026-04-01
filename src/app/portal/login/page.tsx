import { LoginFormClient } from './LoginFormClient'

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>
}) {
  const { slug } = await searchParams

  return <LoginFormClient slug={slug ?? ''} />
}
