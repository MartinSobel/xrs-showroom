/**
 * API Proxy — forwards POST requests to an external API.
 * Bypasses CORS restrictions by making the request server-side.
 * 
 * Usage: POST /api/proxy  { url: "https://..." }
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return Response.json({ error: 'Missing "url" field' }, { status: 400 });
    }

    // Normalize URL
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    console.log('[Proxy] POST →', finalUrl);

    const res = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return Response.json({
      status: res.status,
      statusText: res.statusText,
      data,
    });
  } catch (err) {
    console.error('[Proxy] Error:', err.message);
    return Response.json(
      { error: err.message },
      { status: 502 }
    );
  }
}
