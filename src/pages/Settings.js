import React, { useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import ReceiptPreview from '../components/ReceiptPreview';
import ReceiptLogoCropper from '../components/ReceiptLogoCropper';
import { settingsService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useTenantSettings } from '../contexts/TenantSettingsContext';
import { CURRENCY_OPTIONS } from '../utils/currency';
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from '../utils/phone';
import { DEFAULT_RECEIPT, mergeReceipt } from '../utils/receipt';
import { resolveProductImageUrl } from '../utils/productImage';
import { RECEIPT_LOGO, RECEIPT_LOGO_HINT, validateReceiptLogoFile } from '../utils/receiptLogo';

const TABS = [
  { id: 'store', label: 'Store details' },
  { id: 'currency', label: 'Currency & tax' },
  { id: 'receipt', label: 'Receipt' },
];

const Settings = () => {
  const { refreshUser } = useAuth();
  const { settings, reloadSettings, setSettings } = useTenantSettings();
  const logoInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('store');
  const [formData, setFormData] = useState({
    businessName: '',
    currency: CURRENCY_OPTIONS[0].label,
    countryCode: DEFAULT_COUNTRY_CODE,
    taxRate: '0',
    lowStockThreshold: '15',
    receipt: { ...DEFAULT_RECEIPT },
  });
  const [removeReceiptLogo, setRemoveReceiptLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [cropSrc, setCropSrc] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCurrency = useMemo(
    () => CURRENCY_OPTIONS.find((c) => c.label === formData.currency) || CURRENCY_OPTIONS[0],
    [formData.currency]
  );

  const logoPreview = useMemo(() => {
    if (removeReceiptLogo) return null;
    return resolveProductImageUrl(formData.receipt.logo);
  }, [formData.receipt.logo, removeReceiptLogo]);

  useEffect(() => {
    if (!settings) return;
    setFormData({
      businessName: settings.businessName || '',
      currency: settings.currencyLabel || CURRENCY_OPTIONS[0].label,
      countryCode: settings.countryCode || DEFAULT_COUNTRY_CODE,
      taxRate: String(settings.taxRate ?? 0),
      lowStockThreshold: String(settings.lowStockThreshold ?? 15),
      receipt: mergeReceipt(settings.receipt, settings.receiptFooter),
    });
    setRemoveReceiptLogo(false);
    setLogoError('');
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReceiptChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      receipt: {
        ...prev.receipt,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');
    setError('');
    try {
      const dataUrl = await validateReceiptLogoFile(file, logoInputRef.current);
      if (logoInputRef.current) logoInputRef.current.value = '';
      setCropSrc(dataUrl);
    } catch (err) {
      setLogoError(err.message || 'Invalid logo file.');
    }
  };

  const handleLogoCropApply = (dataUrl) => {
    setCropSrc(null);
    setRemoveReceiptLogo(false);
    setLogoError('');
    setFormData((prev) => ({
      ...prev,
      receipt: { ...prev.receipt, logo: dataUrl },
    }));
  };

  const handleLogoCropCancel = () => {
    setCropSrc(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleLogoAdjust = () => {
    if (!logoPreview) return;
    setLogoError('');
    setCropSrc(logoPreview);
  };

  const handleLogoRemove = () => {
    if (logoInputRef.current) logoInputRef.current.value = '';
    setLogoError('');
    setRemoveReceiptLogo(true);
    setFormData((prev) => ({
      ...prev,
      receipt: { ...prev.receipt, logo: null },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const receiptPayload = { ...formData.receipt };
      if (removeReceiptLogo) {
        receiptPayload.logo = null;
      } else if (receiptPayload.logo && !String(receiptPayload.logo).startsWith('data:')) {
        delete receiptPayload.logo;
      }

      const updated = await settingsService.update({
        businessName: formData.businessName,
        currency: formData.currency,
        currencySymbol: selectedCurrency.symbol,
        countryCode: formData.countryCode,
        taxRate: parseFloat(formData.taxRate) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 0,
        receiptFooter: formData.receipt.footer,
        receipt: receiptPayload,
        removeReceiptLogo,
      });
      setSettings(updated);
      await reloadSettings();
      await refreshUser();
      setSuccess('Settings saved. Currency updates apply for all staff in this store.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid matte-page admin-page settings-page">
      <PageHeader
        title="Store Settings"
        subtitle="Customize your business information, country, currency and tax behavior."
        actions={
          <button type="submit" form="store-settings-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        }
      />

      <AdminAlerts success={success} error={error} onClearSuccess={() => setSuccess('')} onClearError={() => setError('')} />

      <form
        id="store-settings-form"
        onSubmit={handleSubmit}
        className={`settings-form${activeTab === 'receipt' ? ' is-receipt' : ''}`}
      >
        <div className={`card settings-card${activeTab === 'receipt' ? ' settings-card--receipt' : ''}`}>
          <div className="card-header settings-card-tabs">
            <ul className="nav nav-tabs admin-tabs mb-0">
              {TABS.map((tab) => (
                <li className="nav-item" key={tab.id}>
                  <button
                    type="button"
                    className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-body">
            {activeTab === 'store' && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="settings-business-name" className="form-label fw-semibold">
                    Business name
                  </label>
                  <input
                    id="settings-business-name"
                    type="text"
                    name="businessName"
                    className="form-control"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="settings-country" className="form-label fw-semibold">
                    Country
                  </label>
                  <select
                    id="settings-country"
                    name="countryCode"
                    className="form-select"
                    value={formData.countryCode}
                    onChange={handleChange}
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="settings-low-stock" className="form-label fw-semibold">
                    Low stock threshold
                  </label>
                  <input
                    id="settings-low-stock"
                    type="number"
                    name="lowStockThreshold"
                    className="form-control"
                    value={formData.lowStockThreshold}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            )}

            {activeTab === 'currency' && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="settings-currency" className="form-label fw-semibold">
                    Currency
                  </label>
                  <div className="settings-currency-field">
                    <span className="settings-currency-prefix" aria-label="Currency symbol">
                      {selectedCurrency.symbol}
                    </span>
                    <select
                      id="settings-currency"
                      name="currency"
                      className="form-select"
                      value={formData.currency}
                      onChange={handleChange}
                      aria-label="Currency"
                    >
                      {CURRENCY_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.label}>
                          {opt.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="settings-tax-rate" className="form-label fw-semibold">
                    Tax rate (%)
                  </label>
                  <input
                    id="settings-tax-rate"
                    type="number"
                    name="taxRate"
                    className="form-control"
                    value={formData.taxRate}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {activeTab === 'receipt' && (
              <div className="receipt-designer">
                <div className="receipt-designer-form">
                  <input
                    ref={logoInputRef}
                    type="file"
                    className="d-none"
                    accept={RECEIPT_LOGO.accept}
                    onChange={handleLogoSelect}
                  />

                  <div className="receipt-field">
                    <label className="form-label fw-semibold">Logo</label>
                    {logoPreview ? (
                      <div className="receipt-logo-row">
                        <button
                          type="button"
                          className="receipt-logo-btn"
                          onClick={handleLogoAdjust}
                          title="Adjust logo"
                        >
                          <img src={logoPreview} alt="Receipt logo" />
                        </button>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={handleLogoAdjust}
                          >
                            Adjust
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => logoInputRef.current?.click()}
                          >
                            Change
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleLogoRemove}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="receipt-logo-empty"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        Upload logo
                      </button>
                    )}
                    {logoError ? (
                      <div className="invalid-feedback d-block">{logoError}</div>
                    ) : (
                      <div className="form-text mb-0">{RECEIPT_LOGO_HINT}</div>
                    )}
                  </div>

                  <div className="receipt-field">
                    <label htmlFor="receipt-slogan" className="form-label fw-semibold">
                      Slogan
                    </label>
                    <input
                      id="receipt-slogan"
                      name="slogan"
                      className="form-control form-control-sm"
                      value={formData.receipt.slogan}
                      onChange={handleReceiptChange}
                      placeholder="We're here to help."
                    />
                  </div>

                  <div className="receipt-field">
                    <label htmlFor="receipt-registration" className="form-label fw-semibold">
                      Registration / ABN
                    </label>
                    <input
                      id="receipt-registration"
                      name="registrationNumber"
                      className="form-control form-control-sm"
                      value={formData.receipt.registrationNumber}
                      onChange={handleReceiptChange}
                      placeholder="ABN 123456789"
                    />
                  </div>

                  <div className="receipt-field">
                    <label htmlFor="receipt-address" className="form-label fw-semibold">
                      Address
                    </label>
                    <input
                      id="receipt-address"
                      name="address"
                      className="form-control form-control-sm"
                      value={formData.receipt.address}
                      onChange={handleReceiptChange}
                      placeholder="Street, city, postcode"
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-md-6">
                      <label htmlFor="receipt-email" className="form-label fw-semibold">
                        Email
                      </label>
                      <input
                        id="receipt-email"
                        name="email"
                        className="form-control form-control-sm"
                        value={formData.receipt.email}
                        onChange={handleReceiptChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="receipt-website" className="form-label fw-semibold">
                        Website
                      </label>
                      <input
                        id="receipt-website"
                        name="website"
                        className="form-control form-control-sm"
                        value={formData.receipt.website}
                        onChange={handleReceiptChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="receipt-phone" className="form-label fw-semibold">
                        Phone
                      </label>
                      <input
                        id="receipt-phone"
                        name="phone"
                        className="form-control form-control-sm"
                        value={formData.receipt.phone}
                        onChange={handleReceiptChange}
                      />
                    </div>
                  </div>

                  <div className="receipt-field">
                    <label htmlFor="receipt-header-message" className="form-label fw-semibold">
                      Header message
                    </label>
                    <input
                      id="receipt-header-message"
                      name="headerMessage"
                      className="form-control form-control-sm"
                      value={formData.receipt.headerMessage}
                      onChange={handleReceiptChange}
                      placeholder="We proudly support local suppliers."
                    />
                  </div>

                  <div className="receipt-field">
                    <label htmlFor="receipt-invoice-title" className="form-label fw-semibold">
                      Invoice title
                    </label>
                    <input
                      id="receipt-invoice-title"
                      name="invoiceTitle"
                      className="form-control form-control-sm"
                      value={formData.receipt.invoiceTitle}
                      onChange={handleReceiptChange}
                    />
                  </div>

                  <div className="receipt-field">
                    <label htmlFor="receipt-return-policy" className="form-label fw-semibold">
                      Return policy
                    </label>
                    <textarea
                      id="receipt-return-policy"
                      name="returnPolicy"
                      className="form-control form-control-sm"
                      rows={2}
                      value={formData.receipt.returnPolicy}
                      onChange={handleReceiptChange}
                    />
                  </div>

                  <div className="receipt-field">
                    <label htmlFor="receipt-footer" className="form-label fw-semibold">
                      Thank-you message
                    </label>
                    <input
                      id="receipt-footer"
                      name="footer"
                      className="form-control form-control-sm"
                      value={formData.receipt.footer}
                      onChange={handleReceiptChange}
                    />
                  </div>

                  <div className="form-check">
                    <input
                      id="receipt-show-qr"
                      name="showQrCode"
                      className="form-check-input"
                      type="checkbox"
                      checked={Boolean(formData.receipt.showQrCode)}
                      onChange={handleReceiptChange}
                    />
                    <label htmlFor="receipt-show-qr" className="form-check-label">
                      Show sale QR code
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      id="receipt-show-voucher"
                      name="showVoucher"
                      className="form-check-input"
                      type="checkbox"
                      checked={Boolean(formData.receipt.showVoucher)}
                      onChange={handleReceiptChange}
                    />
                    <label htmlFor="receipt-show-voucher" className="form-check-label">
                      Include gift voucher
                    </label>
                  </div>

                  {formData.receipt.showVoucher && (
                    <>
                      <div className="receipt-field">
                        <label htmlFor="receipt-voucher-title" className="form-label fw-semibold">
                          Voucher title
                        </label>
                        <input
                          id="receipt-voucher-title"
                          name="voucherTitle"
                          className="form-control form-control-sm"
                          value={formData.receipt.voucherTitle}
                          onChange={handleReceiptChange}
                        />
                      </div>
                      <div className="receipt-field">
                        <label htmlFor="receipt-voucher-offer" className="form-label fw-semibold">
                          Offer text
                        </label>
                        <input
                          id="receipt-voucher-offer"
                          name="voucherOfferText"
                          className="form-control form-control-sm"
                          value={formData.receipt.voucherOfferText}
                          onChange={handleReceiptChange}
                        />
                      </div>
                      <div className="receipt-field">
                        <label htmlFor="receipt-voucher-loyalty" className="form-label fw-semibold">
                          Loyalty message
                        </label>
                        <textarea
                          id="receipt-voucher-loyalty"
                          name="voucherLoyaltyText"
                          className="form-control form-control-sm"
                          rows={2}
                          value={formData.receipt.voucherLoyaltyText}
                          onChange={handleReceiptChange}
                        />
                      </div>
                      <div className="receipt-field">
                        <label htmlFor="receipt-voucher-terms" className="form-label fw-semibold">
                          Terms
                        </label>
                        <textarea
                          id="receipt-voucher-terms"
                          name="voucherTerms"
                          className="form-control form-control-sm"
                          rows={2}
                          value={formData.receipt.voucherTerms}
                          onChange={handleReceiptChange}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="receipt-designer-preview">
                  <div className="receipt-designer-preview-label">Live preview</div>
                  <div className="receipt-preview-stage">
                    <ReceiptPreview
                      businessName={formData.businessName}
                      currency={selectedCurrency}
                      taxRate={formData.taxRate}
                      receipt={{
                        ...formData.receipt,
                        logo: removeReceiptLogo ? null : formData.receipt.logo,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
      {cropSrc ? (
        <ReceiptLogoCropper
          src={cropSrc}
          onApply={handleLogoCropApply}
          onCancel={handleLogoCropCancel}
          onError={(message) => {
            setCropSrc(null);
            setLogoError(message);
          }}
        />
      ) : null}
    </div>
  );
};

export default Settings;
