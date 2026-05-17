import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    businessName: 'Bright Mart',
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

      <div className="card mb-4">
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-6"><label className="form-label">Business name</label>
            <input
              type="text"
              name="businessName"
              className="form-control"
              value={formData.businessName}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6"><label className="form-label">Currency</label>
            <select
              name="currency"
              className="form-control"
              value={formData.currency}
              onChange={handleChange}
            >
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>LKR (Rs)</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label">Currency symbol</label>
            <input
              type="text"
              name="currencySymbol"
              className="form-control"
              value={formData.currencySymbol}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6"><label className="form-label">Tax rate (%)</label>
            <input
              type="number"
              name="taxRate"
              className="form-control"
              value={formData.taxRate}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6"><label className="form-label">Low stock threshold</label>
            <input
              type="number"
              name="lowStockThreshold"
              className="form-control"
              value={formData.lowStockThreshold}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6"><label className="form-label">Receipt footer</label>
            <input
              type="text"
              name="receiptFooter"
              className="form-control"
              value={formData.receiptFooter}
              onChange={handleChange}
            />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary">
              Save settings
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header-flex">
          <div>
            <h2 className="card-title">Demo Accounts</h2>
            <p className="text-sm text-gray-500">These accounts are preloaded for demonstration. Admin has full access, Teller can only use POS.</p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>USERNAME</th>
                <th className="border-0 fw-semibold">PASSWORD</th>
                <th className="border-0 fw-semibold">ROLE</th>
                <th className="border-0 fw-semibold">ACCESS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>admin</td>
                <td>admin123</td>
                <td><span className="badge bg-primary">admin</span></td>
                <td>Dashboard, POS, Inventory, Settings</td>
              </tr>
              <tr>
                <td>teller</td>
                <td>teller123</td>
                <td><span className="badge bg-secondary">teller</span></td>
                <td>POS only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Settings;
