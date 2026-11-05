import { NextRequest, NextResponse } from 'next/server'
import { validatePortalToken } from '@/lib/portal/auth'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const client = token ? await validatePortalToken(token) : null

  if (!token || !client) {
    return NextResponse.redirect(new URL('/portal/expired', request.url))
  }

  return NextResponse.redirect(
    new URL(`/portal/${client.slug}/setup?token=${encodeURIComponent(token)}`, request.url)
  )
}
