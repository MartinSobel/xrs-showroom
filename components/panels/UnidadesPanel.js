'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import FloatingPanel from './FloatingPanel';

/**
 * Normalize URL — ensure it has a protocol prefix.
 * Without it, the browser treats it as a relative path on localhost.
 */
function normalizeUrl(url) {
  if (!url) return url;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return 'https://' + trimmed;
  }
  return trimmed;
}

/**
 * Unidades Panel — input for an API endpoint URL.
 * When the scene loads (or the URL changes), it fetches the API
 * and prints the response values in the console.
 *
 * Rendered inside RightPanelStack with controlled collapse.
 */
export default function UnidadesPanel({
  scene,
  onUnidadesChange,
  onDataLoaded,
  collapsed,
  onToggle,
}) {
  const unidades = scene?.unidades;

  // Local state for responsive UI
  const [apiUrl, setApiUrl] = useState('');
  const [fetchStatus, setFetchStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [fetchError, setFetchError] = useState(null);
  const hasFetchedRef = useRef(null);

  // Sync from Firebase when scene data arrives/changes
  useEffect(() => {
    if (unidades?.apiUrl !== undefined) {
      setApiUrl(unidades.apiUrl || '');
    }
  }, [unidades]);

  // Auto-fetch API when scene loads with a saved URL
  useEffect(() => {
    const url = unidades?.apiUrl;
    if (!url || hasFetchedRef.current === url) return;
    hasFetchedRef.current = url;
    fetchApi(url);
  }, [unidades?.apiUrl]);

  // Fetch API via server-side proxy (avoids CORS) using POST
  const fetchApi = useCallback(async (url) => {
    if (!url) return;
    setFetchStatus('loading');
    setFetchError(null);
    try {
      console.group('[Unidades] Fetching API');
      console.log('URL:', url);
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || `HTTP ${result.status}`);
      }
      console.log('[Unidades] Response:', result.data);
      console.groupEnd();
      setFetchStatus('ok');
      onDataLoaded?.(result.data);
    } catch (err) {
      console.error('[Unidades] API fetch failed:', err);
      console.groupEnd();
      setFetchStatus('error');
      setFetchError(err.message);
    }
  }, []);

  // Save URL to Firebase (debounced via useScene hook)
  const handleUrlChange = useCallback(
    (e) => {
      const value = e.target.value;
      setApiUrl(value);
      setFetchStatus(null);
      setFetchError(null);
      onUnidadesChange?.({ apiUrl: value });
    },
    [onUnidadesChange]
  );

  // Manual fetch button
  const handleFetch = useCallback(() => {
    if (apiUrl) {
      hasFetchedRef.current = null; // allow re-fetch
      fetchApi(apiUrl);
    }
  }, [apiUrl, fetchApi]);

  return (
    <FloatingPanel
      title="Unidades"
      icon="📊"
      position=""
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <div className="transform-section">
        <div className="transform-section-title">🔗 API Endpoint</div>
        <div className="unidades-input-row">
          <input
            id="unidades-api-url"
            type="text"
            className="unidades-url-input"
            placeholder="https://api.ejemplo.com/unidades"
            value={apiUrl}
            onChange={handleUrlChange}
          />
          <button
            className={`unidades-fetch-btn ${fetchStatus === 'loading' ? 'loading' : ''}`}
            onClick={handleFetch}
            disabled={!apiUrl || fetchStatus === 'loading'}
            title="Fetch API"
          >
            {fetchStatus === 'loading' ? '⏳' : '▶'}
          </button>
        </div>

        {/* Status feedback */}
        {fetchStatus === 'ok' && (
          <div className="unidades-status unidades-status-ok">
            ✅ Respuesta recibida — ver consola del navegador
          </div>
        )}
        {fetchStatus === 'error' && (
          <div className="unidades-status unidades-status-error">
            ❌ {fetchError || 'Error al consultar la API'}
          </div>
        )}

        <div className="unidades-hint">
          Al cargar la escena, se consulta esta API y se imprimen los valores en la consola.
        </div>
      </div>
    </FloatingPanel>
  );
}
