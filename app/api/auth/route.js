import { NextResponse } from 'next/server';
import { createToken } from '@/lib/session';

// Firebase Hosting only preserves a cookie named "__session" — all others are stripped.
const SESSION_COOKIE = '__session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * POST /api/auth — validate password, set signed session cookie.
 */
export async function POST(request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('[Auth] ADMIN_PASSWORD not set in env');
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Generate HMAC-signed token (verifiable without DB)
    const token = await createToken(adminPassword);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (err) {
    console.error('[Auth] Error:', err.message);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

/**
 * DELETE /api/auth — clear session cookie (logout).
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
