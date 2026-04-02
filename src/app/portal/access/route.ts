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

  // Valid token always goes to setup — lets client set/reset their password
  return NextResponse.redirect(
    new URL(`/portal/setup/${client.slug}?token=${token}`, request.url)
  )
}
