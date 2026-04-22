'use client';

import { useState, useCallback } from 'react';
import FloatingPanel from './FloatingPanel';
import UnidadesCargaModal from './UnidadesCargaModal';

/**
 * Unidades Panel — shows unit count and button to open the data management modal.
 * Replaces the old API endpoint approach with direct Firebase-backed data entry.
 *
 * Rendered inside RightPanelStack with controlled collapse.
 */
export default function UnidadesPanel({
  scene,
  sceneId,
  onUnidadesChange,
  collapsed,
  onToggle,
}) {
  const [showModal, setShowModal] = useState(false);

  const items = scene?.unidades?.items || [];

  const handleSave = useCallback(async (newItems) => {
    await onUnidadesChange?.({ items: newItems });
  }, [onUnidadesChange]);

  return (
    <>
      <FloatingPanel
        title="Configuración"
        icon="⚙️"
        position=""
        collapsed={collapsed}
        onToggle={onToggle}
      >
        <div className="transform-section">
          <div className="transform-section-title">📋 Unidades</div>

          <div className="unidades-summary">
            <div className="unidades-summary-count">
              <span className="unidades-summary-number">{items.length}</span>
              <span className="unidades-summary-label">
                {items.length === 1 ? 'unidad' : 'unidades'}
              </span>
            </div>

            <button
              className="unidades-manage-btn"
              onClick={() => setShowModal(true)}
            >
              {items.length > 0 ? 'Editar' : '➕ Cargar Unidades'}
            </button>
          </div>

          <div className="unidades-hint">
            Abrí el editor para agregar, editar o importar unidades via CSV.
          </div>
        </div>
      </FloatingPanel>

      {/* Units data management modal */}
      {showModal && (
        <UnidadesCargaModal
          items={items}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
