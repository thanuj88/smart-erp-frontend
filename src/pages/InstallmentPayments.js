import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import { installmentPaymentService } from '../services';

const InstallmentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPayments();
  }, [activeTab]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'pending') {
        data = await installmentPaymentService.getPending();
      } else if (activeTab === 'overdue') {
        data = await installmentPaymentService.getOverdue();
      }
      setPayments(data);
    } catch (error) {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
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
      await loadPayments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to record payment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const isOverdue = (dueDate, status) => {
    if (status === 'paid') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <AdminLoading message="Loading payments..." />;
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page">
      <PageHeader
        title="Installment Payments"
        subtitle="Record and track pending and overdue installment payments."
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

      <div className="card">
        <div className="card-body p-0">
          {payments.length === 0 ? (
            <p className="text-muted text-center py-5 mb-0">
              No {activeTab} payments found.
              {activeTab === 'overdue' && ' Great! All payments are up to date.'}
            </p>
          ) : (
            <>
              {activeTab === 'overdue' && (
                <div className="alert alert-danger m-3 mb-0">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {payments.length} overdue payment(s) require immediate attention!
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-hover admin-table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold">Payment #</th>
                      <th className="border-0 fw-semibold">Customer</th>
                      <th className="border-0 fw-semibold">Phone</th>
                      <th className="border-0 fw-semibold">Due Date</th>
                      <th className="border-0 fw-semibold">Amount Due</th>
                      <th className="border-0 fw-semibold">Amount Paid</th>
                      <th className="border-0 fw-semibold">Remaining</th>
                      <th className="border-0 fw-semibold">Status</th>
                      <th className="border-0 fw-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className={isOverdue(payment.due_date, payment.status) ? 'table-danger' : ''}
                      >
                        <td className="fw-semibold">#{payment.payment_number}</td>
                        <td>{payment.customer_name}</td>
                        <td className="text-muted">{payment.customer_phone}</td>
                        <td>
                          {new Date(payment.due_date).toLocaleDateString()}
                          {isOverdue(payment.due_date, payment.status) && (
                            <span className="badge bg-danger ms-2">Overdue</span>
                          )}
                        </td>
                        <td>${payment.amount_due.toFixed(2)}</td>
                        <td>${payment.amount_paid.toFixed(2)}</td>
                        <td className="text-danger fw-semibold">${(payment.amount_due - payment.amount_paid).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${isOverdue(payment.due_date, payment.status) ? 'bg-danger' : payment.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {isOverdue(payment.due_date, payment.status) ? 'Overdue' : payment.status}
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
            </>
          )}
        </div>
      </div>

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
                    <p className="mb-1"><strong>Amount Due:</strong> ${selectedPayment.amount_due.toFixed(2)}</p>
                    <p className="mb-1"><strong>Already Paid:</strong> ${selectedPayment.amount_paid.toFixed(2)}</p>
                    <p className="mb-0 text-danger"><strong>Remaining:</strong> ${(selectedPayment.amount_due - selectedPayment.amount_paid).toFixed(2)}</p>
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
    </div>
  );
};

export default InstallmentPayments;
