'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Mail,
  Users,
  Wallet,
  Waves,
} from 'lucide-react'
import { Wordmark } from '@/components/brand/Wordmark'
import { sidebarPath, sidebarX } from '@/components/river/geometry'
import { signOut } from '@/lib/supabase/actions'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/pipeline', label: 'Pipeline', icon: Waves },
  { href: '/finances', label: 'Finances', icon: Wallet },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/emails', label: 'Emails', icon: Mail },
  { href: '/admin/history', label: 'History', icon: History },
] as const

const ROW_PITCH = 44 // px per nav row; the river and bead are drawn from this
const RIVER_HEIGHT = NAV_ITEMS.length * ROW_PITCH

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`)

export function Sidebar() {
  const pathname = usePathname()
  const activeIndex = NAV_ITEMS.findIndex(({ href }) => isActive(pathname, href))
  const beadY = activeIndex * ROW_PITCH + ROW_PITCH / 2

  return (
    <>
      {/* Desktop: the river runs down the rail, and a bead of light marks where you are */}
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-line md:flex">
        <div className="px-6 pt-7 pb-8">
          <Wordmark className="text-[15px]" />
          <p className="mt-1 text-xs text-dim">Te Wairama Digital</p>
        </div>

        <nav className="relative flex-1 px-3">
          <svg
            aria-hidden
            width="20"
            height={RIVER_HEIGHT}
            className="absolute top-0 left-3 [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]"
          >
            <path d={sidebarPath(RIVER_HEIGHT)} fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" />
            <path d={sidebarPath(RIVER_HEIGHT)} className="river-flow" stroke="var(--color-amber)" strokeWidth="2" />
          </svg>

          {activeIndex >= 0 && (
            <span
              aria-hidden
              className="river-bead river-bead-pulse z-10 !size-2.5 transition-all duration-500 ease-[cubic-bezier(0.3,1.4,0.5,1)]"
              style={{ left: 12 + sidebarX(beadY), top: beadY }}
            />
          )}

          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                style={{ height: ROW_PITCH }}
                className={[
                  'ml-6 flex items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150',
                  active ? 'font-medium text-bone' : 'text-dim hover:text-bone',
                ].join(' ')}
              >
                <Icon size={17} strokeWidth={1.75} className={active ? 'text-amber' : ''} />
                {label}
              </Link>
            )
          })}
        </nav>

        <form action={signOut} className="border-t border-line px-4 py-3">
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-dim transition-colors duration-150 hover:text-coral"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Sign out
          </button>
        </form>
      </aside>

      {/* Phones and small tablets */}
      <div className="shrink-0 border-b border-line md:hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <Wordmark className="text-sm" />
          <form action={signOut}>
            <button type="submit" className="cursor-pointer text-[13px] text-dim hover:text-coral">
              Sign out
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                'shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors',
                isActive(pathname, href) ? 'bg-amber/15 font-medium text-amber' : 'text-dim',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
