import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import { settingsService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useTenantSettings } from '../contexts/TenantSettingsContext';
import { CURRENCY_OPTIONS } from '../utils/currency';
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from '../utils/phone';

const Settings = () => {
  const { refreshUser } = useAuth();
  const { settings, reloadSettings, setSettings } = useTenantSettings();
  const [formData, setFormData] = useState({
    businessName: '',
    currency: CURRENCY_OPTIONS[0].label,
    countryCode: DEFAULT_COUNTRY_CODE,
    taxRate: '0',
    lowStockThreshold: '15',
    receiptFooter: 'Thank you for shopping with us!',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCurrency = useMemo(
    () => CURRENCY_OPTIONS.find((c) => c.label === formData.currency) || CURRENCY_OPTIONS[0],
    [formData.currency]
  );

  useEffect(() => {
    if (!settings) return;
    setFormData({
      businessName: settings.businessName || '',
      currency: settings.currencyLabel || CURRENCY_OPTIONS[0].label,
      countryCode: settings.countryCode || DEFAULT_COUNTRY_CODE,
      taxRate: String(settings.taxRate ?? 0),
      lowStockThreshold: String(settings.lowStockThreshold ?? 15),
      receiptFooter: settings.receiptFooter || '',
    });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await settingsService.update({
        businessName: formData.businessName,
        currency: formData.currency,
        currencySymbol: selectedCurrency.symbol,
        countryCode: formData.countryCode,
        taxRate: parseFloat(formData.taxRate) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 0,
        receiptFooter: formData.receiptFooter,
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
    <div className="container-fluid py-4 matte-page admin-page">
      <PageHeader
        title="Store Settings"
        subtitle="Customize your business information, country, currency and tax behavior."
      />

      <AdminAlerts success={success} error={error} onClearSuccess={() => setSuccess('')} onClearError={() => setError('')} />

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="card settings-card">
          <div className="card-header">
            <div className="admin-section-title mb-0">Store details</div>
            <p className="admin-section-subtitle">How this store is identified.</p>
          </div>
          <div className="card-body">
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
            </div>
          </div>
        </div>

        <div className="card settings-card">
          <div className="card-header">
            <div className="admin-section-title mb-0">Currency &amp; tax</div>
            <p className="admin-section-subtitle">Used on prices, receipts and reports.</p>
          </div>
          <div className="card-body">
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
          </div>
        </div>

        <div className="card settings-card">
          <div className="card-header">
            <div className="admin-section-title mb-0">Inventory &amp; receipts</div>
            <p className="admin-section-subtitle">Stock alerts and printed receipt text.</p>
          </div>
          <div className="card-body">
            <div className="row g-3">
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
              <div className="col-md-6">
                <label htmlFor="settings-receipt-footer" className="form-label fw-semibold">
                  Receipt footer
                </label>
                <input
                  id="settings-receipt-footer"
                  type="text"
                  name="receiptFooter"
                  className="form-control"
                  value={formData.receiptFooter}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
