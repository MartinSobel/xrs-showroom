'use client';

/**
 * LeftPanelStack — full-height side panel anchored to the left edge.
 * Uses a tab bar (below the logo) to switch between content panels.
 * Default active tab is the first one in the `tabs` array.
 */

import { useState, useCallback } from 'react';

export default function LeftPanelStack({ children, title, logoUrl, tabs = [], show = true }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || null);

  const selectTab = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  return (
    <div className={`left-panel-stack${show ? ' stack-entered' : ' stack-hidden'}`}>
      {/* ─── Header with logo ─── */}
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          {logoUrl ? (
            <div className="sidebar-logo">
              <img src={logoUrl} alt={title || 'Logo'} className="sidebar-logo-img" />
            </div>
          ) : (
            <span className="sidebar-scene-label">{title || 'Proyecto'}</span>
          )}
        </div>
      </div>

      {/* ─── Tab bar ─── */}
      {tabs.length > 1 && (
        <div className="sidebar-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => selectTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Tab content ─── */}
      <div className="sidebar-panels">
        {typeof children === 'function' ? children({ activeTab }) : children}
      </div>
    </div>
  );
}
