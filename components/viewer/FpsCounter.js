'use client';

import { useRef, useEffect, useState } from 'react';

/**
 * FPS Counter overlay with color coding.
 */
export default function FpsCounter() {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    let animId;
    lastTimeRef.current = performance.now();

    function loop() {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 500) {
        const currentFps = Math.round((frameCountRef.current / delta) * 1000);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const color = fps >= 50 ? 'var(--accent-green)' : fps >= 25 ? 'var(--accent-yellow)' : 'var(--accent-red)';

  return (
    <div className="fps-counter" style={{ color }}>
      <span className="fps-value">{fps || '--'}</span>
      <span className="fps-label">FPS</span>
    </div>
  );
}
