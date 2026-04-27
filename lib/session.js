/**
 * Session token utilities — HMAC-signed tokens for stateless auth.
 *
 * Uses Web Crypto API (available in both Node.js and Edge Runtime).
 * Token format: base64url(payload).hexSignature
 *
 * Uses base64url (RFC 4648 §5) instead of standard base64 to avoid
 * cookie URL-encoding issues with `+`, `/`, and `=` characters.
 */

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Encode string to base64url (no padding, URL-safe characters).
 */
function toBase64Url(str) {
  const b64 = btoa(str);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode base64url string back to original string.
 */
function fromBase64Url(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  // Re-add padding
  while (b64.length % 4) b64 += '=';
  return atob(b64);
}

/**
 * Derive a CryptoKey from the password string.
 * @param {string} secret
 * @returns {Promise<CryptoKey>}
 */
async function getKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Convert ArrayBuffer to hex string.
 */
function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to ArrayBuffer.
 */
function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Create a signed session token.
 * @param {string} secret - The ADMIN_PASSWORD used as signing key
 * @returns {Promise<string>} - Token string: base64(payload).hexSignature
 */
export async function createToken(secret) {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + SESSION_MAX_AGE_MS,
  };

  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const key = await getKey(secret);
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));

  return `${payloadB64}.${bufToHex(sig)}`;
}

/**
 * Verify a signed session token.
 * Returns the payload if valid and not expired, null otherwise.
 * @param {string} token
 * @param {string} secret
 * @returns {Promise<Object|null>}
 */
export async function verifyToken(token, secret) {
  if (!token || !secret) return null;

  const dotIdx = token.indexOf('.');
  if (dotIdx === -1) return null;

  const payloadB64 = token.substring(0, dotIdx);
  const sigHex = token.substring(dotIdx + 1);

  if (!payloadB64 || !sigHex) return null;

  try {
    const key = await getKey(secret);
    const enc = new TextEncoder();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBuf(sigHex),
      enc.encode(payloadB64)
    );

    if (!valid) return null;

    const payload = JSON.parse(fromBase64Url(payloadB64));

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}
