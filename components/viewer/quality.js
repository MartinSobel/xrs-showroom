/**
 * Viewer3D Adaptive Quality System
 *
 * Monitors FPS over a rolling window and adjusts rendering quality:
 *   Level 3 (ultra):  full pixelRatio, anisotropy 16, envMap on
 *   Level 2 (high):   pixelRatio 1.5, anisotropy 8, envMap on
 *   Level 1 (medium): pixelRatio 1.0, anisotropy 4, envMap on
 *   Level 0 (low):    pixelRatio 0.75, anisotropy 2, envMap off
 *
 * Degrades quickly (2s cooldown) to stop frame drops ASAP.
 * Upgrades slowly (5s cooldown) to avoid oscillation.
 */

const LEVEL_NAMES = ['low', 'medium', 'high', 'ultra'];

export function handleAdaptiveQuality(s) {
  const aq = s.adaptiveQuality;
  if (!aq.enabled || !s.renderer) return;

  const now = performance.now();

  // Trim frame times to last 3 seconds
  while (aq.frameTimes.length > 1 && now - aq.frameTimes[0] > 3000) {
    aq.frameTimes.shift();
  }

  // Only check periodically
  if (now - aq.lastCheck < aq.checkInterval) return;
  aq.lastCheck = now;

  // Calculate average FPS from frame times
  const window = aq.frameTimes;
  if (window.length < 10) return; // not enough data yet
  const elapsed = window[window.length - 1] - window[0];
  if (elapsed < 500) return;
  const avgFps = ((window.length - 1) / elapsed) * 1000;

  const level = aq.currentLevel;

  // Degrade: FPS too low and cooldown elapsed
  if (avgFps < aq.degradeThreshold && level > 0 && now - aq.lastDegradeTime > aq.degradeCooldown) {
    const newLevel = level - 1;
    applyQualityLevel(s, newLevel);
    aq.currentLevel = newLevel;
    aq.lastDegradeTime = now;
    aq.lastUpgradeTime = now; // reset upgrade timer too
    console.log(`[AdaptiveQ] ▼ Degraded: ${LEVEL_NAMES[level]} → ${LEVEL_NAMES[newLevel]} (FPS: ${avgFps.toFixed(0)})`);
    return;
  }

  // Upgrade: FPS consistently high and cooldown elapsed
  if (avgFps > aq.upgradeThreshold && level < 3 && now - aq.lastUpgradeTime > aq.upgradeCooldown) {
    const newLevel = level + 1;
    applyQualityLevel(s, newLevel);
    aq.currentLevel = newLevel;
    aq.lastUpgradeTime = now;
    console.log(`[AdaptiveQ] ▲ Upgraded: ${LEVEL_NAMES[level]} → ${LEVEL_NAMES[newLevel]} (FPS: ${avgFps.toFixed(0)})`);
  }
}

export function applyQualityLevel(s, level) {
  const aq = s.adaptiveQuality;
  const maxPR = aq.originalPixelRatio;

  switch (level) {
    case 3: // ultra
      s.renderer.setPixelRatio(Math.min(maxPR, 2.0));
      updateAnisotropy(s, 16);
      if (s.envMap && !s.scene.environment) s.scene.environment = s.modelEnvMap || s.envMap;
      break;
    case 2: // high
      s.renderer.setPixelRatio(Math.min(maxPR, 1.5));
      updateAnisotropy(s, 8);
      if (s.envMap && !s.scene.environment) s.scene.environment = s.modelEnvMap || s.envMap;
      break;
    case 1: // medium
      s.renderer.setPixelRatio(1.0);
      updateAnisotropy(s, 4);
      // Keep env map on for medium
      break;
    case 0: // low
      s.renderer.setPixelRatio(0.75);
      updateAnisotropy(s, 2);
      // Disable env map to save GPU
      if (s.scene.environment) {
        s.scene.environment = null;
      }
      break;
  }
}

export function updateAnisotropy(s, value) {
  if (!s.glbModel) return;
  const processed = new Set();
  s.glbModel.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of mats) {
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap']) {
        const tex = mat[key];
        if (tex && !processed.has(tex.uuid)) {
          processed.add(tex.uuid);
          tex.anisotropy = value;
          // Don't set needsUpdate for anisotropy — it's applied on next render
        }
      }
    }
  });
}
