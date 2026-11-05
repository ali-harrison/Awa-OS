import { NextRequest, NextResponse } from 'next/server'
import { PORTAL_COOKIE } from '@/lib/portal/session'

export async function POST(request: NextRequest) {
  // 303 so the browser follows with GET rather than re-POSTing to the login page
  const response = NextResponse.redirect(new URL('/portal/login', request.url), 303)
  response.cookies.set(PORTAL_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/portal',
  })
  return response
}
