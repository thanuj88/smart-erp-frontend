import { PERMISSIONS } from '../services';

const normalizeRole = (role) =>
  typeof role === 'string' ? role.toUpperCase() : role;

const hasRole = (user, roleOrRoles) => {
  if (!user) return false;
  const currentRole = normalizeRole(user.role);
  const roles = (Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]).map(normalizeRole);
  return roles.includes(currentRole);
};

const hasPermission = (user, permission) => {
  if (!user?.permissions) return false;
  const perms = Array.isArray(permission) ? permission : [permission];
  return perms.some((p) => user.permissions.includes(p));
};

const isSuperAdminUser = (user) => hasRole(user, 'SUPER_ADMIN');

const isAdminUser = (user) =>
  !!user &&
  (hasPermission(user, [
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.PLATFORM_MANAGE,
  ]) ||
    isSuperAdminUser(user));

const isTellerOnlyUser = (user) =>
  !!user && hasRole(user, 'TELLER') && !isAdminUser(user);

/** Resolve post-login route from a user object (does not rely on React state). */
export function resolveHomePath(user) {
  if (!user) return '/login';
  if (isSuperAdminUser(user)) return '/platform';
  if (isTellerOnlyUser(user)) return '/sell';
  return '/';
}
