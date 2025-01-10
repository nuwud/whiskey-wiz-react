import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Protected routes - must be logged in
  if (path.startsWith('/player')) {
    // Check auth status
    const session = request.cookies.get('session')
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  // Admin routes - must be admin
  if (path.startsWith('/admin')) {
    const session = request.cookies.get('session')
    const isAdmin = request.cookies.get('admin')
    if (!session || !isAdmin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/player/:path*', '/admin/:path*'],
}