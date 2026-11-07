/** Canonical store order ID: #ORD123456 */

export function generateOrderId() {
  return `#ORD${Date.now().toString().slice(-6)}`;
}

/** One key per checkout attempt; the server returns the same sale if it sees the key twice. */
export function generateCheckoutKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Same bill contents => same fingerprint, so editing the bill after a failure mints a new key. */
export function billFingerprint(lines) {
  const text = lines
    .map((line) => `${line.itemId}:${line.quantity}`)
    .sort()
    .join(',');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

export function normalizeOrderNumber(value) {
  if (value == null || value === '') return null;
  let raw = String(value).trim();
  if (raw.startsWith('#')) raw = raw.slice(1);
  if (/^ORD/i.test(raw)) {
    const suffix = raw.slice(3).replace(/\D/g, '').slice(-6).padStart(6, '0');
    return `ORD${suffix}`;
  }
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return `ORD${digits.slice(-6).padStart(6, '0')}`;
}

export function formatOrderId(...candidates) {
  for (const value of candidates) {
    const normalized = normalizeOrderNumber(value);
    if (normalized) return `#${normalized}`;
  }
  return '-';
}
