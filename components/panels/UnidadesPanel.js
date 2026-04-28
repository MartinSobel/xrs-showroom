'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import FloatingPanel from './FloatingPanel';
import UnidadesCargaModal from './UnidadesCargaModal';
import AmenitiesModal from './AmenitiesModal';
import { updateScene } from '@/lib/scenes';
import { uploadAsset as storageUpload, deleteAsset as storageDelete } from '@/lib/storage';

/**
 * Configuración Panel — manages Unidades and Amenities data entry.
 * Houses buttons to open each respective data management modal.
 *
 * Rendered inside RightPanelStack with controlled collapse.
 */
export default function UnidadesPanel({
  scene,
  sceneId,
  onUnidadesChange,
  onAmenitiesChange,
  collapsed,
  onToggle,
}) {
  const [showUnidadesModal, setShowUnidadesModal] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [panelLogoUrl, setPanelLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const whatsappTimer = useRef(null);
  const logoInputRef = useRef(null);

  const unidadItems = scene?.unidades?.items || [];
  const amenityItems = scene?.amenities?.items || [];

  // Sync WhatsApp number from scene data
  useEffect(() => {
    if (scene?.whatsappNumber !== undefined) {
      setWhatsappNumber(scene.whatsappNumber || '');
    }
  }, [scene?.whatsappNumber]);

  // Sync panel logo URL from scene data
  useEffect(() => {
    if (scene?.panelLogoUrl !== undefined) {
      setPanelLogoUrl(scene.panelLogoUrl || '');
    }
  }, [scene?.panelLogoUrl]);

  const handleWhatsappChange = useCallback((value) => {
    setWhatsappNumber(value);
    if (!sceneId) return;
    if (whatsappTimer.current) clearTimeout(whatsappTimer.current);
    whatsappTimer.current = setTimeout(() => {
      updateScene(sceneId, { whatsappNumber: value }).catch(console.error);
    }, 800);
  }, [sceneId]);

  const handleLogoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !sceneId) return;

    // Validate image type
    if (!file.type.startsWith('image/')) return;

    setLogoUploading(true);
    setLogoProgress(0);

    try {
      // Delete old logo if exists
      if (scene?.panelLogoFileName) {
        await storageDelete(sceneId, 'logo', scene.panelLogoFileName).catch(() => {});
      }

      const result = await storageUpload(sceneId, 'logo', file, (progress) => {
        setLogoProgress(progress);
      });

      setPanelLogoUrl(result.url);
      await updateScene(sceneId, {
        panelLogoUrl: result.url,
        panelLogoFileName: result.fileName,
      });
    } catch (err) {
      console.error('Logo upload failed:', err);
    } finally {
      setLogoUploading(false);
      setLogoProgress(0);
      // Reset input so the same file can be re-selected
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }, [sceneId, scene?.panelLogoFileName]);

  const handleLogoRemove = useCallback(async () => {
    if (!sceneId) return;

    try {
      if (scene?.panelLogoFileName) {
        await storageDelete(sceneId, 'logo', scene.panelLogoFileName).catch(() => {});
      }
      setPanelLogoUrl('');
      await updateScene(sceneId, {
        panelLogoUrl: '',
        panelLogoFileName: '',
      });
    } catch (err) {
      console.error('Logo remove failed:', err);
    }
  }, [sceneId, scene?.panelLogoFileName]);

  const handleUnidadesSave = useCallback(async (newItems) => {
    await onUnidadesChange?.({ items: newItems });
  }, [onUnidadesChange]);

  const handleAmenitiesSave = useCallback(async (newItems) => {
    await onAmenitiesChange?.({ items: newItems });
  }, [onAmenitiesChange]);

  return (
    <>
      <FloatingPanel
        title="Configuración"
        icon="⚙️"
        position=""
        collapsed={collapsed}
        onToggle={onToggle}
      >
        {/* Unidades section */}
        <div className="transform-section">
          <div className="transform-section-title">📋 Unidades</div>

          <div className="unidades-summary">
            <div className="unidades-summary-count">
              <span className="unidades-summary-number">{unidadItems.length}</span>
              <span className="unidades-summary-label">
                {unidadItems.length === 1 ? 'unidad' : 'unidades'}
              </span>
            </div>

            <button
              className="unidades-manage-btn"
              onClick={() => setShowUnidadesModal(true)}
            >
              {unidadItems.length > 0 ? 'Editar' : '➕ Cargar'}
            </button>
          </div>
        </div>

        {/* Amenities section */}
        <div className="transform-section">
          <div className="transform-section-title">🏊 Amenities</div>

          <div className="unidades-summary">
            <div className="unidades-summary-count">
              <span className="unidades-summary-number">{amenityItems.length}</span>
              <span className="unidades-summary-label">
                {amenityItems.length === 1 ? 'amenity' : 'amenities'}
              </span>
            </div>

            <button
              className="unidades-manage-btn"
              onClick={() => setShowAmenitiesModal(true)}
            >
              {amenityItems.length > 0 ? 'Editar' : '➕ Cargar'}
            </button>
          </div>
        </div>

        {/* WhatsApp number section */}
        <div className="transform-section">
          <div className="transform-section-title">📱 WhatsApp</div>
          <div className="whatsapp-config">
            <label className="whatsapp-config-label" htmlFor="whatsapp-number">
              Número de contacto
            </label>
            <div className="whatsapp-input-row">
              <span className="whatsapp-prefix">+</span>
              <input
                id="whatsapp-number"
                type="tel"
                className="whatsapp-input"
                placeholder="5491123456789"
                value={whatsappNumber}
                onChange={(e) => handleWhatsappChange(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            <span className="whatsapp-hint">Código de país + número, sin espacios ni guiones</span>
          </div>
        </div>

        {/* Panel logo section */}
        <div className="transform-section">
          <div className="transform-section-title">🖼️ Logo del panel</div>
          <div className="whatsapp-config">
            <span className="whatsapp-hint">Se mostrará en el encabezado del panel lateral izquierdo</span>

            <input
              ref={logoInputRef}
              id="panel-logo-upload"
              type="file"
              accept="image/*"
              className="logo-file-input"
              onChange={handleLogoUpload}
            />

            {panelLogoUrl ? (
              <div className="panel-logo-preview">
                <img src={panelLogoUrl} alt="Logo preview" className="panel-logo-preview-img" />
                <div className="panel-logo-actions">
                  <button
                    className="panel-logo-change-btn"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                  >
                    Cambiar
                  </button>
                  <button
                    className="panel-logo-remove-btn"
                    onClick={handleLogoRemove}
                    disabled={logoUploading}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="panel-logo-upload-btn"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
              >
                {logoUploading
                  ? `Subiendo... ${logoProgress}%`
                  : '⬆ Subir imagen'
                }
              </button>
            )}

            {logoUploading && (
              <div className="panel-logo-progress">
                <div
                  className="panel-logo-progress-fill"
                  style={{ width: `${logoProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </FloatingPanel>

      {/* Units data management modal */}
      {showUnidadesModal && (
        <UnidadesCargaModal
          items={unidadItems}
          sceneId={sceneId}
          onSave={handleUnidadesSave}
          onClose={() => setShowUnidadesModal(false)}
        />
      )}

      {/* Amenities data management modal */}
      {showAmenitiesModal && (
        <AmenitiesModal
          items={amenityItems}
          sceneId={sceneId}
          onSave={handleAmenitiesSave}
          onClose={() => setShowAmenitiesModal(false)}
        />
      )}
    </>
  );
}
