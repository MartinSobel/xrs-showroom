import { NextResponse } from 'next/server';

/**
 * Middleware — currently a passthrough.
 * 
 * COOP/COEP headers are disabled to allow Firebase Storage cross-origin fetches.
 * Three.js and Spark work without SharedArrayBuffer (WASM decoders use single-thread fallback).
 * 
 * To re-enable for full WASM threading performance, uncomment the headers below
 * and configure Firebase Storage CORS rules.
 */
export function middleware(request) {
  const response = NextResponse.next();

  // Uncomment when Firebase Storage CORS is configured:
  // if (request.nextUrl.pathname.startsWith('/scenes')) {
  //   response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  //   response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  // }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
