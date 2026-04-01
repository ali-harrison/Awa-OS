'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/supabase/actions'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { href: '/clients', label: 'Clients', icon: '◈' },
  { href: '/projects', label: 'Projects', icon: '◧' },
  { href: '/pipeline', label: 'Pipeline', icon: '◫' },
  { href: '/finances', label: 'Finances', icon: '◆' },
  { href: '/calendar', label: 'Calendar', icon: '◻' },
  { href: '/emails', label: 'Emails', icon: '◇' },
  { href: '/admin/history', label: 'History', icon: '◎' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 flex-shrink-0 bg-[#0A0A0A] border-r border-[#1A1A1A] flex flex-col h-full">
      {/* Wordmark */}
      <div className="px-4 py-5 border-b border-[#1A1A1A]">
        <span className="text-[#F5F0E8] font-mono font-semibold text-sm tracking-widest uppercase">
          AWA/OS
        </span>
        <span className="block text-[#555050] font-mono text-[10px] tracking-wider uppercase mt-0.5">
          Te Wairama Digital
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-4 py-2.5',
                'text-xs font-mono tracking-wide uppercase',
                'transition-all duration-150',
                'border-l-2',
                isActive
                  ? 'text-[#F5F0E8] bg-[#111111] border-l-[#C9963A]'
                  : 'text-[#555050] border-l-transparent hover:text-[#8A8580] hover:bg-[#111111]',
              ].join(' ')}
            >
              <span className="text-base leading-none w-4 text-center">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1A1A1A]">
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs font-mono text-[#555050] hover:text-[#E05252] transition-colors duration-150 uppercase tracking-wide cursor-pointer"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
