import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import { PortalNav } from './PortalNav'

async function getPortalClient(slug: string) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(PORTAL_COOKIE)?.value
  if (!raw) return null

  try {
    const session = JSON.parse(raw)
    if (session.clientSlug !== slug) return null

    const supabase = await createServiceClient()
    const { data } = await supabase
      .from('clients')
      .select('id, name, company, slug, portal_access')
      .eq('id', session.clientId)
      .single()

    if (!data?.portal_access) return null
    return data
  } catch {
    return null
  }
}

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params

  // Check the slug belongs to a real client first
  const supabase = await createServiceClient()
  const { data: exists } = await supabase.from('clients').select('id').eq('slug', clientSlug).single()
  if (!exists) notFound()

  const client = await getPortalClient(clientSlug)

  if (!client) redirect(`/portal/login?slug=${clientSlug}`)

  const base = `/portal/${clientSlug}`

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-mono">
      {/* Top nav */}
      <nav className="border-b border-[#1A1A1A] bg-[#0A0A0A] px-6 py-0 flex items-center justify-between sticky top-0 z-40">
        <Link href={base} className="text-[#F5F0E8] font-mono font-semibold tracking-widest uppercase text-sm py-4">
          AWA/OS
        </Link>
        <PortalNav base={base} />
        <div className="flex items-center gap-4">
          <span className="text-[#555050] font-mono text-xs">{client.company ?? client.name}</span>
          <form action="/portal/logout" method="POST">
            <button
              type="submit"
              className="text-[#555050] hover:text-[#F5F0E8] font-mono text-xs uppercase tracking-widest transition-colors duration-150"
            >
              Log out
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
