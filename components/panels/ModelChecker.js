'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Model optimization checker — auto-analyzes GLB on load.
 * Shows compression types used, optimization warnings, and runtime optimize options.
 */
export default function ModelChecker({ viewerRef, viewerReady, hasGlb }) {
  const [stats, setStats] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [opts, setOpts] = useState({
    resizeTextures: false,
    maxTextureSize: 2048,
    forcePOT: false,
    stripGeometry: false,
  });

  const refreshStats = useCallback(() => {
    if (viewerRef?.current) {
      const s = viewerRef.current.getModelStats();
      setStats(s);
    }
  }, [viewerRef]);

  // Auto-check when model loads or changes
  useEffect(() => {
    if (!hasGlb || !viewerReady || !viewerRef?.current) {
      setStats(null);
      setShowOptions(false);
      return;
    }
    const timer = setTimeout(refreshStats, 500);
    return () => clearTimeout(timer);
  }, [hasGlb, viewerReady, viewerRef, refreshStats]);

  const runOptimize = useCallback(async () => {
    if (!viewerRef?.current) return;
    setOptimizing(true);
    setProgress(0);
    try {
      await viewerRef.current.optimizeModel(opts, (p) => setProgress(p));
      refreshStats();
      setShowOptions(false);
    } catch (err) {
      console.error('[ModelChecker] Optimize failed:', err);
    }
    setOptimizing(false);
    setProgress(0);
  }, [viewerRef, opts, refreshStats]);

  if (!hasGlb || !viewerReady || !stats) return null;

  // Actionable warnings (can be fixed at runtime)
  const warnings = [];
  if (stats.totalTriangles > 500000) warnings.push(`Triángulos altos: ${(stats.totalTriangles / 1000).toFixed(0)}K (rec. <500K)`);
  if (stats.maxTexSize > 2048) warnings.push(`Texturas grandes: ${stats.maxTexSize}px (rec. ≤2048)`);
  if (stats.nonPOT > 0) warnings.push(`${stats.nonPOT} textura(s) no POT (potencia de 2)`);
  if (stats.totalVertices > 300000) warnings.push(`Vértices altos: ${(stats.totalVertices / 1000).toFixed(0)}K`);

  // Informational notes (require re-exporting the file)
  const notes = [];
  if (!stats.draco && !stats.meshopt) notes.push('Recomprimir con Draco o MeshOpt antes de subir');
  if (!stats.ktx2 && stats.textureCount > 0) notes.push('Convertir texturas a KTX2/Basis antes de subir');

  const compressionTags = [];
  if (stats.draco) compressionTags.push('Draco');
  if (stats.meshopt) compressionTags.push('MeshOpt');
  if (stats.ktx2) compressionTags.push('KTX2');

  const hasAnyOption = opts.resizeTextures || opts.forcePOT || opts.stripGeometry;

  return (
    <div className="model-checker">
      <div className="model-checker-result">
        <div className="model-checker-stats">
          <span>{(stats.totalTriangles / 1000).toFixed(0)}K tris</span>
          <span>{(stats.totalVertices / 1000).toFixed(0)}K verts</span>
          <span>{stats.meshCount} meshes</span>
          <span>{stats.textureCount} tex</span>
        </div>
        <div className="model-checker-compression">
          {compressionTags.length > 0 ? (
            compressionTags.map((tag) => <span key={tag} className="model-checker-tag ok">{tag}</span>)
          ) : (
            <span className="model-checker-tag none">Sin compresión</span>
          )}
        </div>
        {warnings.length > 0 && (
          <>
            <div className="model-checker-warnings">
              {warnings.map((w, i) => <div key={i} className="model-checker-warn">{w}</div>)}
            </div>
            <button className="model-checker-btn" onClick={() => setShowOptions((v) => !v)}>
              {showOptions ? 'Cerrar' : 'Optimizar'}
            </button>
          </>
        )}
        {notes.length > 0 && (
          <div className="model-checker-notes">
            {notes.map((n, i) => <div key={i} className="model-checker-note">{n}</div>)}
          </div>
        )}
        {warnings.length === 0 && notes.length === 0 && (
          <div className="model-checker-ok">Modelo optimizado</div>
        )}
        {showOptions && (
          <div className="model-checker-options">
            <label className="model-checker-option">
              <input type="checkbox" checked={opts.resizeTextures} onChange={(e) => setOpts((p) => ({ ...p, resizeTextures: e.target.checked }))} />
              <span>Reducir texturas a</span>
              <select value={opts.maxTextureSize} onChange={(e) => setOpts((p) => ({ ...p, maxTextureSize: parseInt(e.target.value) }))}>
                <option value={2048}>2048px</option>
                <option value={1024}>1024px</option>
                <option value={512}>512px</option>
              </select>
            </label>
            <label className="model-checker-option">
              <input type="checkbox" checked={opts.forcePOT} onChange={(e) => setOpts((p) => ({ ...p, forcePOT: e.target.checked }))} />
              <span>Forzar texturas POT (potencia de 2)</span>
            </label>
            <label className="model-checker-option">
              <input type="checkbox" checked={opts.stripGeometry} onChange={(e) => setOpts((p) => ({ ...p, stripGeometry: e.target.checked }))} />
              <span>Eliminar atributos no usados (uv2, color)</span>
            </label>
            <button className="model-checker-apply" onClick={runOptimize} disabled={!hasAnyOption || optimizing}>
              {optimizing && <span className="model-checker-progress" style={{ width: `${progress}%` }} />}
              <span className="model-checker-apply-text">{optimizing ? `${Math.round(progress)}%` : 'Aplicar'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
