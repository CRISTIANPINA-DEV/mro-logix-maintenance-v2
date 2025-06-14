import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withAuth } from "next-auth/middleware"

// List of public paths that don't require authentication
const publicPaths = [
  '/api/auth',
  '/signin',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
]

// List of paths that don't require company access
const nonCompanyPaths = [
  '/api/auth',
  '/api/company/register',
  '/api/company/verify-domain',
  '/company/register'
]

export default withAuth(
  function middleware(request) {
    const path = request.nextUrl.pathname

    // Allow non-company paths for authenticated users
    if (nonCompanyPaths.some(nonCompanyPath => path.startsWith(nonCompanyPath))) {
      return NextResponse.next()
    }

    // Add user context to request headers if token exists
    const token = request.nextauth.token
    if (token) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', token.id || '') 
      requestHeaders.set('x-user-email', token.email || '')

      // Return response with modified headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Allow public paths
        if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
          return true
        }
        
        // Require authentication for all other paths
        return !!token
      },
    },
    pages: {
      signIn: '/signin',
    },
  }
)

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 