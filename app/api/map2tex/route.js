/**
 * API Route — Generate satellite floor texture using Map2Tex.
 *
 * POST /api/map2tex
 * Body: { url | lat+lng, zoom?, size?, ratio? }
 * Returns: WebP image blob (lossy q90)
 *
 * POST /api/map2tex?preview=1
 * Returns: low-res JPEG preview (512px, zoom-2)
 *
 * Requires MAP2TEX_SCRIPT env var pointing to the Python script path.
 */

import { execFile } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export async function POST(request) {
  const scriptPath = process.env.MAP2TEX_SCRIPT;

  if (!scriptPath) {
    return Response.json(
      { error: 'MAP2TEX_SCRIPT not configured. Set the env var to the path of map2tex.py.' },
      { status: 501 }
    );
  }

  let outputPath = null;

  try {
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get('preview') === '1';

    const body = await request.json();
    const { url, lat, lng, zoom = 19, size = 4096, ratio = '1:1' } = body;

    // Accept either url or lat+lng
    const location = url || (lat != null && lng != null ? `${lat},${lng}` : null);
    if (!location) {
      return Response.json({ error: 'Missing location (url or lat+lng)' }, { status: 400 });
    }

    // Sanitize numeric parameters
    const actualZoom = Math.max(1, Math.min(21, parseInt(zoom) || 19));
    const actualSize = isPreview ? 512 : Math.max(64, Math.min(8192, parseInt(size) || 4096));
    const previewZoom = Math.max(1, actualZoom - 2);
    const finalZoom = isPreview ? previewZoom : actualZoom;
    const ext = isPreview ? 'jpg' : 'webp';

    // Validate ratio format (e.g. "1:1", "16:9")
    if (!/^\d+:\d+$/.test(ratio)) {
      return Response.json({ error: 'Invalid ratio format (expected "W:H")' }, { status: 400 });
    }

    const ts = Date.now();
    outputPath = join(tmpdir(), `map2tex_${ts}.${ext}`);

    // Use execFile instead of exec to prevent shell injection.
    // Arguments are passed as an array — no shell parsing occurs.
    const args = [
      scriptPath,
      '--ratio', ratio,
      '--zoom', String(finalZoom),
      '--size', String(actualSize),
      '--output', outputPath,
      '--',
      location,
    ];

    await new Promise((resolve, reject) => {
      execFile('python', args, { timeout: 180_000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });

    const imageBuffer = await readFile(outputPath);
    unlink(outputPath).catch(() => {});

    const contentType = isPreview ? 'image/jpeg' : 'image/webp';
    const filename = `satellite_floor_${ts}.${ext}`;

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (outputPath) unlink(outputPath).catch(() => {});
    console.error('[Map2Tex] Error:', err.message);
    return Response.json(
      { error: err.message || 'Map2Tex generation failed' },
      { status: 500 }
    );
  }
}
