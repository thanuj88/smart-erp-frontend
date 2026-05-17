import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import { installmentPlanService, installmentPaymentService, installmentSettingsService } from '../services';
import { useAuth } from '../contexts/AuthContext';


const InstallmentPlans = () => {
  const { isAdmin } = useAuth();
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
    if (!window.confirm(`Are you sure you want to delete settings for ${months} months?`)) {
      return;
    }

    try {
      await installmentSettingsService.delete(months);
      setSuccess(`Settings for ${months} months deleted successfully`);
      await loadSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete settings');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'defaulted':
        return 'text-red-600';
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'overdue':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && !selectedPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page">
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

            {/* Plans Tab Content */}
      {mainTab === 'plans' && (
        <>
          {/* Sub-tabs for Plans */}
          <ul className="nav nav-pills mb-3">
            <li className="nav-item"><button type="button" className={`nav-link ${plansTab === 'all' ? 'active' : ''}`} onClick={() => setPlansTab('all')}>All Plans</button></li>
            <li className="nav-item"><button type="button" className={`nav-link ${plansTab === 'active' ? 'active' : ''}`} onClick={() => setPlansTab('active')}>Active</button></li>
            <li className="nav-item"><button type="button" className={`nav-link ${plansTab === 'completed' ? 'active' : ''}`} onClick={() => setPlansTab('completed')}>Completed</button></li>
          </ul>

          <div className="card">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Installment Plans</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {plansTab === 'active' ? 'Active installment plans' : plansTab === 'completed' ? 'Completed installment plans' : 'All installment plans'}
                </p>
              </div>
              <div className="bg-cyan-500 text-white rounded-full px-4 py-1 text-sm font-semibold">
                {plans.length} total
              </div>
            </div>

            {/* Table */}
            {plans.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No installment plans found.</p>
            ) : (
              <div className="table-responsive"><table className="table table-hover admin-table mb-0"><thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold">
                        Plan #
                      </th>
                      <th className="border-0 fw-semibold">
                        Customer
                      </th>
                      <th className="border-0 fw-semibold">
                        Phone
                      </th>
                      <th className="border-0 fw-semibold">
                        Total Amount
                      </th>
                      <th className="border-0 fw-semibold">
                        Paid Amount
                      </th>
                      <th className="border-0 fw-semibold">
                        Remaining
                      </th>
                      <th className="border-0 fw-semibold">
                        Monthly Payment
                      </th>
                      <th className="border-0 fw-semibold">
                        Status
                      </th>
                      <th className="border-0 fw-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{plan.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {plan.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {plan.customer_phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${plan.total_with_interest.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${plan.paid_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          ${(plan.total_with_interest - plan.paid_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${plan.monthly_payment.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium capitalize">
                          <span className={getStatusColor(plan.status)}>
                            {plan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => loadPlanDetails(plan.id)}
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="bi bi-eye me-1"></i>View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Settings Tab Content */}
      {mainTab === 'settings' && isAdmin && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Interest Rate Configuration</h3>
                <p className="text-gray-600 text-sm">
                  Configure interest rates for different installment periods. These rates will be available when creating new installment sales.
                </p>
              </div>
              <button onClick={openAddSettingModal} className="btn btn-primary">
                Add New Setting
              </button>
            </div>

            {settings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No installment settings found. Click "Add New Setting" to create one.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-0 fw-semibold">
                        Months
                      </th>
                      <th className="border-0 fw-semibold">
                        Interest Rate
                      </th>
                      <th className="border-0 fw-semibold">
                        Example: $1000 Item
                      </th>
                      <th className="border-0 fw-semibold">
                        Last Updated
                      </th>
                      <th className="border-0 fw-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {settings.map((setting) => {
                      const exampleAmount = 1000;
                      const interestAmount = (exampleAmount * setting.interest_rate) / 100;
                      const totalWithInterest = exampleAmount + interestAmount;
                      const monthlyPayment = totalWithInterest / setting.months;

                      return (
                        <tr key={setting.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {setting.months} months
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {setting.interest_rate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <div>Total: ${totalWithInterest.toFixed(2)}</div>
                              <div>Monthly: ${monthlyPayment.toFixed(2)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(setting.updated_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditSettingModal(setting)}
                                className="btn btn-primary btn-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSetting(setting.months)}
                                className="btn btn-danger btn-sm"
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
        </>
      )}

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Plan Details - #{selectedPlan.id}</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setSelectedPlan(null)}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
                  <div><strong className="text-gray-900">Name:</strong> {selectedPlan.customer_name}</div>
                  <div><strong className="text-gray-900">Phone:</strong> {selectedPlan.customer_phone}</div>
                  <div><strong className="text-gray-900">ID Card:</strong> {selectedPlan.customer_id_card}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Witness Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                  <div><strong className="text-gray-900">Name:</strong> {selectedPlan.witness_name}</div>
                  <div><strong className="text-gray-900">Phone:</strong> {selectedPlan.witness_phone}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-600">
                  <div><strong className="text-gray-900">Total Amount:</strong> ${selectedPlan.total_amount.toFixed(2)}</div>
                  <div><strong className="text-gray-900">Down Payment:</strong> ${selectedPlan.down_payment.toFixed(2)}</div>
                  <div><strong className="text-gray-900">Interest Rate:</strong> {selectedPlan.interest_rate}%</div>
                  <div><strong className="text-gray-900">Interest Amount:</strong> ${selectedPlan.interest_amount.toFixed(2)}</div>
                  <div><strong className="text-gray-900">Total with Interest:</strong> ${selectedPlan.total_with_interest.toFixed(2)}</div>
                  <div><strong className="text-gray-900">Monthly Payment:</strong> ${selectedPlan.monthly_payment.toFixed(2)}</div>
                  <div><strong className="text-gray-900">Paid Amount:</strong> ${selectedPlan.paid_amount.toFixed(2)}</div>
                  <div><strong className="text-gray-900">Remaining:</strong> ${(selectedPlan.total_with_interest - selectedPlan.paid_amount).toFixed(2)}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment #
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Due
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Paid
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPlan.payments?.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {payment.payment_number}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            ${payment.amount_due.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            ${payment.amount_paid.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium capitalize">
                            <span className={getStatusColor(payment.status)}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                            {payment.status !== 'paid' && (
                              <button
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

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="btn btn-ghost"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm text-gray-600 space-y-1">
                <p><strong className="text-gray-900">Payment #:</strong> {selectedPayment?.payment_number}</p>
                <p><strong className="text-gray-900">Due Date:</strong> {new Date(selectedPayment?.due_date).toLocaleDateString()}</p>
                <p><strong className="text-gray-900">Amount Due:</strong> ${selectedPayment?.amount_due.toFixed(2)}</p>
                <p><strong className="text-gray-900">Already Paid:</strong> ${selectedPayment?.amount_paid.toFixed(2)}</p>
                <p><strong className="text-gray-900">Remaining:</strong> ${(selectedPayment?.amount_due - selectedPayment?.amount_paid).toFixed(2)}</p>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    step="0.01"
                    min="0.01"
                    max={selectedPayment?.amount_due - selectedPayment?.amount_paid}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="input"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows="3"
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Add/Edit Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSetting ? 'Edit Installment Setting' : 'Add New Installment Setting'}
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowSettingsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSaveSetting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Months *
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={settingMonths}
                    onChange={(e) => setSettingMonths(e.target.value)}
                    min="1"
                    required
                    disabled={!!editingSetting}
                    placeholder="e.g., 3, 6, 12, 18, 24..."
                  />
                  {editingSetting && (
                    <p className="text-xs text-gray-500 mt-1">
                      Months cannot be changed. Delete and create a new setting if needed.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={settingInterestRate}
                    onChange={(e) => setSettingInterestRate(e.target.value)}
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g., 5.5, 10, 15.75..."
                  />
                </div>

                {/* Preview Calculation */}
                {settingMonths && settingInterestRate && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Preview: $1000 item over {settingMonths} months
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Interest: ${((1000 * parseFloat(settingInterestRate || 0)) / 100).toFixed(2)}</p>
                      <p>Total Amount: ${(1000 + (1000 * parseFloat(settingInterestRate || 0)) / 100).toFixed(2)}</p>
                      <p className="font-medium">Monthly Payment: ${((1000 + (1000 * parseFloat(settingInterestRate || 0)) / 100) / parseInt(settingMonths || 1)).toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingSetting ? 'Update Setting' : 'Add Setting'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
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
