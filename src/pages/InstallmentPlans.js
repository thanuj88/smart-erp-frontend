import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import { installmentPlanService, installmentPaymentService, installmentSettingsService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { useConfirm } from '../contexts/ConfirmContext';

const InstallmentPlans = () => {
  const { isAdmin } = useAuth();
  const { formatMoney } = useCurrency();
  const { confirm } = useConfirm();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mainTab, setMainTab] = useState('plans'); // 'plans' or 'settings'
  const [plansTab, setPlansTab] = useState('all'); // 'all', 'active', 'completed'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Settings state
  const [settings, setSettings] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [settingMonths, setSettingMonths] = useState('');
  const [settingInterestRate, setSettingInterestRate] = useState('');

  // Load data when component mounts
  useEffect(() => {
    loadPlans();
  }, []);

  // Load data when tabs change
  useEffect(() => {
    if (mainTab === 'plans') {
      loadPlans();
    } else if (mainTab === 'settings') {
      loadSettings();
    }
  }, [mainTab, plansTab]);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (plansTab === 'active') {
        data = await installmentPlanService.getActive();
      } else if (plansTab === 'completed') {
        data = await installmentPlanService.getCompleted();
      } else {
        data = await installmentPlanService.getAll();
      }
      console.log('Loaded plans:', data);
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading installment plans:', error);
      setError('Failed to load installment plans: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

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

  const loadPlanDetails = async (planId) => {
    try {
      const plan = await installmentPlanService.getById(planId);
      setSelectedPlan(plan);
    } catch (error) {
      setError('Failed to load plan details');
    }
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
      if (selectedPlan) {
        await loadPlanDetails(selectedPlan.id);
      }
      await loadPlans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to record payment');
    }
  };

  // Settings CRUD operations
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
      const months = parseInt(settingMonths);
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
        interest_rate: interestRate
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

  if (loading && !selectedPlan && plans.length === 0 && settings.length === 0) {
    return <AdminLoading message="Loading installment data..." />;
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page installment-page">
      <PageHeader
        title="Installment Management"
        subtitle="Manage installment plans, payments, and interest rate settings."
      />

      <AdminAlerts
        success={success}
        error={error}
        onClearSuccess={() => setSuccess('')}
        onClearError={() => setError('')}
      />

      <ul className="nav nav-tabs admin-tabs mb-4">
        <li className="nav-item">
          <button type="button" className={`nav-link ${mainTab === 'plans' ? 'active' : ''}`} onClick={() => setMainTab('plans')}>
            Installment Plans
          </button>
        </li>
        {isAdmin && (
          <li className="nav-item">
            <button type="button" className={`nav-link ${mainTab === 'settings' ? 'active' : ''}`} onClick={() => setMainTab('settings')}>
              Interest Rate Settings
            </button>
          </li>
        )}
      </ul>

      {mainTab === 'plans' && (
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
              {loading ? (
                <p className="text-muted text-center py-5 mb-0">Loading plans...</p>
              ) : plans.length === 0 ? (
                <p className="text-muted text-center py-5 mb-0">No installment plans found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover admin-table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold">Plan #</th>
                        <th className="border-0 fw-semibold">Customer</th>
                        <th className="border-0 fw-semibold">Phone</th>
                        <th className="border-0 fw-semibold">Total Amount</th>
                        <th className="border-0 fw-semibold">Paid Amount</th>
                        <th className="border-0 fw-semibold">Remaining</th>
                        <th className="border-0 fw-semibold">Monthly Payment</th>
                        <th className="border-0 fw-semibold">Status</th>
                        <th className="border-0 fw-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr key={plan.id}>
                          <td className="fw-semibold">#{plan.id}</td>
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
                          <td>
                            <button
                              type="button"
                              onClick={() => loadPlanDetails(plan.id)}
                              className="btn btn-outline-primary btn-sm"
                            >
                              <i className="bi bi-eye me-1"></i>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {mainTab === 'settings' && isAdmin && (
        <div className="card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="admin-section-title mb-1">Interest Rate Configuration</h5>
              <p className="admin-section-subtitle">
                Configure interest rates for different installment periods. These rates will be available when creating new installment sales.
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

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Plan Details — #{selectedPlan.id}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedPlan(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <h6 className="fw-semibold mb-3">Customer Information</h6>
                <div className="row g-3 mb-4 small">
                  <div className="col-md-4">
                    <span className="text-muted d-block">Name</span>
                    <span className="fw-semibold">{selectedPlan.customer_name}</span>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted d-block">Phone</span>
                    <span className="fw-semibold">{selectedPlan.customer_phone}</span>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted d-block">ID Card</span>
                    <span className="fw-semibold">{selectedPlan.customer_id_card}</span>
                  </div>
                </div>

                <h6 className="fw-semibold mb-3">Witness Information</h6>
                <div className="row g-3 mb-4 small">
                  <div className="col-md-6">
                    <span className="text-muted d-block">Name</span>
                    <span className="fw-semibold">{selectedPlan.witness_name}</span>
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted d-block">Phone</span>
                    <span className="fw-semibold">{selectedPlan.witness_phone}</span>
                  </div>
                </div>

                <h6 className="fw-semibold mb-3">Payment Summary</h6>
                <div className="row g-3 mb-4 small">
                  <div className="col-sm-6 col-lg-3">
                    <span className="text-muted d-block">Total Amount</span>
                    <span className="fw-semibold">{formatMoney(selectedPlan.total_amount)}</span>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <span className="text-muted d-block">Down Payment</span>
                    <span className="fw-semibold">{formatMoney(selectedPlan.down_payment)}</span>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <span className="text-muted d-block">Interest Rate</span>
                    <span className="fw-semibold">{selectedPlan.interest_rate}%</span>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <span className="text-muted d-block">Interest Amount</span>
                    <span className="fw-semibold">{formatMoney(selectedPlan.interest_amount)}</span>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <span className="text-muted d-block">Total with Interest</span>
                    <span className="fw-semibold">{formatMoney(selectedPlan.total_with_interest)}</span>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <span className="text-muted d-block">Monthly Payment</span>
                    <span className="fw-semibold">{formatMoney(selectedPlan.monthly_payment)}</span>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <span className="text-muted d-block">Paid Amount</span>
                    <span className="fw-semibold">{formatMoney(selectedPlan.paid_amount)}</span>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <span className="text-muted d-block">Remaining</span>
                    <span className="fw-semibold text-danger">
                      {formatMoney(selectedPlan.total_with_interest - selectedPlan.paid_amount)}
                    </span>
                  </div>
                </div>

                <h6 className="fw-semibold mb-3">Payment Schedule</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover admin-table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Payment #</th>
                        <th>Due Date</th>
                        <th>Amount Due</th>
                        <th>Amount Paid</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPlan.payments?.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.payment_number}</td>
                          <td>{new Date(payment.due_date).toLocaleDateString()}</td>
                          <td>{formatMoney(payment.amount_due)}</td>
                          <td>{formatMoney(payment.amount_paid)}</td>
                          <td>
                            <span className={`badge text-capitalize ${getStatusBadgeClass(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td>
                            {payment.status !== 'paid' && (
                              <button
                                type="button"
                                onClick={() => openPaymentModal(payment)}
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
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedPlan(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-cash-coin me-2"></i>
                  Record Payment
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)} aria-label="Close" />
              </div>
              <form onSubmit={handleRecordPayment}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}

                  <div className="bg-light rounded p-3 mb-3 small">
                    <p className="mb-1">
                      <strong>Payment #:</strong> {selectedPayment?.payment_number}
                    </p>
                    <p className="mb-1">
                      <strong>Due Date:</strong> {new Date(selectedPayment?.due_date).toLocaleDateString()}
                    </p>
                    <p className="mb-1">
                      <strong>Amount Due:</strong> {formatMoney(selectedPayment?.amount_due)}
                    </p>
                    <p className="mb-1">
                      <strong>Already Paid:</strong> {formatMoney(selectedPayment?.amount_paid)}
                    </p>
                    <p className="mb-0 text-danger">
                      <strong>Remaining:</strong>{' '}
                      {formatMoney((selectedPayment?.amount_due || 0) - (selectedPayment?.amount_paid || 0))}
                    </p>
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
                      max={selectedPayment?.amount_due - selectedPayment?.amount_paid}
                      required
                    />
                  </div>

                  <div className="mb-0">
                    <label className="form-label fw-semibold">Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={3}
                      placeholder="Add any notes about this payment..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Add/Edit Modal */}
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
