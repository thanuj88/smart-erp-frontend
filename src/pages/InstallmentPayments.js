import React, { useState, useEffect } from 'react';
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Installment Payments</h1>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payments
        </button>
        <button
          className={`btn ${activeTab === 'overdue' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue Payments
        </button>
      </div>

      <div className="card">
        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No {activeTab} payments found.
            {activeTab === 'overdue' && ' Great! All payments are up to date.'}
          </p>
        ) : (
          <>
            {activeTab === 'overdue' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                <p className="text-sm text-red-700">
                  ⚠️ {payments.length} overdue payment(s) require immediate attention!
                </p>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={isOverdue(payment.due_date, payment.status) ? 'bg-red-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{payment.payment_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.customer_phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {new Date(payment.due_date).toLocaleDateString()}
                          {isOverdue(payment.due_date, payment.status) && (
                            <span className="text-red-600 text-xs font-medium">
                              (Overdue)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${payment.amount_due.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${payment.amount_paid.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        ${(payment.amount_due - payment.amount_paid).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium capitalize">
                        <span className={getStatusColor(
                          isOverdue(payment.due_date, payment.status) ? 'overdue' : payment.status
                        )}>
                          {isOverdue(payment.due_date, payment.status) ? 'Overdue' : payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
          </>
        )}
      </div>

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

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Payment Details
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong className="text-gray-900">Customer:</strong> {selectedPayment?.customer_name}</p>
                  <p><strong className="text-gray-900">Phone:</strong> {selectedPayment?.customer_phone}</p>
                  <p><strong className="text-gray-900">Payment #:</strong> {selectedPayment?.payment_number}</p>
                  <p><strong className="text-gray-900">Due Date:</strong> {new Date(selectedPayment?.due_date).toLocaleDateString()}</p>
                  <p><strong className="text-gray-900">Amount Due:</strong> ${selectedPayment?.amount_due.toFixed(2)}</p>
                  <p><strong className="text-gray-900">Already Paid:</strong> ${selectedPayment?.amount_paid.toFixed(2)}</p>
                  <p className="font-medium text-red-600"><strong>Remaining:</strong> ${(selectedPayment?.amount_due - selectedPayment?.amount_paid).toFixed(2)}</p>
                </div>
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
                  <p className="text-xs text-gray-500 mt-1">
                    You can enter a partial payment amount
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Notes (Optional)
                  </label>
                  <textarea
                    className="input"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows="3"
                    placeholder="Add any notes about this payment (e.g., payment method, receipt number, etc.)..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    Confirm Payment
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
    </div>
  );
};

export default InstallmentPayments;
