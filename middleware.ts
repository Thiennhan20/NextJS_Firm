import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware configuration
 * Limited to specific routes to avoid slowing down document requests
 */
export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

// Only run middleware on specific routes to avoid slowing down all requests
export const config = {
  matcher: [
    '/api/:path*',
    '/login',
    '/register',
  ],
}
