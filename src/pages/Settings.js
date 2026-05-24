import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import { APP_NAME } from '../config/app';

const Settings = () => {
  const [formData, setFormData] = useState({
    businessName: APP_NAME,
    currency: 'USD ($)',
    currencySymbol: 'Rs',
    taxRate: '8',
    lowStockThreshold: '15',
    receiptFooter: 'Thank you for shopping with us!',
  });
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess('Settings saved successfully.');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="container-fluid py-4 matte-page admin-page">
      <PageHeader
        title="Store Settings"
        subtitle="Customize your business information, currency and tax behavior."
      />

      <AdminAlerts success={success} onClearSuccess={() => setSuccess('')} />

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
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>LKR (Rs)</option>
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
              <div className="col-12 pt-2">
                <button type="submit" className="btn btn-primary">
                  Save settings
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
