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
    <div className="flex items-center gap-0">
      {NAV_ITEMS.map(({ href, label }) => {
        const fullHref = `${base}${href}`
        const isActive = href === ''
          ? pathname === base || pathname === `${base}/`
          : pathname.startsWith(fullHref)

        return (
          <Link
            key={label}
            href={fullHref}
            className={[
              'px-4 py-4 font-mono text-xs uppercase tracking-widest transition-colors duration-150',
              isActive
                ? 'text-[#F5F0E8] border-b border-[#C9963A]'
                : 'text-[#555050] hover:text-[#F5F0E8] border-b border-transparent',
            ].join(' ')}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
