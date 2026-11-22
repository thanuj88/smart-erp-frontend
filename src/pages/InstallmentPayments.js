import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import ReceiptPrintLayer from '../components/ReceiptPrintLayer';
import { installmentPaymentService, installmentPlanService, PERMISSIONS } from '../services';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { createInstallmentReceiptPrintJob } from '../utils/receipt';
import { formatOrderId } from '../utils/orderId';
import PaginationBar from '../components/PaginationBar';
import DateRangePicker from '../components/DateRangePicker';
import { usePagination } from '../hooks/usePagination';
import { useTranslation } from 'react-i18next';

const localDay = (value) => {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const matchesOrderQuery = (query, ...parts) => {
  const needle = String(query || '').replace(/[#\s]/g, '').toLowerCase();
  if (!needle) return true;
  const hay = parts
    .filter((part) => part != null && part !== '')
    .join(' ')
    .replace(/[#\s]/g, '')
    .toLowerCase();
  return hay.includes(needle);
};

const matchesText = (query, ...parts) => {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return true;
  return parts.some((part) => String(part || '').toLowerCase().includes(needle));
};

const matchesPhone = (query, value) => {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return true;
  const raw = String(value || '').toLowerCase();
  if (raw.includes(needle)) return true;
  const digits = needle.replace(/\D/g, '');
  if (!digits) return false;
  return raw.replace(/\D/g, '').includes(digits);
};

const isOverduePayment = (dueDate, status) => {
  if (status === 'paid') return false;
  return new Date(dueDate) < new Date();
};

const InstallmentsTable = ({
  installments,
  customerName,
  customerPhone,
  canRecordPayment,
  onRecord,
  formatMoney,
  t,
}) => {
  const [filterNumber, setFilterNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const statusKey = (payment) =>
    (isOverduePayment(payment.due_date, payment.status) ? 'overdue' : payment.status);

  const statusOptions = useMemo(() => {
    const names = [...new Set((installments || []).map(statusKey).filter(Boolean))];
    return names.sort((a, b) => String(a).localeCompare(String(b)));
  }, [installments]);

  const filtered = useMemo(() => {
    return (installments || []).filter((payment) => {
      if (filterNumber) {
        const needle = filterNumber.replace(/[#\s]/g, '').toLowerCase();
        const hay = String(payment.payment_number ?? '').replace(/[#\s]/g, '').toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (filterStatus && statusKey(payment) !== filterStatus) return false;
      if (filterStartDate || filterEndDate) {
        const day = localDay(payment.due_date);
        if (filterStartDate && day < filterStartDate) return false;
        if (filterEndDate && day > filterEndDate) return false;
      }
      return true;
    });
  }, [installments, filterNumber, filterStatus, filterStartDate, filterEndDate]);

  const hasActiveFilters = Boolean(filterNumber || filterStatus || filterStartDate || filterEndDate);
  const colSpan = canRecordPayment ? 7 : 6;

  const badgeClass = (payment) => {
    if (isOverduePayment(payment.due_date, payment.status)) return 'bg-danger';
    if (payment.status === 'paid') return 'bg-success';
    return 'bg-warning text-dark';
  };

  const label = (payment) => {
    if (isOverduePayment(payment.due_date, payment.status)) return t('overdue');
    return t(`status_${payment.status}`, { defaultValue: payment.status });
  };

  return (
    <table className="table table-hover admin-table mb-0">
      <thead className="table-light">
        <tr>
          <th>{t('paymentNumber')}</th>
          <th>{t('dueDate')}</th>
          <th>{t('amountDue')}</th>
          <th>{t('amountPaid')}</th>
          <th>{t('remaining')}</th>
          <th>{t('status')}</th>
          {canRecordPayment && <th>{t('actions')}</th>}
        </tr>
        <tr className="report-filter-row">
          <th>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder={t('paymentNumber')}
              value={filterNumber}
              onChange={(e) => setFilterNumber(e.target.value)}
              aria-label={t('paymentNumber')}
            />
          </th>
          <th>
            <DateRangePicker
              startDate={filterStartDate}
              endDate={filterEndDate}
              placeholder={t('dates')}
              onChange={({ startDate, endDate }) => {
                setFilterStartDate(startDate);
                setFilterEndDate(endDate);
              }}
            />
          </th>
          <th />
          <th />
          <th />
          <th>
            <div className="report-teller-filter">
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label={t('status')}
              >
                <option value="">{t('allStatuses')}</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {t(`status_${status}`, { defaultValue: status })}
                  </option>
                ))}
              </select>
              {!canRecordPayment && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setFilterNumber('');
                    setFilterStatus('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  disabled={!hasActiveFilters}
                >
                  {t('clear')}
                </button>
              )}
            </div>
          </th>
          {canRecordPayment && (
            <th>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setFilterNumber('');
                  setFilterStatus('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                disabled={!hasActiveFilters}
              >
                {t('clear')}
              </button>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={colSpan} className="text-muted text-center py-3">
              {hasActiveFilters ? t('tryAdjustFilters') : t('noInstallmentsFound')}
            </td>
          </tr>
        ) : (
          filtered.map((payment) => (
            <tr
              key={payment.id}
              className={isOverduePayment(payment.due_date, payment.status) ? 'table-danger' : ''}
            >
              <td className="fw-semibold">#{payment.payment_number}</td>
              <td>
                {new Date(payment.due_date).toLocaleDateString()}
                {isOverduePayment(payment.due_date, payment.status) && (
                  <span className="badge bg-danger ms-2">{t('overdue')}</span>
                )}
              </td>
              <td>{formatMoney(payment.amount_due)}</td>
              <td>{formatMoney(payment.amount_paid)}</td>
              <td className="text-danger fw-semibold">
                {formatMoney((payment.amount_due || 0) - (payment.amount_paid || 0))}
              </td>
              <td>
                <span className={`badge text-capitalize ${badgeClass(payment)}`}>
                  {label(payment)}
                </span>
              </td>
              {canRecordPayment && (
                <td>
                  {payment.status !== 'paid' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRecord({
                          ...payment,
                          customer_name: customerName,
                          customer_phone: customerPhone,
                        });
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      {t('recordPayment')}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

const InstallmentPayments = () => {
  const { t } = useTranslation();
  const { formatMoney, currency, settings } = useCurrency();
  const { user, hasPermission, isAdmin, hasRole } = useAuth();
  // Same gate as POST /installment-payments/:id/pay. Accountants can read plans and dues only.
  const canRecordPayment = hasPermission([
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.PLATFORM_MANAGE,
  ]);
  // The summed balance is for the books. Tellers and other staff still see each plan.
  const canSeePaymentTotal = isAdmin || hasRole('ACCOUNTANT');
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [plansTab, setPlansTab] = useState('all');
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [planDetails, setPlanDetails] = useState({});
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [printJob, setPrintJob] = useState(null);
  const [planOrder, setPlanOrder] = useState('');
  const [planCustomer, setPlanCustomer] = useState('');
  const [planPhone, setPlanPhone] = useState('');
  const [planStatus, setPlanStatus] = useState('');
  const [groupOrder, setGroupOrder] = useState('');
  const [groupCustomer, setGroupCustomer] = useState('');
  const [groupPhone, setGroupPhone] = useState('');

  useEffect(() => {
    setExpandedPlanId(null);
    if (activeTab === 'plans') {
      loadPlans();
    } else {
      loadPayments();
    }
  }, [activeTab, plansTab]);

  const groupedPlans = useMemo(() => {
    const map = new Map();
    (payments || []).forEach((payment) => {
      const key = String(payment.installment_plan_id || 'unknown');
      if (!map.has(key)) {
        map.set(key, {
          planId: payment.installment_plan_id,
          customer_name: payment.customer_name,
          customer_phone: payment.customer_phone,
          order_number: payment.order_number,
          sale_id: payment.sale_id,
          payments: [],
        });
      }
      const group = map.get(key);
      group.payments.push(payment);
      if (!group.customer_name && payment.customer_name) group.customer_name = payment.customer_name;
      if (!group.customer_phone && payment.customer_phone) group.customer_phone = payment.customer_phone;
      if (!group.order_number && payment.order_number) group.order_number = payment.order_number;
      if (!group.sale_id && payment.sale_id) group.sale_id = payment.sale_id;
    });
    return Array.from(map.values()).map((group) => ({
      ...group,
      remaining: group.payments.reduce(
        (sum, payment) => sum + ((payment.amount_due || 0) - (payment.amount_paid || 0)),
        0
      ),
    }));
  }, [payments]);

  const planStatusOptions = useMemo(() => {
    const names = [...new Set((plans || []).map((plan) => plan.status).filter(Boolean))];
    return names.sort((a, b) => String(a).localeCompare(String(b)));
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return (plans || []).filter((plan) => {
      if (!matchesOrderQuery(planOrder, plan.order_number, plan.sale_id, plan.id, formatOrderId(plan.order_number, plan.sale_id, plan.id))) {
        return false;
      }
      if (!matchesText(planCustomer, plan.customer_name)) return false;
      if (!matchesPhone(planPhone, plan.customer_phone)) return false;
      if (planStatus && plan.status !== planStatus) return false;
      return true;
    });
  }, [plans, planOrder, planCustomer, planPhone, planStatus]);

  const filteredGroups = useMemo(() => {
    return groupedPlans.filter((group) => {
      if (!matchesOrderQuery(groupOrder, group.order_number, group.sale_id, group.planId, formatOrderId(group.order_number, group.sale_id, group.planId))) {
        return false;
      }
      if (!matchesText(groupCustomer, group.customer_name)) return false;
      if (!matchesPhone(groupPhone, group.customer_phone)) return false;
      return true;
    });
  }, [groupedPlans, groupOrder, groupCustomer, groupPhone]);

  const paymentsTotal = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + (Number(group.remaining) || 0), 0),
    [filteredGroups]
  );

  const filteredPaymentCount = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.payments.length, 0),
    [filteredGroups]
  );

  const plansFiltersActive = Boolean(planOrder || planCustomer || planPhone || planStatus);
  const groupFiltersActive = Boolean(groupOrder || groupCustomer || groupPhone);

  const clearPlanFilters = () => {
    setPlanOrder('');
    setPlanCustomer('');
    setPlanPhone('');
    setPlanStatus('');
  };

  const clearGroupFilters = () => {
    setGroupOrder('');
    setGroupCustomer('');
    setGroupPhone('');
  };

  const {
    page: plansPage,
    setPage: setPlansPage,
    pageItems: pagedPlans,
    total: plansTotal,
    totalPages: plansTotalPages,
    pageSize: plansPageSize,
  } = usePagination(filteredPlans, {
    resetKey: `${activeTab}|${plansTab}|${planOrder}|${planCustomer}|${planPhone}|${planStatus}`,
  });

  const {
    page: groupsPage,
    setPage: setGroupsPage,
    pageItems: pagedGroups,
    total: groupsTotal,
    totalPages: groupsTotalPages,
    pageSize: groupsPageSize,
  } = usePagination(filteredGroups, {
    resetKey: `${activeTab}|${groupOrder}|${groupCustomer}|${groupPhone}`,
  });

  const loadPlans = async () => {
    setLoading(true);
    try {
      let data;
      if (plansTab === 'active') {
        data = await installmentPlanService.getActive();
      } else if (plansTab === 'completed') {
        data = await installmentPlanService.getCompleted();
      } else {
        data = await installmentPlanService.getAll();
      }
      setPlans(data || []);
    } catch (error) {
      setError('Failed to load installment plans');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'pending') {
        data = await installmentPaymentService.getPending();
      } else if (activeTab === 'overdue') {
        data = await installmentPaymentService.getOverdue();
      }
      setPayments(data || []);
    } catch (error) {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDetails = async (planId) => {
    if (!planId) return null;
    setLoadingPlanId(planId);
    try {
      const plan = await installmentPlanService.getById(planId);
      setPlanDetails((prev) => ({ ...prev, [planId]: plan }));
      return plan;
    } catch (error) {
      setError('Failed to load plan installments');
      return null;
    } finally {
      setLoadingPlanId(null);
    }
  };

  const togglePlan = async (planId) => {
    if (expandedPlanId === planId) {
      setExpandedPlanId(null);
      return;
    }
    setExpandedPlanId(planId);
    if (planId && !planDetails[planId]) {
      await loadPlanDetails(planId);
    }
  };

  const printPlanReceipt = async (planId, currentAmount) => {
    if (!planId) return;
    const plan = await loadPlanDetails(planId);
    if (!plan) return;
    setPrintJob(
      createInstallmentReceiptPrintJob({
        settings,
        currency,
        cashierName: user?.full_name || user?.fullName || user?.username || 'CASHIER',
        plan,
        currentAmount,
      })
    );
  };

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setPaymentAmount(payment.amount_due - payment.amount_paid);
    setPaymentNotes('');
    setShowPaymentModal(true);
    setError('');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await installmentPaymentService.recordPayment(
        selectedPayment.id,
        parseFloat(paymentAmount),
        paymentNotes
      );
      setSuccess('Payment recorded successfully');
      setShowPaymentModal(false);
      const planId = selectedPayment?.installment_plan_id || expandedPlanId;
      const amountPaid = parseFloat(paymentAmount);
      if (activeTab === 'plans') {
        await loadPlans();
      } else {
        await loadPayments();
      }
      if (planId) {
        await printPlanReceipt(planId, amountPaid);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to record payment');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'completed':
      case 'paid':
        return 'bg-success';
      case 'defaulted':
      case 'overdue':
        return 'bg-danger';
      case 'pending':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  };

  const isInitialLoading =
    loading &&
    ((activeTab === 'plans' && plans.length === 0) ||
      (activeTab !== 'plans' && groupedPlans.length === 0));

  if (isInitialLoading) {
    return <AdminLoading message={activeTab === 'plans' ? t('loadingPlans') : t('loadingPayments')} />;
  }

  return (
    <div className="container-fluid matte-page admin-page table-page">
      <PageHeader
        title={t('installmentPayments')}
        subtitle={t('installmentPaymentsSubtitle')}
      />

      <AdminAlerts
        success={success}
        error={error}
        onClearSuccess={() => setSuccess('')}
        onClearError={() => setError('')}
      />

      <ul className="nav nav-tabs admin-tabs mb-4">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            {t('installmentPlans')}
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            {t('pendingPayments')}
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            {t('overduePayments')}
          </button>
        </li>
      </ul>

      {activeTab === 'plans' && (
        <>
          <div className="admin-filter-tabs">
            <button
              type="button"
              className={`btn btn-sm ${plansTab === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setPlansTab('all')}
            >
              {t('allPlans')}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${plansTab === 'active' ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setPlansTab('active')}
            >
              {t('Active')}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${plansTab === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setPlansTab('completed')}
            >
              {t('completed')}
            </button>
          </div>

          <div className="card table-panel">
            <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-baseline gap-2">
                <h5 className="admin-section-title mb-0">{t('installmentPlans')}</h5>
                <span className="text-muted small">{filteredPlans.length}</span>
              </div>
            </div>
            <div className="card-body p-0">
              {loading && plans.length === 0 ? (
                <p className="text-muted text-center py-5 mb-0">{t('loadingPlans')}</p>
              ) : plans.length === 0 ? (
                <p className="text-muted text-center py-5 mb-0">{t('noInstallmentPlans')}</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover admin-table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 order-id-toggle" aria-label={t('expand')}></th>
                        <th className="border-0 fw-semibold">{t('orderId')}</th>
                        <th className="border-0 fw-semibold">{t('customer')}</th>
                        <th className="border-0 fw-semibold">{t('phone')}</th>
                        <th className="border-0 fw-semibold">{t('totalAmount')}</th>
                        <th className="border-0 fw-semibold">{t('paidAmount')}</th>
                        <th className="border-0 fw-semibold">{t('remaining')}</th>
                        <th className="border-0 fw-semibold">{t('monthlyPayment')}</th>
                        <th className="border-0 fw-semibold">{t('status')}</th>
                      </tr>
                      <tr className="report-filter-row">
                        <th />
                        <th>
                          <input
                            id="planFilterOrder"
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('orderId')}
                            value={planOrder}
                            onChange={(e) => setPlanOrder(e.target.value)}
                            aria-label={t('orderId')}
                          />
                        </th>
                        <th>
                          <input
                            id="planFilterCustomer"
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('customer')}
                            value={planCustomer}
                            onChange={(e) => setPlanCustomer(e.target.value)}
                            aria-label={t('customer')}
                          />
                        </th>
                        <th>
                          <input
                            id="planFilterPhone"
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('phone')}
                            value={planPhone}
                            onChange={(e) => setPlanPhone(e.target.value)}
                            aria-label={t('phone')}
                          />
                        </th>
                        <th />
                        <th />
                        <th />
                        <th />
                        <th>
                          <div className="report-teller-filter">
                            <select
                              id="planFilterStatus"
                              className="form-select form-select-sm"
                              value={planStatus}
                              onChange={(e) => setPlanStatus(e.target.value)}
                              aria-label={t('status')}
                            >
                              <option value="">{t('allStatuses')}</option>
                              {planStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {t(`status_${status}`, { defaultValue: status })}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={clearPlanFilters}
                              disabled={!plansFiltersActive}
                            >
                              {t('clear')}
                            </button>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPlans.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-muted py-5">
                            {t('tryAdjustFilters')}
                          </td>
                        </tr>
                      ) : pagedPlans.map((plan) => {
                        const isExpanded = expandedPlanId === plan.id;
                        const details = planDetails[plan.id];
                        const installments = details?.payments || [];
                        return (
                          <React.Fragment key={plan.id}>
                            <tr
                              className={`plan-expand-row${isExpanded ? ' is-expanded' : ''}`}
                              onClick={() => togglePlan(plan.id)}
                            >
                              <td className="order-id-toggle">
                                <span className="plan-expand-icon">
                                  <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                                </span>
                              </td>
                              <td className="order-id-cell">
                                <span className="order-id-badge">
                                  {formatOrderId(plan.order_number, plan.sale_id, plan.id)}
                                </span>
                              </td>
                              <td>{plan.customer_name}</td>
                              <td className="text-muted">{plan.customer_phone}</td>
                              <td>{formatMoney(plan.total_with_interest)}</td>
                              <td>{formatMoney(plan.paid_amount)}</td>
                              <td className="text-danger fw-semibold">
                                {formatMoney(plan.total_with_interest - plan.paid_amount)}
                              </td>
                              <td>{formatMoney(plan.monthly_payment)}</td>
                              <td>
                                <span className={`badge text-capitalize ${getStatusBadgeClass(plan.status)}`}>
                                  {t(`status_${plan.status}`, { defaultValue: plan.status })}
                                </span>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="plan-installments-row">
                                <td colSpan={9}>
                                  <div className="plan-installments-wrap">
                                    <div className="d-flex justify-content-end mb-2">
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          printPlanReceipt(plan.id);
                                        }}
                                      >
                                        <i className="bi bi-printer me-1"></i>
                                        {t('printReceipt')}
                                      </button>
                                    </div>
                                    {loadingPlanId === plan.id && !details ? (
                                      <p className="text-muted small mb-0 py-2">{t('loadingInstallments')}</p>
                                    ) : installments.length === 0 ? (
                                      <p className="text-muted small mb-0 py-2">{t('noInstallmentsFound')}</p>
                                    ) : (
                                      <InstallmentsTable
                                        installments={installments}
                                        customerName={plan.customer_name || details?.customer_name}
                                        customerPhone={plan.customer_phone || details?.customer_phone}
                                        canRecordPayment={canRecordPayment}
                                        onRecord={openPaymentModal}
                                        formatMoney={formatMoney}
                                        t={t}
                                      />
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
                page={plansPage}
                totalPages={plansTotalPages}
                total={plansTotal}
                pageSize={plansPageSize}
                onPageChange={setPlansPage}
                label={t('plans')}
              />
            </div>
          </div>
        </>
      )}

      {activeTab !== 'plans' && (
        <div className="card table-panel">
          {canSeePaymentTotal && (
            <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
              <h5 className="admin-section-title mb-0">
                {activeTab === 'overdue' ? t('overduePayments') : t('pendingPayments')}
              </h5>
              <div className="text-end">
                <div className="text-muted small">{t('total')}</div>
                <div className="fw-semibold text-danger">{formatMoney(paymentsTotal)}</div>
              </div>
            </div>
          )}
          <div className="card-body p-0">
            {groupedPlans.length === 0 ? (
              <p className="text-muted text-center py-5 mb-0">
                {t('noTabPaymentsFound', { tab: activeTab === 'overdue' ? t('overdue') : t('pending') })}
                {activeTab === 'overdue' && t('allPaymentsUpToDate')}
              </p>
            ) : (
              <>
                {activeTab === 'overdue' && filteredGroups.length > 0 && (
                  <div className="alert alert-danger m-3 mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {t('overduePaymentsAlert', { count: filteredPaymentCount, plans: filteredGroups.length })}
                  </div>
                )}
                <div className="table-responsive">
                  <table className="table table-hover admin-table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 order-id-toggle" aria-label={t('expand')}></th>
                        <th className="border-0 fw-semibold">{t('orderId')}</th>
                        <th className="border-0 fw-semibold">{t('customer')}</th>
                        <th className="border-0 fw-semibold">{t('phone')}</th>
                        <th className="border-0 fw-semibold">
                          {activeTab === 'overdue' ? t('overdueInstallments') : t('pendingInstallments')}
                        </th>
                        <th className="border-0 fw-semibold">{t('remaining')}</th>
                      </tr>
                      <tr className="report-filter-row">
                        <th />
                        <th>
                          <input
                            id="groupFilterOrder"
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('orderId')}
                            value={groupOrder}
                            onChange={(e) => setGroupOrder(e.target.value)}
                            aria-label={t('orderId')}
                          />
                        </th>
                        <th>
                          <input
                            id="groupFilterCustomer"
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('customer')}
                            value={groupCustomer}
                            onChange={(e) => setGroupCustomer(e.target.value)}
                            aria-label={t('customer')}
                          />
                        </th>
                        <th>
                          <input
                            id="groupFilterPhone"
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('phone')}
                            value={groupPhone}
                            onChange={(e) => setGroupPhone(e.target.value)}
                            aria-label={t('phone')}
                          />
                        </th>
                        <th />
                        <th>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={clearGroupFilters}
                            disabled={!groupFiltersActive}
                          >
                            {t('clear')}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedGroups.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-5">
                            {t('tryAdjustFilters')}
                          </td>
                        </tr>
                      ) : pagedGroups.map((group) => {
                        const isExpanded = expandedPlanId === group.planId;
                        const details = planDetails[group.planId];
                        const installments = details?.payments || group.payments;
                        return (
                          <React.Fragment key={group.planId || 'unknown'}>
                            <tr
                              className={`plan-expand-row${isExpanded ? ' is-expanded' : ''}${
                                activeTab === 'overdue' ? ' table-danger' : ''
                              }`}
                              onClick={() => togglePlan(group.planId)}
                            >
                              <td className="order-id-toggle">
                                <span className="plan-expand-icon">
                                  <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                                </span>
                              </td>
                              <td className="order-id-cell">
                                <span className="order-id-badge">
                                  {formatOrderId(group.order_number, group.sale_id, group.planId)}
                                </span>
                              </td>
                              <td>{group.customer_name || details?.customer_name || '-'}</td>
                              <td className="text-muted">{group.customer_phone || details?.customer_phone || '-'}</td>
                              <td>
                                <span className={`badge ${activeTab === 'overdue' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                  {group.payments.length}
                                </span>
                              </td>
                              <td className="text-danger fw-semibold">{formatMoney(group.remaining)}</td>
                            </tr>
                            {isExpanded && (
                              <tr className="plan-installments-row">
                                <td colSpan={6}>
                                  <div className="plan-installments-wrap">
                                    <div className="d-flex justify-content-end mb-2">
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          printPlanReceipt(group.planId);
                                        }}
                                      >
                                        <i className="bi bi-printer me-1"></i>
                                        {t('printReceipt')}
                                      </button>
                                    </div>
                                    {loadingPlanId === group.planId && !details ? (
                                      <p className="text-muted small mb-0 py-2">{t('loadingInstallments')}</p>
                                    ) : installments.length === 0 ? (
                                      <p className="text-muted small mb-0 py-2">{t('noInstallmentsFound')}</p>
                                    ) : (
                                      <InstallmentsTable
                                        installments={installments}
                                        customerName={group.customer_name || details?.customer_name}
                                        customerPhone={group.customer_phone || details?.customer_phone}
                                        canRecordPayment={canRecordPayment}
                                        onRecord={openPaymentModal}
                                        formatMoney={formatMoney}
                                        t={t}
                                      />
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
              </>
            )}
              <PaginationBar
                page={groupsPage}
                totalPages={groupsTotalPages}
                total={groupsTotal}
                pageSize={groupsPageSize}
                onPageChange={setGroupsPage}
                label={t('plans')}
              />
          </div>
        </div>
      )}

      {showPaymentModal && selectedPayment && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-cash-coin me-2"></i>{t('recordPayment')}</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <form onSubmit={handleRecordPayment}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                    </div>
                  )}
                  <div className="bg-light rounded p-3 mb-3 small">
                    <p className="mb-1"><strong>{t('customer')}:</strong> {selectedPayment.customer_name}</p>
                    <p className="mb-1"><strong>{t('phone')}:</strong> {selectedPayment.customer_phone}</p>
                    <p className="mb-1"><strong>{t('paymentNumber')}:</strong> {selectedPayment.payment_number}</p>
                    <p className="mb-1"><strong>{t('dueDate')}:</strong> {new Date(selectedPayment.due_date).toLocaleDateString()}</p>
                    <p className="mb-1"><strong>{t('amountDue')}:</strong> {formatMoney(selectedPayment.amount_due)}</p>
                    <p className="mb-1"><strong>{t('alreadyPaid')}:</strong> {formatMoney(selectedPayment.amount_paid)}</p>
                    <p className="mb-0 text-danger"><strong>{t('remaining')}:</strong> {formatMoney(selectedPayment.amount_due - selectedPayment.amount_paid)}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">{t('paymentAmount')} *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      step="0.01"
                      min="0.01"
                      max={selectedPayment.amount_due - selectedPayment.amount_paid}
                      required
                    />
                    <div className="form-text">{t('partialPaymentHelp')}</div>
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-semibold">{t('paymentNotes')} ({t('optional')})</label>
                    <textarea
                      className="form-control"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={3}
                      placeholder="Payment method, receipt number, etc."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>{t('confirmPayment')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ReceiptPrintLayer job={printJob} onDone={() => setPrintJob(null)} />
    </div>
  );
};

export default InstallmentPayments;
