import Link from 'next/link'
import { requirePortalClient } from '@/lib/portal/auth'
import { PortalNav } from './PortalNav'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await requirePortalClient(clientSlug)
  const base = `/portal/${clientSlug}`

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-mono">
      <nav className="border-b border-[#1A1A1A] bg-[#0A0A0A] px-6 py-0 flex flex-wrap items-center justify-between sticky top-0 z-40">
        <Link href={base} className="text-[#F5F0E8] font-mono font-semibold tracking-widest uppercase text-sm py-4">
          AWA/OS
        </Link>
        <PortalNav base={base} />
        <div className="flex items-center gap-4">
          <span className="text-[#555050] font-mono text-xs">{client.company ?? client.name}</span>
          <form action="/portal/logout" method="POST">
            <button
              type="submit"
              className="text-[#555555] hover:text-[#f59e0b] font-mono text-xs uppercase tracking-widest transition-colors duration-150 cursor-pointer"
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
