import Link from 'next/link'
import { Wordmark } from '@/components/brand/Wordmark'
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
    <div className="min-h-screen bg-[radial-gradient(70%_30%_at_50%_-5%,color-mix(in_srgb,var(--color-amber)_8%,transparent),transparent)]">
      <nav className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 px-5">
          <Link href={base} className="py-4">
            <Wordmark className="text-sm" />
          </Link>
          <PortalNav base={base} />
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-dim">{client.company ?? client.name}</span>
            <form action="/portal/logout" method="POST">
              <button type="submit" className="cursor-pointer text-[13px] text-muted transition-colors duration-150 hover:text-amber">
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl animate-rise px-5 py-8 md:py-10">{children}</main>
    </div>
  )
}
