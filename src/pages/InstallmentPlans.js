import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import { installmentSettingsService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { useConfirm } from '../contexts/ConfirmContext';

const InstallmentPlans = () => {
  const { isAdmin } = useAuth();
  const { formatMoney } = useCurrency();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [settingMonths, setSettingMonths] = useState('');
  const [settingInterestRate, setSettingInterestRate] = useState('');

  useEffect(() => {
    if (isAdmin) loadSettings();
  }, [isAdmin]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await installmentSettingsService.getAll();
      setSettings(data.sort((a, b) => a.months - b.months));
    } catch (error) {
      setError('Failed to load installment settings');
    } finally {
      setLoading(false);
    }
  };

  const openAddSettingModal = () => {
    setEditingSetting(null);
    setSettingMonths('');
    setSettingInterestRate('');
    setShowSettingsModal(true);
    setError('');
  };

  const openEditSettingModal = (setting) => {
    setEditingSetting(setting);
    setSettingMonths(setting.months.toString());
    setSettingInterestRate(setting.interest_rate.toString());
    setShowSettingsModal(true);
    setError('');
  };

  const handleSaveSetting = async (e) => {
    e.preventDefault();
    try {
      const months = parseInt(settingMonths, 10);
      const interestRate = parseFloat(settingInterestRate);

      if (months <= 0) {
        setError('Months must be greater than 0');
        return;
      }

      if (interestRate < 0) {
        setError('Interest rate cannot be negative');
        return;
      }

      await installmentSettingsService.update({
        months,
        interest_rate: interestRate,
      });

      setSuccess(`Settings for ${months} months ${editingSetting ? 'updated' : 'added'} successfully`);
      setShowSettingsModal(false);
      await loadSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save settings');
    }
  };

  const handleDeleteSetting = async (months) => {
    const ok = await confirm({
      title: 'Delete settings',
      message: `Are you sure you want to delete settings for ${months} months?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await installmentSettingsService.delete(months);
      setSuccess(`Settings for ${months} months deleted successfully`);
      await loadSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete settings');
    }
  };

  if (loading && settings.length === 0) {
    return <AdminLoading message="Loading installment settings..." />;
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page installment-page">
      <PageHeader
        title="Interest Rate Settings"
        subtitle="Configure interest rates for different installment periods."
      />

      <AdminAlerts
        success={success}
        error={error}
        onClearSuccess={() => setSuccess('')}
        onClearError={() => setError('')}
      />

      {isAdmin && (
        <div className="card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="admin-section-title mb-1">Interest Rate Configuration</h5>
              <p className="admin-section-subtitle">
                These rates will be available when creating new installment sales.
              </p>
            </div>
            <button type="button" onClick={openAddSettingModal} className="btn btn-primary btn-sm">
              <i className="bi bi-plus-circle me-1"></i>
              Add New Setting
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <p className="text-muted text-center py-5 mb-0">Loading settings...</p>
            ) : settings.length === 0 ? (
              <p className="text-muted text-center py-5 mb-0">
                No installment settings found. Click &quot;Add New Setting&quot; to create one.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover admin-table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold">Months</th>
                      <th className="border-0 fw-semibold">Interest Rate</th>
                      <th className="border-0 fw-semibold">Example: $1000 Item</th>
                      <th className="border-0 fw-semibold">Last Updated</th>
                      <th className="border-0 fw-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.map((setting) => {
                      const exampleAmount = 1000;
                      const interestAmount = (exampleAmount * setting.interest_rate) / 100;
                      const totalWithInterest = exampleAmount + interestAmount;
                      const monthlyPayment = totalWithInterest / setting.months;

                      return (
                        <tr key={setting.id}>
                          <td className="fw-semibold">{setting.months} months</td>
                          <td className="text-primary fw-semibold">{setting.interest_rate}%</td>
                          <td className="text-muted">
                            <div>Total: {formatMoney(totalWithInterest)}</div>
                            <div>Monthly: {formatMoney(monthlyPayment)}</div>
                          </td>
                          <td className="text-muted">{new Date(setting.updated_at).toLocaleDateString()}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openEditSettingModal(setting)}
                                className="btn btn-outline-primary btn-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSetting(setting.months)}
                                className="btn btn-outline-danger btn-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingSetting ? 'Edit Installment Setting' : 'Add New Installment Setting'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSettingsModal(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleSaveSetting}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Number of Months *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settingMonths}
                      onChange={(e) => setSettingMonths(e.target.value)}
                      min="1"
                      required
                      disabled={!!editingSetting}
                      placeholder="e.g., 3, 6, 12, 18, 24..."
                    />
                    {editingSetting && (
                      <div className="form-text">
                        Months cannot be changed. Delete and create a new setting if needed.
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Interest Rate (%) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settingInterestRate}
                      onChange={(e) => setSettingInterestRate(e.target.value)}
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g., 5.5, 10, 15.75..."
                    />
                  </div>

                  {settingMonths && settingInterestRate && (
                    <div className="bg-light rounded p-3">
                      <h6 className="fw-semibold mb-2 small">
                        Preview: {formatMoney(1000)} item over {settingMonths} months
                      </h6>
                      <div className="small text-muted">
                        <p className="mb-1">
                          Interest: {formatMoney((1000 * parseFloat(settingInterestRate || 0)) / 100)}
                        </p>
                        <p className="mb-1">
                          Total Amount: {formatMoney(1000 + (1000 * parseFloat(settingInterestRate || 0)) / 100)}
                        </p>
                        <p className="mb-0 fw-semibold text-dark">
                          Monthly Payment:{' '}
                          {formatMoney(
                            (1000 + (1000 * parseFloat(settingInterestRate || 0)) / 100) /
                              parseInt(settingMonths || 1, 10)
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSetting ? 'Update Setting' : 'Add Setting'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentPlans;
