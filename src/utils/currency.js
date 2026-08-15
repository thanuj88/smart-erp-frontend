export const DEFAULT_CURRENCY = { code: 'USD', symbol: '$', label: 'USD ($)' };

export const CURRENCY_OPTIONS = [
  DEFAULT_CURRENCY,
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'LKR', symbol: 'Rs', label: 'LKR (Rs)' },
];

export function currencyFromUser(user) {
  if (user?.currency?.symbol) {
    return {
      code: user.currency.code || DEFAULT_CURRENCY.code,
      symbol: user.currency.symbol,
      label: user.tenantSettings?.currencyLabel || DEFAULT_CURRENCY.label,
    };
  }
  if (user?.tenantSettings?.currency) {
    return user.tenantSettings.currency;
  }
  return DEFAULT_CURRENCY;
}

export function currencyFromSettings(settings) {
  if (!settings) return DEFAULT_CURRENCY;
  return {
    code: settings.currencyCode || settings.currency?.code || DEFAULT_CURRENCY.code,
    symbol: settings.currencySymbol || settings.currency?.symbol || DEFAULT_CURRENCY.symbol,
    label: settings.currencyLabel || DEFAULT_CURRENCY.label,
  };
}

/**
 * Format a number with the tenant currency symbol (e.g. Rs1,234.56).
 */
export function formatMoney(amount, currency = DEFAULT_CURRENCY) {
  const n = Number(amount);
  const symbol = currency?.symbol ?? DEFAULT_CURRENCY.symbol;
  if (Number.isNaN(n)) return `${symbol}0.00`;

  const formatted = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (n < 0) return `-${symbol}${formatted}`;
  return `${symbol}${formatted}`;
}
