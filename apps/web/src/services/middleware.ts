import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { USER_ROLES } from "@boffmedia/shared/roles"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Example: Protect admin routes
    if (path.startsWith("/admin") && !token?.roles?.includes(USER_ROLES.BOFF_ADMIN)) {
      return NextResponse.redirect(new URL("/auth/unauthorized", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
}