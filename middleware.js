import { NextResponse } from 'next/server';

// Firebase Hosting only preserves a cookie named "__session" — all others are stripped.
const SESSION_COOKIE = '__session';

/**
 * Protected routes — require auth cookie.
 * /view/* is public (client-facing showroom).
 * /login and /api/* are always accessible.
 */
function isProtectedRoute(pathname) {
  // Always allow these
  if (pathname.startsWith('/login')) return false;
  if (pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/view/')) return false;
  if (pathname.startsWith('/view')) return false;

  // Protect exact match "/" and anything under /scenes
  if (pathname === '/') return true;
  if (pathname.startsWith('/scenes')) return true;

  return false;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── Auth check ──
  if (isProtectedRoute(pathname)) {
    const session = request.cookies.get(SESSION_COOKIE);

    if (!session?.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: Full HMAC token verification happens in the API route.
    // The middleware only checks for cookie presence. The token is
    // HMAC-signed so it can't be forged, and it has a 7-day expiry
    // built into the cookie maxAge.
  }

  const response = NextResponse.next();

  // Uncomment when Firebase Storage CORS is configured:
  // if (pathname.startsWith('/scenes')) {
  //   response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  //   response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  // }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
