import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import ReceiptPrintLayer from '../components/ReceiptPrintLayer';
import { installmentPaymentService, installmentPlanService } from '../services';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { createInstallmentReceiptPrintJob } from '../utils/receipt';
import { formatOrderId } from '../utils/orderId';

const InstallmentPayments = () => {
  const { formatMoney, currency, settings } = useCurrency();
  const { user } = useAuth();
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

  const isOverdue = (dueDate, status) => {
    if (status === 'paid') return false;
    return new Date(dueDate) < new Date();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-primary';
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

  const getPaymentBadge = (payment) => {
    if (isOverdue(payment.due_date, payment.status)) return 'bg-danger';
    if (payment.status === 'paid') return 'bg-success';
    return 'bg-warning text-dark';
  };

  const getPaymentLabel = (payment) => {
    if (isOverdue(payment.due_date, payment.status)) return 'Overdue';
    return payment.status;
  };

  const renderInstallmentsTable = (installments, customerName, customerPhone) => (
    <table className="table table-sm table-hover mb-0">
      <thead className="table-light">
        <tr>
          <th>Payment #</th>
          <th>Due Date</th>
          <th>Amount Due</th>
          <th>Amount Paid</th>
          <th>Remaining</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {installments.map((payment) => (
          <tr
            key={payment.id}
            className={isOverdue(payment.due_date, payment.status) ? 'table-danger' : ''}
          >
            <td className="fw-semibold">#{payment.payment_number}</td>
            <td>
              {new Date(payment.due_date).toLocaleDateString()}
              {isOverdue(payment.due_date, payment.status) && (
                <span className="badge bg-danger ms-2">Overdue</span>
              )}
            </td>
            <td>{formatMoney(payment.amount_due)}</td>
            <td>{formatMoney(payment.amount_paid)}</td>
            <td className="text-danger fw-semibold">
              {formatMoney((payment.amount_due || 0) - (payment.amount_paid || 0))}
            </td>
            <td>
              <span className={`badge text-capitalize ${getPaymentBadge(payment)}`}>
                {getPaymentLabel(payment)}
              </span>
            </td>
            <td>
              {payment.status !== 'paid' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPaymentModal({
                      ...payment,
                      customer_name: customerName,
                      customer_phone: customerPhone,
                    });
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Record Payment
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const isInitialLoading =
    loading &&
    ((activeTab === 'plans' && plans.length === 0) ||
      (activeTab !== 'plans' && groupedPlans.length === 0));

  if (isInitialLoading) {
    return <AdminLoading message={activeTab === 'plans' ? 'Loading plans...' : 'Loading payments...'} />;
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page">
      <PageHeader
        title="Installment Payments"
        subtitle="View installment plans and record pending or overdue payments."
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
            Installment Plans
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Payments
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Overdue Payments
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
              All Plans
            </button>
            <button
              type="button"
              className={`btn btn-sm ${plansTab === 'active' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setPlansTab('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={`btn btn-sm ${plansTab === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setPlansTab('completed')}
            >
              Completed
            </button>
          </div>

          <div className="card">
            <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <h5 className="admin-section-title mb-1">Installment Plans</h5>
                <p className="admin-section-subtitle">
                  {plansTab === 'active'
                    ? 'Active installment plans'
                    : plansTab === 'completed'
                      ? 'Completed installment plans'
                      : 'All installment plans'}
                </p>
              </div>
              <span className="badge rounded-pill text-bg-primary">{plans.length} total</span>
            </div>
            <div className="card-body p-0">
              {loading && plans.length === 0 ? (
                <p className="text-muted text-center py-5 mb-0">Loading plans...</p>
              ) : plans.length === 0 ? (
                <p className="text-muted text-center py-5 mb-0">No installment plans found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover admin-table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 order-id-toggle" aria-label="Expand"></th>
                        <th className="border-0 fw-semibold">Order ID</th>
                        <th className="border-0 fw-semibold">Customer</th>
                        <th className="border-0 fw-semibold">Phone</th>
                        <th className="border-0 fw-semibold">Total Amount</th>
                        <th className="border-0 fw-semibold">Paid Amount</th>
                        <th className="border-0 fw-semibold">Remaining</th>
                        <th className="border-0 fw-semibold">Monthly Payment</th>
                        <th className="border-0 fw-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => {
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
                                  {plan.status}
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
                                        Print receipt
                                      </button>
                                    </div>
                                    {loadingPlanId === plan.id && !details ? (
                                      <p className="text-muted small mb-0 py-2">Loading installments...</p>
                                    ) : installments.length === 0 ? (
                                      <p className="text-muted small mb-0 py-2">No installments found for this plan.</p>
                                    ) : (
                                      renderInstallmentsTable(
                                        installments,
                                        plan.customer_name || details?.customer_name,
                                        plan.customer_phone || details?.customer_phone
                                      )
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
            </div>
          </div>
        </>
      )}

      {activeTab !== 'plans' && (
        <div className="card">
          <div className="card-body p-0">
            {groupedPlans.length === 0 ? (
              <p className="text-muted text-center py-5 mb-0">
                No {activeTab} payments found.
                {activeTab === 'overdue' && ' Great! All payments are up to date.'}
              </p>
            ) : (
              <>
                {activeTab === 'overdue' && (
                  <div className="alert alert-danger m-3 mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {payments.length} overdue payment(s) across {groupedPlans.length} plan(s) require immediate attention!
                  </div>
                )}
                <div className="table-responsive">
                  <table className="table table-hover admin-table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 order-id-toggle" aria-label="Expand"></th>
                        <th className="border-0 fw-semibold">Order ID</th>
                        <th className="border-0 fw-semibold">Customer</th>
                        <th className="border-0 fw-semibold">Phone</th>
                        <th className="border-0 fw-semibold">
                          {activeTab === 'overdue' ? 'Overdue' : 'Pending'} Installments
                        </th>
                        <th className="border-0 fw-semibold">Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPlans.map((group) => {
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
                              <td>{group.customer_name || details?.customer_name || '—'}</td>
                              <td className="text-muted">{group.customer_phone || details?.customer_phone || '—'}</td>
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
                                        Print receipt
                                      </button>
                                    </div>
                                    {loadingPlanId === group.planId && !details ? (
                                      <p className="text-muted small mb-0 py-2">Loading installments...</p>
                                    ) : installments.length === 0 ? (
                                      <p className="text-muted small mb-0 py-2">No installments found for this plan.</p>
                                    ) : (
                                      renderInstallmentsTable(
                                        installments,
                                        group.customer_name || details?.customer_name,
                                        group.customer_phone || details?.customer_phone
                                      )
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
          </div>
        </div>
      )}

      {showPaymentModal && selectedPayment && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-cash-coin me-2"></i>Record Payment</h5>
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
                    <p className="mb-1"><strong>Customer:</strong> {selectedPayment.customer_name}</p>
                    <p className="mb-1"><strong>Phone:</strong> {selectedPayment.customer_phone}</p>
                    <p className="mb-1"><strong>Payment #:</strong> {selectedPayment.payment_number}</p>
                    <p className="mb-1"><strong>Due Date:</strong> {new Date(selectedPayment.due_date).toLocaleDateString()}</p>
                    <p className="mb-1"><strong>Amount Due:</strong> {formatMoney(selectedPayment.amount_due)}</p>
                    <p className="mb-1"><strong>Already Paid:</strong> {formatMoney(selectedPayment.amount_paid)}</p>
                    <p className="mb-0 text-danger"><strong>Remaining:</strong> {formatMoney(selectedPayment.amount_due - selectedPayment.amount_paid)}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Amount *</label>
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
                    <div className="form-text">You can enter a partial payment amount</div>
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-semibold">Payment Notes (Optional)</label>
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
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>Confirm Payment
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
