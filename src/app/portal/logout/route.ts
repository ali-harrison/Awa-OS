import { NextRequest, NextResponse } from 'next/server'
import { PORTAL_COOKIE } from '@/lib/portal/auth'

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/portal/login', request.url))
  response.cookies.set(PORTAL_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/portal',
  })
  return response
}
