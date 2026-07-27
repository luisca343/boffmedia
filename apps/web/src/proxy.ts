import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getValidSubdomain } from '@/lib/subdomain';
import { PATHNAME_HEADER } from '@/i18n/scopes';

// RegExp for public files
const PUBLIC_FILE = /\.(.*)$/; // Files

export async function proxy(req: NextRequest) {
  // Clone the URL
  const url = req.nextUrl.clone();

  // Skip public files
  if (PUBLIC_FILE.test(url.pathname) || url.pathname.includes('_next')) return;

  const host = req.headers.get('host');
  const subdomain = getValidSubdomain(host);

  if (subdomain) {
    // Subdomain available, rewriting
    if (!url.pathname.includes("api")) {
      url.pathname = `/${subdomain}${url.pathname}`;
    }
  }

  // The pathname is the ONLY input to route-scoped message loading (i18n/scopes.ts).
  // Overwrite rather than merge: a client-sent x-pathname must never pick the namespaces.
  // Publish the post-rewrite path so it matches the route that actually renders.
  const headers = new Headers(req.headers);
  headers.set(PATHNAME_HEADER, url.pathname);

  return NextResponse.rewrite(url, { request: { headers } });
}

// Configure which paths should be processed by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};