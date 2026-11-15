/**
 * Till-side refund checks. The server applies the same rules and is the authority.
 * Above €50 (1 EUR = 1.08 USD = 330 LKR) the sale must still be inside a 12 or 24 month
 * warranty and the sales receipt ID must match the order.
 */
import { normalizeOrderNumber } from './orderId';

const HIGH_VALUE_EUR_CENTS = 5000;
const MS_DAY = 24 * 60 * 60 * 1000;
const CENTS_PER_EUR = { EUR: 100, USD: 108, LKR: 33000 };

export const REASON_REQUIRED = 'A reason is required for a return';
export const REASON_TOO_LONG = 'Return reason must be 200 characters or less';
export const NO_SALE_DATE = 'This order has no sale date, so the refund period cannot be checked';
export const WINDOW_OFF = 'Refunds at or below €50 are turned off for this shop';
export const WARRANTY_REQUIRED = 'Choose a 12 or 24 month warranty for a return above €50';
export const RECEIPT_REQUIRED = 'Enter the sales receipt ID for a return above €50';
export const RECEIPT_MISMATCH = 'Sales receipt ID does not match this order';
export const PIN_REQUIRED = 'A manager PIN is required for this refund';

function eurCents(amount, currencyCode) {
  const code = String(currencyCode || 'USD').toUpperCase();
  const perEur = CENTS_PER_EUR[code] || CENTS_PER_EUR.USD;
  const minor = Math.round((Number(amount) || 0) * 100);
  return Math.round((minor * 100) / perEur);
}

export function aboveWarrantyThreshold(amount, currencyCode) {
  return eurCents(amount, currencyCode) > HIGH_VALUE_EUR_CENTS;
}

function normalizeWindow(value) {
  if (value == null || value === '') return 30;
  const n = Number(value);
  if (!Number.isFinite(n)) return 30;
  return Math.min(3650, Math.max(0, Math.round(n)));
}

function normalizeThreshold(value) {
  if (value == null || value === '') return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function saleTime(value) {
  if (value == null || value === '') return null;
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return null;
  return start;
}

function addMonths(date, months) {
  const next = new Date(date.getTime());
  const day = next.getUTCDate();
  next.setUTCMonth(next.getUTCMonth() + months);
  if (next.getUTCDate() < day) next.setUTCDate(0);
  return next;
}

function blocked(message, needsManager, needsWarranty) {
  return { ok: false, message, needsManager, needsWarranty };
}

export function assessReturnForm(input) {
  const refundValue = Math.round((Number(input.refundValue) || 0) * 100) / 100;
  if (!(refundValue > 0)) {
    return { ok: false, message: null, needsManager: false, needsWarranty: false };
  }

  const needsWarranty = aboveWarrantyThreshold(refundValue, input.currencyCode);
  const threshold = normalizeThreshold(input.cashRefundApprovalThreshold);
  const type = input.returnType === 'defect' || input.returnType === 'warranty' ? input.returnType : 'cash';
  const needsManager = needsWarranty || (type === 'cash' && refundValue > threshold);
  const reason = String(input.reason ?? '').trim();
  if (!reason) return blocked(REASON_REQUIRED, needsManager, needsWarranty);
  if (reason.length > 200) return blocked(REASON_TOO_LONG, needsManager, needsWarranty);

  const soldAt = saleTime(input.saleDate);
  if (!soldAt) return blocked(NO_SALE_DATE, needsManager, needsWarranty);

  const now = input.now ?? new Date();
  if (needsWarranty) {
    const months = Number(input.warrantyMonths);
    const chosen = months === 12 || months === 24 ? months : null;
    if (!chosen) return blocked(WARRANTY_REQUIRED, needsManager, needsWarranty);
    if (now.getTime() > addMonths(soldAt, chosen).getTime()) {
      return blocked(`This sale is outside the ${chosen}-month warranty`, needsManager, needsWarranty);
    }
    const given = normalizeOrderNumber(input.salesReceiptId);
    const expected = normalizeOrderNumber(input.orderNumber);
    if (!given) return blocked(RECEIPT_REQUIRED, needsManager, needsWarranty);
    if (!expected || given !== expected) return blocked(RECEIPT_MISMATCH, needsManager, needsWarranty);
  } else {
    const days = normalizeWindow(input.refundWindowDays);
    const inside = days > 0 && now.getTime() - soldAt.getTime() <= days * MS_DAY;
    if (!inside) {
      const message = days > 0 ? `This sale is outside the ${days}-day refund window` : WINDOW_OFF;
      return blocked(message, needsManager, needsWarranty);
    }
  }

  if (needsManager && !/^\d{6,8}$/.test(String(input.managerPin ?? '').trim())) {
    return blocked(PIN_REQUIRED, needsManager, needsWarranty);
  }
  return { ok: true, message: null, needsManager, needsWarranty };
}
