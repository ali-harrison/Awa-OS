import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { PORTAL_COOKIE } from '@/lib/portal/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Portal routes (/portal/*) ───────────────────────────────────────────────
  // Public portal routes — no auth needed
  if (
    pathname.startsWith('/portal/access') ||
    pathname.startsWith('/portal/expired') ||
    pathname.startsWith('/portal/login')
  ) {
    return NextResponse.next()
  }

  // Setup page — token in query string acts as auth, no cookie needed
  if (pathname.match(/^\/portal\/[^/]+\/setup$/)) {
    return NextResponse.next()
  }

  // All other /portal/* routes require a valid portal_session cookie
  if (pathname.startsWith('/portal/')) {
    const cookie = request.cookies.get(PORTAL_COOKIE)?.value
    if (!cookie) {
      // Extract slug from URL to redirect back after login
      const slugMatch = pathname.match(/^\/portal\/([^/]+)/)
      const slug = slugMatch?.[1] ?? ''
      return NextResponse.redirect(new URL(`/portal/login?slug=${slug}`, request.url))
    }
    try {
      const session = JSON.parse(cookie)
      const slugMatch = pathname.match(/^\/portal\/([^/]+)/)
      if (slugMatch && slugMatch[1] !== session.clientSlug) {
        return NextResponse.redirect(new URL('/portal/expired', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/portal/login', request.url))
    }
    return NextResponse.next()
  }

  // ── Internal routes — Supabase auth ────────────────────────────────────────
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
