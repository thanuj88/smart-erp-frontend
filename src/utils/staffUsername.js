/** Display-only helpers matching backend staff username rules */

export function usernamePrefixFromSlug(tenantSlug) {
  if (!tenantSlug) return '';
  const part = String(tenantSlug)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '');
  return part ? `${part}-` : '';
}

export function needsTenantUsernamePrefix(role) {
  return role !== 'SUPER_ADMIN';
}
