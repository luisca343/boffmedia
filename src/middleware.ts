import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getValidSubdomain } from '@/lib/subdomain';
import { withAuth } from "next-auth/middleware";

// RegExp for public files
const PUBLIC_FILE = /\.(.*)$/; // Files

export default withAuth(
  async function middleware(req) {
    // Clone the URL
    const url = req.nextUrl.clone();

    // Skip public files
    if (PUBLIC_FILE.test(url.pathname) || url.pathname.includes('_next')) {
      return NextResponse.next();
    }

    const host = req.headers.get('host');
    const subdomain = getValidSubdomain(host);

    if (subdomain) {
      // Subdomain available, rewriting
      if (!url.pathname.includes("api")) {
        url.pathname = `/${subdomain}${url.pathname}`;
      }
    }

    /*
    // Authentication and role-based access control
    const token = req.nextauth.token;
    const path = url.pathname;

    if (path.startsWith("/admin") && !token?.roles?.includes("ADMIN")) {
      return NextResponse.redirect(new URL("/auth/unauthorized", req.url));
    }*/

    return NextResponse.rewrite(url);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    "/admin/:path*",
    "/dashboard/:path*"
  ],
};