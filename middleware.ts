import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only handle blog routes with middleware
  if (pathname.startsWith('/blog/')) {
    // Extract locale from cookie or header
    const locale = request.cookies.get('NEXT_LOCALE')?.value || 
                   request.headers.get('x-locale') || 
                   'es';
    
    // Check if this is a blog post route (not the main blog page or RSS)
    const blogPostMatch = pathname.match(/^\/blog\/([^\/]+)$/);
    if (blogPostMatch && blogPostMatch[1] !== 'rss.xml') {
      const postSlug = blogPostMatch[1];
      
      // Rewrite to locale-specific path
      const url = request.nextUrl.clone();
      url.pathname = `/blog/${locale}/${postSlug}`;
      return NextResponse.rewrite(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
