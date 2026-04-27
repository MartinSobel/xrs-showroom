'use client';

import { useCallback } from 'react';
import HelpTooltip from '@/components/ui/HelpTooltip';

/**
 * Single transform row: label + range slider + number input + optional help tooltip.
 * Used across SceneEditorPanel, OrbitPanel, etc.
 */
export default function TransformRow({ label, labelClass, value, min, max, step, onChange, help }) {
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    const precision = Math.max(0, -Math.floor(Math.log10(step)));
    onChange(parseFloat((value + delta).toFixed(precision)));
  }, [value, step, onChange]);

  return (
    <div className="transform-row">
      <span className={`transform-label ${labelClass}`}>{label}</span>
      {help && <HelpTooltip text={help} />}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        tabIndex={-1}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <input
        type="number"
        step={step}
        value={Math.round(value * 100) / 100}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(isNaN(v) ? 0 : v);
        }}
        onWheel={handleWheel}
      />
    </div>
  );
}
