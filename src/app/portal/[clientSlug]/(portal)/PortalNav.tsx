'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '', label: 'Overview' },
  { href: '/questionnaire', label: 'Questionnaire' },
  { href: '/files', label: 'Files' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/timeline', label: 'Timeline' },
]

export function PortalNav({ base }: { base: string }) {
  const pathname = usePathname()

  return (
    <div className="order-last -mx-2 flex w-[calc(100%+1rem)] items-center gap-0.5 overflow-x-auto pb-2 md:order-none md:mx-0 md:w-auto md:pb-0">
      {NAV_ITEMS.map(({ href, label }) => {
        const fullHref = `${base}${href}`
        const isActive = href === ''
          ? pathname === base || pathname === `${base}/`
          : pathname.startsWith(fullHref)

        return (
          <Link
            key={label}
            href={fullHref}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150',
              isActive ? 'bg-amber/15 font-medium text-amber' : 'text-dim hover:text-bone',
            ].join(' ')}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
