/**
 * GPU capability detection, SIMD detection, and utility helpers.
 * Ported from 3D-Web-Pipeline-Optimizer.
 */

/* ───── GPU / WebGL Capabilities ───── */

let _gpuInfo = null;

export function detectGPU() {
  if (_gpuInfo) return _gpuInfo;
  if (typeof document === 'undefined') {
    _gpuInfo = { renderer: 'ssr', vendor: 'ssr', tier: 'mid', webgl2: false, maxTexSize: 2048 };
    return _gpuInfo;
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) {
    _gpuInfo = { renderer: 'unknown', vendor: 'unknown', tier: 'low', webgl2: false, maxTexSize: 2048 };
    return _gpuInfo;
  }

  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown';
  const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : 'unknown';
  const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const webgl2 = !!canvas.getContext('webgl2');

  const lowerRenderer = renderer.toLowerCase();
  let tier = 'mid';
  if (/apple|intel|mesa|swiftshader|llvmpipe/.test(lowerRenderer)) tier = 'low';
  if (/nvidia|radeon rx|geforce rtx|radeon pro/i.test(lowerRenderer)) tier = 'high';

  _gpuInfo = { renderer, vendor, tier, webgl2, maxTexSize };
  console.log(`[GPU] ${renderer} (${vendor}), tier=${tier}, webgl2=${webgl2}, maxTex=${maxTexSize}`);
  return _gpuInfo;
}

/* ───── SIMD Detection ───── */

let _simdSupported = null;

export function detectSIMD() {
  if (_simdSupported !== null) return _simdSupported;

  try {
    _simdSupported = WebAssembly.validate(new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123,
      3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
    ]));
  } catch {
    _simdSupported = false;
  }

  return _simdSupported;
}

/* ───── Texture Blur ───── */

export function blurTexture(THREE, texture, blurAmount = 3) {
  const image = texture.image;
  if (!image) return texture;

  const canvas = document.createElement('canvas');
  canvas.width = image.width || image.naturalWidth || 512;
  canvas.height = image.height || image.naturalHeight || 512;
  const ctx = canvas.getContext('2d');
  ctx.filter = `blur(${blurAmount}px)`;
  const margin = blurAmount * 2;
  ctx.drawImage(image, -margin, -margin, canvas.width + margin * 2, canvas.height + margin * 2);

  const blurred = new THREE.CanvasTexture(canvas);
  blurred.colorSpace = texture.colorSpace;
  blurred.wrapS = texture.wrapS;
  blurred.wrapT = texture.wrapT;
  return blurred;
}

/* ───── Byte Formatting ───── */

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

export function formatMs(ms) {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
