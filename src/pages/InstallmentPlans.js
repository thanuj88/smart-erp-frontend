import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import { installmentSettingsService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { useConfirm } from '../contexts/ConfirmContext';
import PaginationBar from '../components/PaginationBar';
import { usePagination } from '../hooks/usePagination';
import { useTranslation } from 'react-i18next';

const InstallmentPlans = () => {
  const { t } = useTranslation();
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
      title: t('deleteSettings'),
      message: t('deleteSettingsConfirm', { months }),
      confirmLabel: t('delete'),
      cancelLabel: t('cancel'),
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

  const {
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    pageSize,
  } = usePagination(settings);

  if (loading && settings.length === 0) {
    return <AdminLoading message={t('loadingInstallmentSettings')} />;
  }

  return (
    <div className="container-fluid matte-page admin-page installment-page table-page">
      <PageHeader
        title={t('interestRateSettings')}
        subtitle={t('interestRateSubtitle')}
      />

      <AdminAlerts
        success={success}
        error={error}
        onClearSuccess={() => setSuccess('')}
        onClearError={() => setError('')}
      />

      {isAdmin && (
        <div className="card table-panel">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="admin-section-title mb-1">{t('interestRateConfiguration')}</h5>
              <p className="admin-section-subtitle">
                {t('interestRateHelp')}
              </p>
            </div>
            <button type="button" onClick={openAddSettingModal} className="btn btn-primary btn-sm">
              <i className="bi bi-plus-circle me-1"></i>
              {t('addNewSetting')}
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <p className="text-muted text-center py-5 mb-0">{t('loadingSettings')}</p>
            ) : settings.length === 0 ? (
              <p className="text-muted text-center py-5 mb-0">
                {t('noInstallmentSettings')}
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover admin-table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold">{t('months')}</th>
                      <th className="border-0 fw-semibold">{t('interestRate')}</th>
                      <th className="border-0 fw-semibold">{t('exampleItem', { amount: formatMoney(1000) })}</th>
                      <th className="border-0 fw-semibold">{t('lastUpdated')}</th>
                      <th className="border-0 fw-semibold">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((setting) => {
                      const exampleAmount = 1000;
                      const interestAmount = (exampleAmount * setting.interest_rate) / 100;
                      const totalWithInterest = exampleAmount + interestAmount;
                      const monthlyPayment = totalWithInterest / setting.months;

                      return (
                        <tr key={setting.id}>
                          <td className="fw-semibold">{t('monthsCount', { count: setting.months })}</td>
                          <td className="text-primary fw-semibold">{setting.interest_rate}%</td>
                          <td className="text-muted">
                            {t('totalMonthlyExample', {
                              total: formatMoney(totalWithInterest),
                              monthly: formatMoney(monthlyPayment),
                            })}
                          </td>
                          <td className="text-muted">{new Date(setting.updated_at).toLocaleDateString()}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openEditSettingModal(setting)}
                                className="btn btn-outline-primary btn-sm"
                              >
                                {t('edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSetting(setting.months)}
                                className="btn btn-outline-danger btn-sm"
                              >
                                {t('delete')}
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
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
              label={t('rateSettings')}
            />
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingSetting ? t('editInstallmentSetting') : t('addInstallmentSetting')}
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
                    <label className="form-label fw-semibold">{t('numberOfMonths')} *</label>
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
                        {t('monthsCannotChange')}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">{t('interestRate')} (%) *</label>
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
                        {t('previewItemOverMonths', { amount: formatMoney(1000), months: settingMonths })}
                      </h6>
                      <div className="small text-muted">
                        <p className="mb-1">
                          {t('interest')}: {formatMoney((1000 * parseFloat(settingInterestRate || 0)) / 100)}
                        </p>
                        <p className="mb-1">
                          {t('totalAmount')}: {formatMoney(1000 + (1000 * parseFloat(settingInterestRate || 0)) / 100)}
                        </p>
                        <p className="mb-0 fw-semibold text-dark">
                          {t('monthlyPayment')}:{' '}
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
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSetting ? t('updateSetting') : t('addSetting')}
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
