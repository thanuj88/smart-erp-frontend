import { formatMoney } from './currency';

export const RECEIPT_PAPER_SIZES = [
  {
    code: '58mm',
    label: '58mm — 2¼″ compact thermal',
    hint: 'Portable and small POS printers',
    widthMm: 58,
    previewPx: 200,
    fullPx: 240,
  },
  {
    code: '80mm',
    label: '80mm — 3⅛″ standard thermal',
    hint: 'Most retail POS printers',
    widthMm: 80,
    previewPx: 280,
    fullPx: 360,
  },
  {
    code: '112mm',
    label: '112mm — 4⅜″ wide thermal',
    hint: 'Wide kitchen and counter printers',
    widthMm: 112,
    previewPx: 360,
    fullPx: 460,
  },
  {
    code: 'A5',
    label: 'A5 — 148mm page printer',
    hint: 'Small laser or inkjet invoices',
    widthMm: 148,
    previewPx: 400,
    fullPx: 520,
  },
  {
    code: 'A4',
    label: 'A4 — 210mm page printer',
    hint: 'Standard office printer',
    widthMm: 210,
    previewPx: 440,
    fullPx: 640,
  },
];

export const DEFAULT_PAPER_SIZE = '80mm';

export function getReceiptPaperSize(code) {
  return RECEIPT_PAPER_SIZES.find((size) => size.code === code) || RECEIPT_PAPER_SIZES.find((size) => size.code === DEFAULT_PAPER_SIZE);
}

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
  paperSize: DEFAULT_PAPER_SIZE,
  showQrCode: true,
  showVoucher: false,
  voucherTitle: 'Our Gift To You...',
  voucherOfferType: 'percent',
  voucherOfferValue: '10',
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
    paperSize: getReceiptPaperSize(source.paperSize).code,
    voucherOfferType: source.voucherOfferType === 'value' ? 'value' : 'percent',
    voucherOfferValue:
      source.voucherOfferValue != null && String(source.voucherOfferValue).trim() !== ''
        ? String(source.voucherOfferValue)
        : DEFAULT_RECEIPT.voucherOfferValue,
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

export function formatVoucherOfferValue(receipt, currency) {
  const type = receipt?.voucherOfferType === 'value' ? 'value' : 'percent';
  const amount = Number(receipt?.voucherOfferValue);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  if (type === 'percent') {
    const label = Number.isInteger(amount) ? String(amount) : String(amount);
    return `${label}%`;
  }
  return formatMoney(amount, currency);
}
