import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Handle CORS for Auth0 requests
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    const response = NextResponse.next();

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Do not run middleware for static assets
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};