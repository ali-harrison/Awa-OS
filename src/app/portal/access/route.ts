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

  // Set a short-lived setup cookie so the [clientSlug] layout skips auth
  const response = NextResponse.redirect(
    new URL(`/portal/${client.slug}/setup?token=${token}`, request.url)
  )
  response.cookies.set('portal_setup_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes — just enough to complete setup
    path: '/portal',
  })
  return response
}
