import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { customerService, PERMISSIONS } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/TenantSettingsContext';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import PaginationBar from '../components/PaginationBar';
import { usePagination } from '../hooks/usePagination';
import { formatOrderId } from '../utils/orderId';
import { resolveProductImageUrl } from '../utils/productImage';
import { sanitizeLocalPhoneInput, phoneValidationMessage } from '../utils/phone';

const EMPTY_FORM = {
  name: '',
  phone: '',
  idCardNo: '',
  email: '',
  address: '',
};

const OPEN_STATUSES = new Set(['active', 'adjusted']);

const Customers = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { formatMoney, settings } = useCurrency();
  const countryCode = settings?.countryCode;
  const canManage = hasPermission(PERMISSIONS.USERS_MANAGE);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadCustomers = useCallback(async (query = '') => {
    try {
      const term = String(query || '').trim();
      const data = term ? await customerService.search(term) : await customerService.getAll();
      setCustomers(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || t('failedToLoadCustomers'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const term = searchQuery.trim();
    const delay = term ? 250 : 0;
    const timer = setTimeout(() => {
      loadCustomers(term);
    }, delay);
    return () => clearTimeout(timer);
  }, [searchQuery, loadCustomers]);

  const { page, setPage, pageItems, total, totalPages, pageSize } = usePagination(customers, {
    resetKey: searchQuery,
  });

  const openAddModal = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
    setError('');
  };

  const openEditModal = (customer) => {
    setEditing(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      idCardNo: customer.id_card_no || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowModal(true);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'phone' ? sanitizeLocalPhoneInput(value, countryCode) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const phoneError = phoneValidationMessage(formData.phone, countryCode);
    if (phoneError) {
      setError(phoneError);
      setSaving(false);
      return;
    }
    try {
      if (editing) {
        await customerService.update(editing.id, formData);
        setSuccess(t('customerUpdated'));
      } else {
        await customerService.create(formData);
        setSuccess(t('customerCreated'));
      }
      setShowModal(false);
      await loadCustomers(searchQuery);
      if (editing && String(expandedId) === String(editing.id)) {
        const details = await customerService.getById(editing.id);
        setProfile(details);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('failedToSaveCustomer'));
    } finally {
      setSaving(false);
    }
  };

  const toggleProfile = async (customer) => {
    const nextId = String(expandedId) === String(customer.id) ? null : customer.id;
    setExpandedId(nextId);
    if (!nextId) {
      setProfile(null);
      return;
    }
    setLoadingProfile(true);
    try {
      const details = await customerService.getById(customer.id);
      setProfile(details);
    } catch (err) {
      setError(err.response?.data?.error || t('failedToLoadCustomers'));
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  if (loading) {
    return <AdminLoading message={t('loadingCustomers')} />;
  }

  return (
    <div className="container-fluid matte-page admin-page table-page">
      <PageHeader
        title={t('customerManagement')}
        subtitle={t('customersSubtitle')}
        actions={
          canManage ? (
            <button type="button" onClick={openAddModal} className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              {t('addCustomer')}
            </button>
          ) : null
        }
      />

      <AdminAlerts
        success={success}
        error={!showModal ? error : ''}
        onClearSuccess={() => setSuccess('')}
        onClearError={() => setError('')}
      />

      <div className="d-flex flex-wrap gap-2 mb-2">
        <input
          type="search"
          className="form-control form-control-sm"
          style={{ maxWidth: 280 }}
          placeholder={t('searchCustomers')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="card table-panel">
        <div className="card-body p-0">
          {customers.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-person-vcard text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">{t('noCustomersFound')}</h5>
              <p className="text-muted mb-0">
                {searchQuery.trim() ? t('tryAdjustCustomerSearch') : t('addFirstCustomer')}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover admin-table mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 order-id-toggle" aria-label={t('expand')}></th>
                    <th className="border-0 fw-semibold">{t('name')}</th>
                    <th className="border-0 fw-semibold">{t('phone')}</th>
                    <th className="border-0 fw-semibold">{t('idCard')}</th>
                    <th className="border-0 fw-semibold">{t('email')}</th>
                    <th className="border-0 fw-semibold">{t('openPlans')}</th>
                    {canManage && <th className="border-0 fw-semibold">{t('actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((customer) => {
                    const isExpanded = String(expandedId) === String(customer.id);
                    const plans = isExpanded ? profile?.plans || [] : [];
                    return (
                      <React.Fragment key={customer.id}>
                        <tr
                          className={`plan-expand-row${isExpanded ? ' is-expanded' : ''}`}
                          onClick={() => toggleProfile(customer)}
                        >
                          <td className="order-id-toggle">
                            <span className="plan-expand-icon">
                              <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                            </span>
                          </td>
                          <td className="fw-semibold">{customer.name || '-'}</td>
                          <td className="text-muted">{customer.phone || '-'}</td>
                          <td className="text-muted">{customer.id_card_no || '-'}</td>
                          <td className="text-muted">{customer.email || '-'}</td>
                          <td>
                            <span className={`badge ${customer.open_plans_count ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                              {customer.open_plans_count || 0}
                            </span>
                          </td>
                          {canManage && (
                            <td>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                title={t('editCustomer')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(customer);
                                }}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                            </td>
                          )}
                        </tr>
                        {isExpanded && (
                          <tr className="plan-installments-row">
                            <td colSpan={canManage ? 7 : 6}>
                              <div className="plan-installments-wrap">
                                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                  <strong className="small">{t('customerPlans')}</strong>
                                  <Link to="/installment-payments" className="small text-decoration-none">
                                    {t('viewPayments')}
                                  </Link>
                                </div>
                                {loadingProfile ? (
                                  <p className="text-muted small mb-0 py-2">{t('loadingPlans')}</p>
                                ) : plans.length === 0 ? (
                                  <p className="text-muted small mb-0 py-2">{t('noPlansForCustomer')}</p>
                                ) : (
                                  <table className="table table-sm admin-table mb-0">
                                    <thead>
                                      <tr>
                                        <th>{t('orderId')}</th>
                                        <th>{t('status')}</th>
                                        <th>{t('remaining')}</th>
                                        <th>{t('monthlyPayment')}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {plans.map((plan) => (
                                        <tr key={plan.id}>
                                          <td>
                                            <span className="order-id-badge">
                                              {formatOrderId(plan.order_number, plan.sale_id, plan.id)}
                                            </span>
                                          </td>
                                          <td>
                                            <span
                                              className={`badge ${
                                                OPEN_STATUSES.has(plan.status) ? 'bg-success' : 'bg-secondary'
                                              }`}
                                            >
                                              {t(`status_${plan.status}`, { defaultValue: plan.status })}
                                            </span>
                                          </td>
                                          <td className="fw-semibold">{formatMoney(plan.remaining)}</td>
                                          <td>{formatMoney(plan.monthly_payment)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
            label={t('customers')}
          />
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? t('editCustomer') : t('addCustomer')}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label={t('Close')}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger py-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}
                  {resolveProductImageUrl(editing?.id_image_path) ? (
                    <div className="mb-3">
                      <div className="form-label fw-semibold">{t('idCard')}</div>
                      <img
                        src={resolveProductImageUrl(editing.id_image_path)}
                        alt=""
                        style={{ maxHeight: 96, borderRadius: 6 }}
                      />
                    </div>
                  ) : null}
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold" htmlFor="customer-name">
                        {t('name')}
                      </label>
                      <input
                        id="customer-name"
                        name="name"
                        className="form-control form-control-sm"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold" htmlFor="customer-phone">
                        {t('phone')} *
                      </label>
                      <input
                        id="customer-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        className="form-control form-control-sm"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        autoFocus
                        placeholder={t('phoneLocalPlaceholder')}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold" htmlFor="customer-id-card">
                        {t('idCard')}
                      </label>
                      <input
                        id="customer-id-card"
                        name="idCardNo"
                        className="form-control form-control-sm"
                        value={formData.idCardNo}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold" htmlFor="customer-email">
                        {t('email')}
                      </label>
                      <input
                        id="customer-email"
                        name="email"
                        type="email"
                        className="form-control form-control-sm"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" htmlFor="customer-address">
                        {t('address')}
                      </label>
                      <input
                        id="customer-address"
                        name="address"
                        className="form-control form-control-sm"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? t('saving') : editing ? t('updateCustomer') : t('saveCustomer')}
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

export default Customers;
