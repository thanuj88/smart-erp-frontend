/** Client-side preview of the server discount rule in backend/utils/discountPolicy.js. */

export const MAX_DISCOUNT_PERCENT = 5;

export const DEFAULT_DISCOUNT_LIMITS = {
  TENANT_ADMIN: MAX_DISCOUNT_PERCENT,
  MANAGER: MAX_DISCOUNT_PERCENT,
  TELLER: MAX_DISCOUNT_PERCENT,
  INVENTORY: 0,
  ACCOUNTANT: 0,
};

export const DISCOUNT_ROLE_FIELDS = [
  ['TENANT_ADMIN', 'Tenant admin'],
  ['MANAGER', 'Manager'],
  ['TELLER', 'Teller'],
  ['INVENTORY', 'Inventory'],
  ['ACCOUNTANT', 'Accountant'],
];

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function toCents(value) {
  return Math.round((Number(value) || 0) * 100);
}

function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, MAX_DISCOUNT_PERCENT);
}

export function limitForRole(limits, role) {
  const key = String(role || '').toUpperCase();
  if (key === 'SUPER_ADMIN') return MAX_DISCOUNT_PERCENT;
  const table = limits && typeof limits === 'object' ? limits : DEFAULT_DISCOUNT_LIMITS;
  if (table[key] == null || table[key] === '') return DEFAULT_DISCOUNT_LIMITS[key] ?? 0;
  return clampPercent(table[key]);
}

export function emptyDiscountLimitForm() {
  return Object.fromEntries(DISCOUNT_ROLE_FIELDS.map(([role]) => [role, String(DEFAULT_DISCOUNT_LIMITS[role])]));
}

/** What the till should do with the discount already priced into the bill. */
export function assessPosDiscount({ role, limits, itemsTotal, discountAmount, discountPercent }) {
  const merchandise = roundMoney(itemsTotal);
  const discountCents = toCents(discountAmount);
  const capAmount = roundMoney(merchandise * (MAX_DISCOUNT_PERCENT / 100));
  const capCents = toCents(capAmount);
  const limit = limitForRole(limits, role);
  const limitCents = toCents(roundMoney(merchandise * (limit / 100)));
  const asked = parseFloat(discountPercent);
  const askedPercent = Number.isFinite(asked) && asked > 0 ? asked : 0;
  const overCeiling = askedPercent > MAX_DISCOUNT_PERCENT || discountCents > capCents;
  const needsApproval = !overCeiling && discountCents > 0 && (askedPercent > limit || discountCents > limitCents);
  return { overCeiling, needsApproval, limit, capAmount };
}
