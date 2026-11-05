import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { PORTAL_COOKIE, decodePortalSession } from '@/lib/portal/session'

// /portal/<segment> routes that sit alongside the /portal/<clientSlug> tree
const PUBLIC_PORTAL_ROUTES = new Set(['access', 'expired', 'login', 'logout'])

function guardPortal(request: NextRequest) {
  const [, slug, page, ...rest] = request.nextUrl.pathname.split('/').filter(Boolean)

  if (!slug) return NextResponse.redirect(new URL('/portal/login', request.url))
  if (PUBLIC_PORTAL_ROUTES.has(slug)) return NextResponse.next()

  // Setup page — the token in the query string is the credential
  if (page === 'setup' && rest.length === 0) return NextResponse.next()

  // Local preview: see getPortalClient
  if (process.env.NODE_ENV === 'development') return NextResponse.next()

  const session = decodePortalSession(request.cookies.get(PORTAL_COOKIE)?.value)
  if (!session) {
    return NextResponse.redirect(
      new URL(`/portal/login?slug=${encodeURIComponent(slug)}`, request.url)
    )
  }
  if (session.clientSlug !== slug) {
    return NextResponse.redirect(new URL('/portal/expired', request.url))
  }
  return NextResponse.next()
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/portal' || pathname.startsWith('/portal/')) {
    return guardPortal(request)
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    // Only root-level files skip the proxy. A nested pattern here would let a URL
    // like /clients/x.png reach the /clients/[id] page without running it.
    '/((?!_next/static|_next/image|favicon.ico|[^/]+\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
