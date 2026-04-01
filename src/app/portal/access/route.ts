import { NextRequest, NextResponse } from 'next/server'
import { validatePortalToken } from '@/lib/portal/auth'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/portal/expired', request.url))
  }

  const client = await validatePortalToken(token)

  if (!client) {
    return NextResponse.redirect(new URL('/portal/expired', request.url))
  }

  // First visit — no password set yet → go to setup
  if (!client.portal_password_hash) {
    return NextResponse.redirect(
      new URL(`/portal/${client.slug}/setup?token=${token}`, request.url)
    )
  }

  // Password already set → go to login
  return NextResponse.redirect(
    new URL(`/portal/login?slug=${client.slug}`, request.url)
  )
}
