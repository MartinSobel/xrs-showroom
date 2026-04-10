'use client';

import { useState, useCallback, useEffect } from 'react';
import FloatingPanel from './FloatingPanel';

/**
 * Single transform row: label + range slider + number input.
 */
function TransformRow({ label, labelClass, value, min, max, step, onChange }) {
  return (
    <div className="transform-row">
      <span className={`transform-label ${labelClass}`}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <input
        type="number"
        step={step}
        value={Math.round(value * 100) / 100}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

/**
 * Transform panel — controls position/rotation/scale for GLB, SOG, skybox, floor.
 * Rendered inside RightPanelStack with controlled collapse.
 */
export default function TransformPanel({ scene, onTransformChange, onApplyTransform, collapsed, onToggle }) {
  const transforms = scene?.transforms;

  // Local state for responsive UI (updates immediately, saves with debounce)
  const [local, setLocal] = useState(null);

  // Sync from Firebase when scene data arrives/changes
  useEffect(() => {
    if (transforms) {
      setLocal(JSON.parse(JSON.stringify(transforms)));
    }
  }, [transforms]);

  const updateField = useCallback(
    (type, path, value) => {
      setLocal((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        const parts = path.split('.');
        let obj = next[type];
        for (let i = 0; i < parts.length - 1; i++) {
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;

        // Notify parent for debounced save + live 3D update
        onTransformChange?.(type, next[type]);
        onApplyTransform?.(type, next[type]);

        return next;
      });
    },
    [onTransformChange, onApplyTransform]
  );

  if (!local) return null;

  return (
    <FloatingPanel
      title="Transform"
      icon="🎯"
      position=""
      collapsed={collapsed}
      onToggle={onToggle}
    >
      {/* ─── GLB ─── */}
      <div className="transform-section">
        <div className="transform-section-title">🧊 GLB Model</div>
        <TransformRow label="X" labelClass="label-x" value={local.glb?.position?.x ?? 0} min={-500} max={500} step={0.5} onChange={(v) => updateField('glb', 'position.x', v)} />
        <TransformRow label="Y" labelClass="label-y" value={local.glb?.position?.y ?? 0} min={-500} max={500} step={0.5} onChange={(v) => updateField('glb', 'position.y', v)} />
        <TransformRow label="Z" labelClass="label-z" value={local.glb?.position?.z ?? 0} min={-500} max={500} step={0.5} onChange={(v) => updateField('glb', 'position.z', v)} />
        <TransformRow label="S" labelClass="label-s" value={local.glb?.scale ?? 1} min={-500} max={500} step={1} onChange={(v) => updateField('glb', 'scale', v)} />
        <TransformRow label="Rx" labelClass="label-x" value={local.glb?.rotation?.x ?? 0} min={-180} max={180} step={1} onChange={(v) => updateField('glb', 'rotation.x', v)} />
        <TransformRow label="Ry" labelClass="label-y" value={local.glb?.rotation?.y ?? 0} min={-180} max={180} step={1} onChange={(v) => updateField('glb', 'rotation.y', v)} />
        <TransformRow label="Rz" labelClass="label-z" value={local.glb?.rotation?.z ?? 0} min={-180} max={180} step={1} onChange={(v) => updateField('glb', 'rotation.z', v)} />
      </div>

      <div className="section-divider" />

      {/* ─── SOG ─── */}
      <div className="transform-section">
        <div className="transform-section-title">✨ SOG Splat</div>
        <TransformRow label="X" labelClass="label-x" value={local.sog?.position?.x ?? 0} min={-500} max={500} step={0.5} onChange={(v) => updateField('sog', 'position.x', v)} />
        <TransformRow label="Y" labelClass="label-y" value={local.sog?.position?.y ?? 0} min={-500} max={500} step={0.5} onChange={(v) => updateField('sog', 'position.y', v)} />
        <TransformRow label="Z" labelClass="label-z" value={local.sog?.position?.z ?? 0} min={-500} max={500} step={0.5} onChange={(v) => updateField('sog', 'position.z', v)} />
        <TransformRow label="S" labelClass="label-s" value={local.sog?.scale ?? 1} min={-500} max={500} step={1} onChange={(v) => updateField('sog', 'scale', v)} />
        <TransformRow label="Rx" labelClass="label-x" value={local.sog?.rotation?.x ?? 0} min={-180} max={180} step={1} onChange={(v) => updateField('sog', 'rotation.x', v)} />
        <TransformRow label="Ry" labelClass="label-y" value={local.sog?.rotation?.y ?? 0} min={-180} max={180} step={1} onChange={(v) => updateField('sog', 'rotation.y', v)} />
        <TransformRow label="Rz" labelClass="label-z" value={local.sog?.rotation?.z ?? 0} min={-180} max={180} step={1} onChange={(v) => updateField('sog', 'rotation.z', v)} />
      </div>

      <div className="section-divider" />

      {/* ─── Skybox ─── */}
      <div className="transform-section">
        <div className="transform-section-title">🌐 Skybox</div>
        <TransformRow label="R" labelClass="label-r" value={local.skybox?.radius ?? 400} min={10} max={50000} step={10} onChange={(v) => updateField('skybox', 'radius', v)} />
        <TransformRow label="B" labelClass="label-b" value={local.skybox?.blur ?? 3} min={0} max={80} step={1} onChange={(v) => updateField('skybox', 'blur', v)} />
      </div>

      <div className="section-divider" />

      {/* ─── Floor ─── */}
      <div className="transform-section">
        <div className="transform-section-title">🟫 Floor</div>
        <TransformRow label="X" labelClass="label-x" value={local.floor?.position?.x ?? 0} min={-500} max={500} step={0.5} onChange={(v) => updateField('floor', 'position.x', v)} />
        <TransformRow label="Y" labelClass="label-y" value={local.floor?.position?.y ?? -0.5} min={-500} max={500} step={0.5} onChange={(v) => updateField('floor', 'position.y', v)} />
        <TransformRow label="Z" labelClass="label-z" value={local.floor?.position?.z ?? 0} min={-500} max={500} step={0.5} onChange={(v) => updateField('floor', 'position.z', v)} />
        <TransformRow label="S" labelClass="label-s" value={local.floor?.scale ?? 1050} min={10} max={50000} step={10} onChange={(v) => updateField('floor', 'scale', v)} />
        <TransformRow label="B" labelClass="label-b" value={local.floor?.blur ?? 3} min={0} max={80} step={1} onChange={(v) => updateField('floor', 'blur', v)} />
      </div>
    </FloatingPanel>
  );
}
