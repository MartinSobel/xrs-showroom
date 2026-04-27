/**
 * Viewer3D Helper Functions
 *
 * Pure utility functions used by the Viewer3D component.
 * No React hooks — these operate on plain objects.
 */

/* ─── Material overrides ─── */

export function sanitizeMatKey(name) {
  return name.replace(/[.#$/[\]]/g, '_');
}

export function applyMaterialOverridesToModel(model, overrides) {
  if (!model || !overrides) return;
  let count = 0;
  model.traverse((child) => {
    if (child.isMesh) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        const key = sanitizeMatKey(mat.name || '');
        if (overrides[key]) {
          const saved = overrides[key];
          for (const [prop, value] of Object.entries(saved)) {
            switch (prop) {
              case 'color': mat.color?.set?.(`#${value}`); break;
              case 'emissive': mat.emissive?.set?.(`#${value}`); break;
              case 'sheenColor': mat.sheenColor?.set?.(`#${value}`); break;
              case 'transparent': mat.transparent = value; break;
              case 'depthWrite': mat.depthWrite = value; break;
              case 'visible': mat.visible = value; break;
              case 'flatShading': mat.flatShading = value; break;
              case 'side': mat.side = value; break;
              default:
                if (mat[prop] !== undefined) mat[prop] = value;
                break;
            }
          }
          mat.needsUpdate = true;
          count++;
        }
      }
    }
  });
  console.log(`[Viewer] Material overrides applied to ${count} materials`);
}

/* ─── Camera rotation sync (ViewCube) ─── */

export function syncCameraRotation(s) {
  if (!s.camera || !s.controls || !s.THREE) return;
  const offset = new s.THREE.Vector3().subVectors(s.camera.position, s.controls.target);
  const sph = new s.THREE.Spherical().setFromVector3(offset);
  // phi: 0=top, π/2=horizon, π=bottom → CSS rotateX: -90=top, 0=horizon, 90=bottom
  const rx = (sph.phi * 180 / Math.PI) - 90;
  // theta: azimuthal angle → CSS rotateY (inverted)
  const ry = -(sph.theta * 180 / Math.PI);
  const last = s._lastCameraRot;
  const rotChanged = !last || Math.abs(last.x - rx) > 0.1 || Math.abs(last.y - ry) > 0.1;
  const zoomChanged = !last || Math.abs((last.z || 0) - sph.radius) > 0.01;
  const fovChanged = !last || Math.abs((last.fov || 0) - s.camera.fov) > 0.05;
  const posChanged = !last || !last.pos || s.camera.position.distanceToSquared(last.pos) > 0.0001;
  if (rotChanged || zoomChanged || fovChanged || posChanged) {
    s._lastCameraRot = { x: rx, y: ry, z: sph.radius, fov: s.camera.fov, pos: s.camera.position.clone() };
    if (rotChanged && s.onCameraRotation) s.onCameraRotation({ x: rx, y: ry });
    if (s.onCameraInfo) {
      s.onCameraInfo({
        pitch: Math.round((90 - (sph.phi * 180 / Math.PI)) * 10) / 10,
        yaw: Math.round(-(sph.theta * 180 / Math.PI) * 10) / 10,
        zoom: Math.round(sph.radius * 100) / 100,
      });
    }
  }
}

/* ─── Dispose helper ─── */

export function disposeObject(obj) {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        for (const key of Object.keys(mat)) {
          if (typeof mat[key]?.dispose === 'function') mat[key].dispose();
        }
        mat.dispose();
      }
    }
  });
}
