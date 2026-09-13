/** Canonical store order ID: #ORD123456 */

export function generateOrderId() {
  return `#ORD${Date.now().toString().slice(-6)}`;
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
  return '—';
}
