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

export function billToReceiptItems(bill, currency) {
  return (bill || []).map((item) => {
    const qty = Number(item.quantity) || 1;
    const unit = Number(item.price) || 0;
    return {
      name: item.name,
      price: Number(item.total != null ? item.total : unit * qty),
      note: qty > 1 ? `${qty} @ ${formatMoney(unit, currency)}` : '',
    };
  });
}

export function receiptPrintPageSize(paper) {
  if (paper?.code === 'A4') return 'A4';
  if (paper?.code === 'A5') return 'A5';
  return `${paper?.widthMm || 80}mm auto`;
}

export function buildInstallmentPaymentReceipt(plan, { currentAmount } = {}) {
  const payments = [...(plan?.payments || [])].sort(
    (a, b) => (a.payment_number || 0) - (b.payment_number || 0)
  );
  const downPayment = Number(plan?.down_payment || 0);
  const items = [];

  if (downPayment >= 0) {
    items.push({
      name: 'Paid in',
      note: 'Down payment',
      price: downPayment,
    });
  }

  payments.forEach((payment) => {
    const paid = Number(payment.amount_paid || 0);
    if (paid <= 0 && payment.status !== 'paid') return;
    const paidOn = payment.paid_date
      ? new Date(payment.paid_date).toLocaleDateString()
      : payment.due_date
        ? `Due ${new Date(payment.due_date).toLocaleDateString()}`
        : '';
    const partial = paid > 0 && paid < Number(payment.amount_due || 0);
    items.push({
      name: `Installment #${payment.payment_number}`,
      note: [paidOn, partial ? 'Partial' : ''].filter(Boolean).join(' · '),
      price: paid,
    });
  });

  const installmentPaid = payments.reduce((sum, payment) => sum + Number(payment.amount_paid || 0), 0);
  const totalPaid = downPayment + installmentPaid;
  const remaining = Math.max(
    0,
    Number(plan?.total_with_interest || 0) - Number(plan?.paid_amount || 0)
  );
  const planTotal = downPayment + Number(plan?.total_with_interest || 0);
  const thisPayment = Number(currentAmount || 0);

  return {
    items,
    subtotal: totalPaid,
    total: planTotal,
    totalLabel: 'Plan total',
    tendered: thisPayment > 0 ? thisPayment : totalPaid,
    tenderedLabel: thisPayment > 0 ? 'This payment' : 'Total paid',
    extraTotalLines: [{ label: 'Balance', value: remaining }],
    infoLines: [
      { label: 'Customer', value: plan?.customer_name || plan?.customer?.name || '—' },
      { label: 'Plan', value: `#${plan?.id || ''}` },
    ].filter((line) => line.value && line.value !== '#'),
    invoiceTitle: 'Installment Payment Receipt',
    subtotalLabel: 'Total paid',
  };
}

export function createInstallmentReceiptPrintJob({
  settings,
  currency,
  cashierName,
  plan,
  currentAmount,
}) {
  const template = mergeReceipt(settings?.receipt, settings?.receiptFooter);
  const paper = getReceiptPaperSize(template.paperSize);
  const built = buildInstallmentPaymentReceipt(plan, { currentAmount });
  return {
    pageSize: receiptPrintPageSize(paper),
    preview: {
      businessName: settings?.businessName,
      currency,
      taxRate: 0,
      receipt: { ...template, invoiceTitle: built.invoiceTitle },
      items: built.items,
      cashierName: cashierName || 'CASHIER',
      saleNumber: `P${plan?.id || Date.now()}`,
      soldAt: new Date().toISOString(),
      subtotal: built.subtotal,
      tax: 0,
      total: built.total,
      totalLabel: built.totalLabel,
      tendered: built.tendered,
      tenderedLabel: built.tenderedLabel,
      extraTotalLines: built.extraTotalLines,
      showChange: false,
      infoLines: built.infoLines,
      subtotalLabel: built.subtotalLabel,
    },
  };
}
