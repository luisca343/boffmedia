import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Set pathname header for i18n route-specific namespace loading
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-pathname', path)
    requestHeaders.set('x-url', req.url)

    // Example: Protect admin routes
    if (path.startsWith("/admin") && !token?.roles?.includes("ADMIN")) {
      return NextResponse.redirect(new URL("/auth/unauthorized", req.url))
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (img, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|img/).*)',
  ],
}