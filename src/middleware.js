import { NextResponse } from 'next/server';

export async function middleware(request) {
  // For now, just allow all requests to pass through
  // We'll handle auth on the client side with UserProvider
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Do not run middleware for static assets
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};