export const DEFAULT_RECEIPT = {
  logo: null,
  slogan: "We're here to help.",
  registrationNumber: '',
  address: '',
  email: '',
  website: '',
  phone: '',
  headerMessage: '',
  invoiceTitle: 'Tax Invoice / Receipt',
  returnPolicy: 'A receipt or proof of purchase must accompany goods for exchange.',
  footer: 'Thank you for shopping with us!',
  showQrCode: true,
  showVoucher: false,
  voucherTitle: 'Our Gift To You...',
  voucherOfferText: 'off your next purchase with us.',
  voucherLoyaltyText: 'Double your reward and join our loyalty club today.',
  voucherTerms:
    'Cannot be redeemed for layby items. One voucher per transaction. Not redeemable for cash.',
};

export const SAMPLE_RECEIPT_ITEMS = [
  {
    name: 'ALL ABOUT EVE ABBY CAMI [AU SIZE:10]',
    note: 'Wash separately on first wash.',
    qty: 1,
    price: 49.95,
  },
  {
    name: 'RIBBON [COL: BLUE]',
    note: '2.250m @ $1.00/m',
    qty: 1,
    price: 2.25,
  },
];

export function mergeReceipt(raw, footerFallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    ...DEFAULT_RECEIPT,
    ...source,
    logo: source.logo || null,
    showQrCode:
      source.showQrCode != null
        ? Boolean(source.showQrCode)
        : source.showBarcode != null
          ? Boolean(source.showBarcode)
          : DEFAULT_RECEIPT.showQrCode,
    showVoucher: source.showVoucher != null ? Boolean(source.showVoucher) : DEFAULT_RECEIPT.showVoucher,
    footer: source.footer != null && source.footer !== undefined
      ? source.footer
      : footerFallback || DEFAULT_RECEIPT.footer,
  };
}
