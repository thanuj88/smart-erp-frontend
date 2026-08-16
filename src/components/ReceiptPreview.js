import React from 'react';
import { formatMoney } from '../utils/currency';
import { resolveProductImageUrl } from '../utils/productImage';
import { SAMPLE_RECEIPT_ITEMS, getReceiptPaperSize, formatVoucherOfferValue } from '../utils/receipt';
import ReceiptQr from './ReceiptQr';
import './ReceiptPreview.css';

const ReceiptPreview = ({
  businessName = 'Your Store',
  currency,
  taxRate = 0,
  receipt,
  items = SAMPLE_RECEIPT_ITEMS,
  cashierName = 'CASHIER',
  saleNumber = 'S0000084978',
  soldAt,
  subtotal: subtotalProp,
  tax: taxProp,
  total: totalProp,
  tendered,
  change,
  tenderedLabel = 'Tendered Cash',
  extraTotalLines = [],
  adjustmentLines = [],
  showChange = true,
  infoLines = [],
  totalLabel = 'Total',
  subtotalLabel = 'Sub Total',
}) => {
  const logoSrc = resolveProductImageUrl(receipt?.logo);
  const store = (businessName || 'Your Store').trim() || 'Your Store';
  const computedSubtotal = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const subtotal = subtotalProp != null ? Number(subtotalProp) : computedSubtotal;
  const tax = taxProp != null ? Number(taxProp) : subtotal * (Number(taxRate) || 0) / 100;
  const total = totalProp != null ? Number(totalProp) : subtotal + tax;
  const tenderedAmount = tendered != null ? Number(tendered) : total;
  const changeAmount = change != null ? Number(change) : Math.max(0, tenderedAmount - total);
  const voucherOfferValue = formatVoucherOfferValue(receipt, currency);
  const soldDate = soldAt ? new Date(soldAt) : new Date();
  const dateLabel = soldDate.toLocaleDateString('en-GB');
  const timeLabel = soldDate.toLocaleTimeString('en-GB', { hour12: false });
  const voucherCode = `DV${String(saleNumber).replace(/\D/g, '').slice(-9) || '723178338'}`;
  const initial = store.charAt(0).toUpperCase();
  const paper = getReceiptPaperSize(receipt?.paperSize);
  const printWidth =
    paper.code === 'A4' ? '210mm' : paper.code === 'A5' ? '148mm' : `${paper.widthMm}mm`;

  return (
    <div
      className={`receipt-preview-paper receipt-preview-paper--${paper.code.replace(/\s+/g, '').toLowerCase()}`}
      style={{
        '--receipt-width': `${paper.previewPx}px`,
        '--receipt-full-width': `${paper.fullPx}px`,
        '--receipt-print-width': printWidth,
      }}
    >
      <div className="receipt-preview-logo-wrap">
        {logoSrc ? (
          <img src={logoSrc} alt="" className="receipt-preview-logo" />
        ) : (
          <span className="receipt-preview-logo-fallback">{initial}</span>
        )}
      </div>

      {receipt?.slogan ? <p className="receipt-preview-slogan">{receipt.slogan}</p> : null}

      <p className="receipt-preview-store">{store.toUpperCase()}</p>
      {receipt?.registrationNumber ? (
        <p className="receipt-preview-line">{receipt.registrationNumber}</p>
      ) : null}
      {receipt?.address ? <p className="receipt-preview-line">{receipt.address}</p> : null}
      {receipt?.email ? <p className="receipt-preview-line">{receipt.email}</p> : null}
      {receipt?.website ? <p className="receipt-preview-line">{receipt.website}</p> : null}
      {receipt?.phone ? <p className="receipt-preview-line">Phone {receipt.phone}</p> : null}
      {receipt?.headerMessage ? (
        <p className="receipt-preview-message">{receipt.headerMessage}</p>
      ) : null}

      <div className="receipt-preview-rule" />
      <p className="receipt-preview-title">{receipt?.invoiceTitle || 'Tax Invoice / Receipt'}</p>
      <div className="receipt-preview-rule" />

      {infoLines.length > 0 ? (
        <div className="receipt-preview-info">
          {infoLines.map((line) => (
            <div className="receipt-preview-item-row" key={line.label}>
              <span>{line.label}</span>
              <span>{line.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="receipt-preview-items">
        {items.map((item, index) => (
          <div className="receipt-preview-item" key={item.id || `${item.name}-${index}`}>
            <div className="receipt-preview-item-row">
              <span>{item.name}</span>
              <span>{formatMoney(item.price, currency)}</span>
            </div>
            {item.note ? <div className="receipt-preview-item-note">{item.note}</div> : null}
          </div>
        ))}
      </div>

      <div className="receipt-preview-totals">
        <div className="receipt-preview-item-row">
          <span>{subtotalLabel}</span>
          <span>{formatMoney(subtotal, currency)}</span>
        </div>
        {tax > 0 ? (
          <div className="receipt-preview-item-row">
            <span>Tax</span>
            <span>{formatMoney(tax, currency)}</span>
          </div>
        ) : null}
        {adjustmentLines.map((line) => (
          <div
            className={`receipt-preview-item-row${line.negative ? ' receipt-preview-discount' : ''}`}
            key={line.label}
          >
            <span>{line.label}</span>
            <span>
              {line.negative ? '-' : ''}
              {formatMoney(line.value, currency)}
            </span>
          </div>
        ))}
        <div className="receipt-preview-item-row receipt-preview-total">
          <span>{totalLabel}</span>
          <span>{formatMoney(total, currency)}</span>
        </div>
        {extraTotalLines.map((line) => (
          <div className="receipt-preview-item-row" key={line.label}>
            <span>{line.label}</span>
            <span>{formatMoney(line.value, currency)}</span>
          </div>
        ))}
        <div className="receipt-preview-item-row">
          <span>{tenderedLabel}</span>
          <span>{formatMoney(tenderedAmount, currency)}</span>
        </div>
        {showChange ? (
          <div className="receipt-preview-item-row receipt-preview-change">
            <span>Change</span>
            <span>{formatMoney(changeAmount, currency)}</span>
          </div>
        ) : null}
      </div>

      <div className="receipt-preview-rule" />
      <p className="receipt-preview-meta">
        {dateLabel} {timeLabel} {cashierName}
      </p>

      {receipt?.showQrCode ? (
        <>
          <ReceiptQr value={saleNumber} />
          <p className="receipt-preview-sale-no">Sale No. {saleNumber}</p>
        </>
      ) : null}

      {receipt?.returnPolicy ? (
        <p className="receipt-preview-policy">{receipt.returnPolicy}</p>
      ) : null}
      {receipt?.footer ? (
        <p className="receipt-preview-thanks">{receipt.footer}</p>
      ) : null}

      {receipt?.showVoucher ? (
        <div className="receipt-preview-voucher">
          <div className="receipt-preview-cut">
            <i className="bi bi-scissors" aria-hidden="true" />
            <span>cut here</span>
          </div>
          <p className="receipt-preview-voucher-title">{receipt.voucherTitle || 'Our Gift To You...'}</p>
          <div className="receipt-preview-dots" />
          {voucherOfferValue ? (
            <p className="receipt-preview-voucher-amount">{voucherOfferValue}</p>
          ) : null}
          <p className="receipt-preview-voucher-offer">
            {receipt.voucherOfferText || 'off your next purchase with us.'}
          </p>
          <div className="receipt-preview-dots" />
          {receipt.voucherLoyaltyText ? (
            <p className="receipt-preview-voucher-loyalty">{receipt.voucherLoyaltyText}</p>
          ) : null}
          <ReceiptQr value={voucherCode} size={96} />
          <p className="receipt-preview-sale-no">{voucherCode}</p>
          <p className="receipt-preview-expiry">
            Expiry {new Date(soldDate.getTime() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
          </p>
          {receipt.voucherTerms ? (
            <p className="receipt-preview-terms">{receipt.voucherTerms}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ReceiptPreview;
