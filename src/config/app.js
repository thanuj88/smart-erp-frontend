/**
 * Global app branding — change values here to update the name across the UI.
 */
export const APP_CONFIG = {
  name: 'POSBright',
  productSuffix: '',
  tagline: 'Store inventory & point of sale',
  loginPanelDescription: (name) =>
    `Access the ${name} panel using your email and password.`,
  copyrightStartYear: 2026,
};

export const APP_NAME = APP_CONFIG.name;
export const APP_PRODUCT_SUFFIX = APP_CONFIG.productSuffix;

export const getCopyrightText = () => {
  const year = new Date().getFullYear();
  const start = APP_CONFIG.copyrightStartYear;
  const range = year > start ? `${start}-${year}` : `${year}`;
  return `Copyright © ${range} ${APP_NAME}${APP_PRODUCT_SUFFIX ? ` ${APP_PRODUCT_SUFFIX}` : ''}`;
};

export const getPageTitle = (page, storeName = APP_NAME) => {
  const name = String(storeName || APP_NAME).trim() || APP_NAME;
  return page ? `${page} | ${name}` : `${name} - ${APP_CONFIG.tagline}`;
};

export const resolveBusinessName = (settings, fallback = APP_NAME) => {
  const name = String(settings?.businessName || '').trim();
  return name || fallback;
};
