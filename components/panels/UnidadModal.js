'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * UnidadModal — fullscreen modal showing unit details.
 * Left: info table + action buttons. Right: large floor plan image.
 */
export default function UnidadModal({ unit, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!unit || !mounted) return null;

  return createPortal(
    <div className="unidad-modal-overlay" onClick={onClose}>
      <div className="unidad-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="unidad-modal-close" onClick={onClose} title="Cerrar">
          ✕
        </button>

        {/* Left: Info */}
        <div className="unidad-modal-info">
          <h2 className="unidad-modal-title">Unidad {unit.id || '—'}</h2>

          <div className="unidad-modal-row">
            <span className="unidad-modal-label">Piso</span>
            <span className="unidad-modal-value">{unit.floor || '—'}</span>
          </div>

          <div className="unidad-modal-divider" />

          <div className="unidad-modal-row">
            <span className="unidad-modal-label">Orientación</span>
            <span className="unidad-modal-value">{unit.banoPrincipal || '—'}</span>
          </div>
          <div className="unidad-modal-row">
            <span className="unidad-modal-label">Superficie cubierta</span>
            <span className="unidad-modal-value">{unit.supCubierta ?? '—'} m²</span>
          </div>
          <div className="unidad-modal-row">
            <span className="unidad-modal-label">Superficie semicubierta</span>
            <span className="unidad-modal-value">{unit.supSemiCubierta ?? '—'} m²</span>
          </div>
          <div className="unidad-modal-row">
            <span className="unidad-modal-label">Superficie amenities</span>
            <span className="unidad-modal-value">{unit.supAmenities ?? '—'} m²</span>
          </div>
          <div className="unidad-modal-row unidad-modal-row-total">
            <span className="unidad-modal-label">Superficie total</span>
            <span className="unidad-modal-value">{unit.supTotal ?? '—'} m²</span>
          </div>

          <div className="unidad-modal-actions">
            <button className="unidad-modal-btn unidad-modal-btn-panorama">
              Vista Panorámica
            </button>
            <button className="unidad-modal-btn unidad-modal-btn-whatsapp">
              Hablemos por WhatsApp
            </button>
          </div>
        </div>

        {/* Right: Floor plan image */}
        <div className="unidad-modal-plan">
          {unit.file ? (
            <img src={unit.file} alt={`Plano ${unit.id}`} />
          ) : (
            <div className="unidad-modal-plan-empty">
              <span>🏠</span>
              <p>Sin plano disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
