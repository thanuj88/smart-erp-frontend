import React, { useState, useEffect } from 'react';
import { installmentPlanService, installmentPaymentService } from '../services';
import Navbar from '../components/Navbar';

const InstallmentPlans = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPlans();
  }, [activeTab]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'active') {
        data = await installmentPlanService.getActive();
      } else if (activeTab === 'completed') {
        data = await installmentPlanService.getCompleted();
      } else {
        data = await installmentPlanService.getAll();
      }
      setPlans(data);
    } catch (error) {
      setError('Failed to load installment plans');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#3498db';
      case 'completed':
        return '#27ae60';
      case 'defaulted':
        return '#e74c3c';
      case 'paid':
        return '#27ae60';
      case 'pending':
        return '#f39c12';
      case 'overdue':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  if (loading && !selectedPlan) {
    return (
      <>
        <Navbar />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading plans...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 className="card-title mb-3">Installment Plans</h1>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Tabs */}
        <div className="tabs mb-3">
          <button
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('all')}
          >
            All Plans
          </button>
          <button
            className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('active')}
            style={{ marginLeft: '0.5rem' }}
          >
            Active
          </button>
          <button
            className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('completed')}
            style={{ marginLeft: '0.5rem' }}
          >
            Completed
          </button>
        </div>

        <div className="card">
          {plans.length === 0 ? (
            <p style={{ color: '#7f8c8d' }}>No installment plans found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Plan #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Remaining</th>
                  <th>Monthly Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>#{plan.id}</td>
                    <td>{plan.customer_name}</td>
                    <td>{plan.customer_phone}</td>
                    <td>${plan.total_with_interest.toFixed(2)}</td>
                    <td>${plan.paid_amount.toFixed(2)}</td>
                    <td style={{ color: '#e74c3c' }}>
                      ${(plan.total_with_interest - plan.paid_amount).toFixed(2)}
                    </td>
                    <td>${plan.monthly_payment.toFixed(2)}</td>
                    <td>
                      <span
                        style={{
                          color: getStatusColor(plan.status),
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                        }}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => loadPlanDetails(plan.id)}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Plan Details Modal */}
        {selectedPlan && (
          <div className="modal-overlay" onClick={() => setSelectedPlan(null)}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '800px' }}
            >
              <div className="modal-header">
                <h2 className="modal-title">Plan Details - #{selectedPlan.id}</h2>
                <button className="modal-close" onClick={() => setSelectedPlan(null)}>
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Customer Information</h3>
                <div className="info-grid">
                  <div><strong>Name:</strong> {selectedPlan.customer_name}</div>
                  <div><strong>Phone:</strong> {selectedPlan.customer_phone}</div>
                  <div><strong>ID Card:</strong> {selectedPlan.customer_id_card}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Witness Information</h3>
                <div className="info-grid">
                  <div><strong>Name:</strong> {selectedPlan.witness_name}</div>
                  <div><strong>Phone:</strong> {selectedPlan.witness_phone}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Payment Summary</h3>
                <div className="info-grid">
                  <div><strong>Total Amount:</strong> ${selectedPlan.total_amount.toFixed(2)}</div>
                  <div><strong>Down Payment:</strong> ${selectedPlan.down_payment.toFixed(2)}</div>
                  <div><strong>Interest Rate:</strong> {selectedPlan.interest_rate}%</div>
                  <div><strong>Interest Amount:</strong> ${selectedPlan.interest_amount.toFixed(2)}</div>
                  <div><strong>Total with Interest:</strong> ${selectedPlan.total_with_interest.toFixed(2)}</div>
                  <div><strong>Monthly Payment:</strong> ${selectedPlan.monthly_payment.toFixed(2)}</div>
                  <div><strong>Paid Amount:</strong> ${selectedPlan.paid_amount.toFixed(2)}</div>
                  <div><strong>Remaining:</strong> ${(selectedPlan.total_with_interest - selectedPlan.paid_amount).toFixed(2)}</div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Payment Schedule</h3>
                <table className="table" style={{ fontSize: '0.9rem' }}>
                  <thead>
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
                        <td>${payment.amount_due.toFixed(2)}</td>
                        <td>${payment.amount_paid.toFixed(2)}</td>
                        <td>
                          <span style={{ color: getStatusColor(payment.status), fontWeight: 'bold' }}>
                            {payment.status}
                          </span>
                        </td>
                        <td>
                          {payment.status !== 'paid' && (
                            <button
                              onClick={() => openPaymentModal(payment)}
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
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

              <button
                onClick={() => setSelectedPlan(null)}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Record Payment</h2>
                <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                  ×
                </button>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div style={{ marginBottom: '1rem', color: '#7f8c8d' }}>
                <p><strong>Payment #:</strong> {selectedPayment?.payment_number}</p>
                <p><strong>Due Date:</strong> {new Date(selectedPayment?.due_date).toLocaleDateString()}</p>
                <p><strong>Amount Due:</strong> ${selectedPayment?.amount_due.toFixed(2)}</p>
                <p><strong>Already Paid:</strong> ${selectedPayment?.amount_paid.toFixed(2)}</p>
                <p><strong>Remaining:</strong> ${(selectedPayment?.amount_due - selectedPayment?.amount_paid).toFixed(2)}</p>
              </div>

              <form onSubmit={handleRecordPayment}>
                <div className="form-group">
                  <label className="form-label">Payment Amount *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    step="0.01"
                    min="0.01"
                    max={selectedPayment?.amount_due - selectedPayment?.amount_paid}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-input"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows="3"
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                <div className="flex flex-gap">
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tabs {
          display: flex;
          gap: 0.5rem;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.8rem;
          color: #7f8c8d;
        }
      `}</style>
    </>
  );
};

export default InstallmentPlans;
