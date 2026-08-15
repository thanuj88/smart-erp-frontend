import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import { settingsService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useTenantSettings } from '../contexts/TenantSettingsContext';
import { CURRENCY_OPTIONS } from '../utils/currency';

const Settings = () => {
  const { refreshUser } = useAuth();
  const { settings, reloadSettings, setSettings } = useTenantSettings();
  const [formData, setFormData] = useState({
    businessName: '',
    currency: CURRENCY_OPTIONS[0].label,
    currencySymbol: CURRENCY_OPTIONS[0].symbol,
    taxRate: '0',
    lowStockThreshold: '15',
    receiptFooter: 'Thank you for shopping with us!',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setFormData({
      businessName: settings.businessName || '',
      currency: settings.currencyLabel || CURRENCY_OPTIONS[0].label,
      currencySymbol: settings.currencySymbol || CURRENCY_OPTIONS[0].symbol,
      taxRate: String(settings.taxRate ?? 0),
      lowStockThreshold: String(settings.lowStockThreshold ?? 15),
      receiptFooter: settings.receiptFooter || '',
    });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currency') {
      const option = CURRENCY_OPTIONS.find((c) => c.label === value);
      setFormData((prev) => ({
        ...prev,
        currency: value,
        currencySymbol: option?.symbol ?? prev.currencySymbol,
      }));
      return;
    }
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
        currencySymbol: formData.currencySymbol,
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
        subtitle="Customize your business information, currency and tax behavior."
      />

      <AdminAlerts success={success} error={error} onClearSuccess={() => setSuccess('')} onClearError={() => setError('')} />

      <div className="card settings-card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
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
                <label htmlFor="settings-currency" className="form-label fw-semibold">
                  Currency
                </label>
                <select
                  id="settings-currency"
                  name="currency"
                  className="form-select"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="settings-currency-symbol" className="form-label fw-semibold">
                  Currency symbol
                </label>
                <input
                  id="settings-currency-symbol"
                  type="text"
                  name="currencySymbol"
                  className="form-control"
                  value={formData.currencySymbol}
                  onChange={handleChange}
                />
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
              <div className="col-12 pt-2 d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
