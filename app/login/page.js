'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-container" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[LOGIN] handleSubmit triggered');
    if (!password.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      console.log('[LOGIN] Fetching /api/auth …');
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      console.log('[LOGIN] Response status:', res.status);
      const data = await res.json();
      console.log('[LOGIN] Response data:', data);

      if (res.ok) {
        // Redirect to the page they originally wanted (or home)
        const from = searchParams.get('from') || '/';
        console.log('[LOGIN] Success — redirecting to:', from);
        router.push(from);
      } else {
        setError(data.error || 'Error de autenticación');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPassword('');
      }
    } catch (err) {
      console.error('[LOGIN] Fetch error:', err);
      setError('Error de conexión');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Ambient background glow */}
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      <form
        className={`login-card animate-fade${shake ? ' login-shake' : ''}`}
        onSubmit={handleSubmit}
      >
        <div className="login-header">
          <div className="login-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
              <path
                d="M10 16L14 12L18 16L14 20Z"
                fill="rgba(255,255,255,0.9)"
              />
              <path
                d="M16 12L20 8L24 12L20 16Z"
                fill="rgba(255,255,255,0.6)"
              />
              <path
                d="M16 20L20 16L24 20L20 24Z"
                fill="rgba(255,255,255,0.35)"
              />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#4488ff" />
                  <stop offset="1" stopColor="#9966ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>XRS Showroom</h1>
          <p>Ingresá la contraseña para continuar</p>
        </div>

        <div className="login-body">
          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              <span className="login-error-icon">⚠</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={!password.trim() || loading}
          >
            {loading ? (
              <span className="login-btn-spinner" />
            ) : (
              'Ingresar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
