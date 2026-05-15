'use client';

import { useEffect, useState } from 'react';
import versionData from '@/version.json';

/**
 * Floating, collapsible panel shown ONLY on the staging host. Surfaces the
 * current version + the unreleased features from version.json so testers know
 * they're not on production and what changed since the last prod release.
 */

const STAGING_HOST_HINTS = ['-staging.web.app', '-staging.firebaseapp.com'];

function isStagingHost() {
  if (typeof window === 'undefined') return false;
  const host = window.location.host.toLowerCase();
  return STAGING_HOST_HINTS.some((hint) => host.includes(hint));
}

export default function StagingBanner() {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isStaging, setIsStaging] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsStaging(isStagingHost());
  }, []);

  if (!mounted || !isStaging) return null;

  const features = Array.isArray(versionData.features) ? versionData.features : [];

  return (
    <div className={`staging-banner${collapsed ? ' staging-banner-collapsed' : ''}`}>
      <button
        type="button"
        className="staging-banner-toggle"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? 'Expandir panel de staging' : 'Colapsar panel de staging'}
      >
        <span className="staging-banner-pill">STAGING</span>
        <span className="staging-banner-version">v{versionData.version}</span>
        <span className="staging-banner-chevron">{collapsed ? '◂' : '▸'}</span>
      </button>
      {!collapsed && (
        <div className="staging-banner-body">
          <div className="staging-banner-meta">
            Build {versionData.buildDate} · {versionData.commitHash}
          </div>
          <div className="staging-banner-title">Cambios desde la última release</div>
          {features.length > 0 ? (
            <ul className="staging-banner-list">
              {features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <div className="staging-banner-empty">Sin features registrados.</div>
          )}
          <div className="staging-banner-foot">
            Esta es una versión de staging. No la compartas con clientes.
          </div>
        </div>
      )}
    </div>
  );
}
