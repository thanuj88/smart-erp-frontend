import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  itemService,
  categoryService,
  saleService,
  installmentSettingsService,
  installmentPaymentService,
  installmentPlanService,
} from '../services';
import CategoryIcon from '../components/CategoryIcon';
import ProductThumbnail from '../components/ProductThumbnail';
import { resolveCategoryIconKey } from '../config/categoryIcons';
import './SellItems.css';

const HOLD_KEY = 'pos-held-order';

/** Fallback when tenant has no installment settings configured yet */
const DEFAULT_INSTALLMENT_PERIODS = [
  { months: 3, interest_rate: 0 },
  { months: 6, interest_rate: 0 },
  { months: 12, interest_rate: 0 },
];

const getItemCategoryIcon = (item, categories) =>
  resolveCategoryIconKey(item.category_icon, categories, item.category_id);

function SellItems() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [mode, setMode] = useState('cash');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bill, setBill] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [orderRef, setOrderRef] = useState(() => `#ORD${Date.now().toString().slice(-6)}`);
  const [walkInCustomer, setWalkInCustomer] = useState('Walk in Customer');

  const [interestRates, setInterestRates] = useState({});
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    idCardNo: '',
    email: '',
    address: '',
    idImage: null,
  });
  const [witness, setWitness] = useState({
    name: '',
    phone: '',
    idCardNo: '',
    address: '',
    idImage: null,
  });
  const [downPayment, setDownPayment] = useState('');
  const [installmentMonths, setInstallmentMonths] = useState('3');

  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);

  const newOrderRef = () => setOrderRef(`#ORD${Date.now().toString().slice(-6)}`);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      if (mode === 'cash' || mode === 'installment') {
        const [categoriesData, itemsData, settingsData] = await Promise.all([
          categoryService.getAll(),
          itemService.getAvailable(),
          installmentSettingsService.getAll(),
        ]);
        setCategories(categoriesData);
        setAllItems(itemsData);
        setItems(itemsData);

        const rates = {};
        (settingsData || []).forEach((setting) => {
          if (setting?.months != null) {
            rates[String(setting.months)] = Number(setting.interest_rate) || 0;
          }
        });
        setInterestRates(rates);
      } else if (mode === 'payment') {
        const [plansData, paymentsData] = await Promise.all([
          installmentPlanService.getActive(),
          installmentPaymentService.getPending(),
        ]);
        setInstallmentPlans(plansData);
        setPendingPayments(paymentsData);
      }
    } catch (err) {
      setError(t('Failed to load data'));
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [mode, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const installmentPeriodOptions = useMemo(() => {
    const keys = Object.keys(interestRates).sort((a, b) => Number(a) - Number(b));
    if (keys.length > 0) {
      return keys.map((months) => ({
        months,
        interest_rate: interestRates[months],
      }));
    }
    return DEFAULT_INSTALLMENT_PERIODS.map((opt) => ({
      months: String(opt.months),
      interest_rate: opt.interest_rate,
    }));
  }, [interestRates]);

  useEffect(() => {
    const available = installmentPeriodOptions.map((opt) => opt.months);
    if (available.length > 0 && !available.includes(installmentMonths)) {
      setInstallmentMonths(available[0]);
    }
  }, [installmentPeriodOptions, installmentMonths]);

  const handleCategorySelect = async (category) => {
    if (!category) {
      setSelectedCategory(null);
      setItems(allItems);
      return;
    }
    setSelectedCategory(category);
    try {
      const categoryItems = await itemService.getByCategory(category.id);
      setItems(categoryItems);
    } catch {
      setItems(allItems.filter((item) => item.category_id === category.id));
    }
  };

  const displayItems = useMemo(() => {
    if (mode === 'payment') return [];
    const source =
      mode === 'cash'
        ? selectedCategory
          ? allItems.filter((i) => i.category_id === selectedCategory.id)
          : allItems
        : items;
    if (!itemSearch.trim()) return source;
    return source.filter((item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [mode, allItems, items, selectedCategory, itemSearch]);

  const filteredPlans = installmentPlans.filter(
    (plan) =>
      plan.customer_name.toLowerCase().includes(planSearch.toLowerCase()) ||
      (plan.customer_id_card &&
        plan.customer_id_card.toLowerCase().includes(planSearch.toLowerCase()))
  );

  const addToBill = (item) => {
    const existingIndex = bill.findIndex((billItem) => billItem.id === item.id);
    const price = item.selling_price ?? item.price;

    if (existingIndex !== -1) {
      const newBill = [...bill];
      if (newBill[existingIndex].quantity < item.quantity) {
        newBill[existingIndex].quantity += 1;
        newBill[existingIndex].total = newBill[existingIndex].quantity * newBill[existingIndex].price;
        setBill(newBill);
      } else {
        setError('Cannot add more than available stock!');
        setTimeout(() => setError(''), 2000);
      }
    } else {
      setBill([
        ...bill,
        {
          id: item.id,
          name: item.name,
          price,
          quantity: 1,
          maxQuantity: item.quantity,
          total: price,
          categoryIcon: getItemCategoryIcon(item, categories),
          category_id: item.category_id,
          category_icon: item.category_icon,
          image_path: item.image_path,
        },
      ]);
    }
  };

  const incrementQuantity = (itemId) => {
    setBill(
      bill.map((item) => {
        if (item.id === itemId && item.quantity < item.maxQuantity) {
          const quantity = item.quantity + 1;
          return { ...item, quantity, total: quantity * item.price };
        }
        return item;
      })
    );
  };

  const decrementQuantity = (itemId) => {
    setBill(
      bill.map((item) => {
        if (item.id === itemId && item.quantity > 1) {
          const quantity = item.quantity - 1;
          return { ...item, quantity, total: quantity * item.price };
        }
        return item;
      })
    );
  };

  const removeFromBill = (itemId) => {
    setBill(bill.filter((item) => item.id !== itemId));
  };

  const handleProductQty = (item, delta, e) => {
    e?.stopPropagation();
    const inBill = bill.find((b) => b.id === item.id);
    if (delta > 0) {
      if (inBill) incrementQuantity(item.id);
      else addToBill(item);
    } else if (inBill) {
      if (inBill.quantity <= 1) removeFromBill(item.id);
      else decrementQuantity(item.id);
    }
  };

  const clearBill = () => {
    if (bill.length > 0 && window.confirm(t('Are you sure you want to clear the entire bill?'))) {
      setBill([]);
      setCustomer({ name: '', phone: '', idCardNo: '', email: '', address: '', idImage: null });
      setWitness({ name: '', phone: '', idCardNo: '', address: '', idImage: null });
      setDownPayment('');
      newOrderRef();
    }
  };

  const calculateTotal = () => bill.reduce((sum, item) => sum + item.total, 0);

  const calculateInstallmentPreview = () => {
    const total = calculateTotal();
    const down = parseFloat(downPayment) || 0;
    const remaining = total - down;
    const selectedPeriod = installmentPeriodOptions.find((opt) => opt.months === installmentMonths);
    const rate = selectedPeriod?.interest_rate ?? 0;
    const interestAmount = (remaining * rate) / 100;
    const totalWithInterest = remaining + interestAmount;
    const months = parseInt(installmentMonths, 10) || 1;
    const monthlyPayment = totalWithInterest / months;
    return {
      total: total.toFixed(2),
      downPayment: down.toFixed(2),
      remaining: remaining.toFixed(2),
      interestRate: rate,
      interestAmount: interestAmount.toFixed(2),
      totalWithInterest: totalWithInterest.toFixed(2),
      monthlyPayment: monthlyPayment.toFixed(2),
    };
  };

  const openInstallmentModal = () => {
    if (bill.length === 0) {
      setError(t('Add items to bill before checkout'));
      setTimeout(() => setError(''), 3000);
      return;
    }
    setError('');
    setShowInstallmentModal(true);
  };

  const closeInstallmentModal = () => {
    setShowInstallmentModal(false);
  };

  const handleImageCapture = (field, type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === 'customer') {
            setCustomer((prev) => ({ ...prev, [field]: reader.result }));
          } else {
            setWitness((prev) => ({ ...prev, [field]: reader.result }));
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleCashSaleCheckout = async () => {
    if (bill.length === 0) {
      setError(t('Add items to bill before checkout'));
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!window.confirm(t('Confirm sale and process payment?'))) return;

    try {
      setProcessing(true);
      setError('');
      for (const item of bill) {
        await saleService.processCashSale(item.id, item.quantity);
      }
      setSuccess(t('Sale completed successfully!'));
      setBill([]);
      newOrderRef();
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to process sale'));
    } finally {
      setProcessing(false);
    }
  };

  const handleInstallmentSaleCheckout = async () => {
    if (bill.length === 0) {
      setError('Add items to bill');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!customer.name || !customer.phone || !customer.idCardNo || !customer.address) {
      setError('Please fill in all customer details');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!witness.name || !witness.phone || !witness.idCardNo || !witness.address) {
      setError('Please fill in all witness details');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!downPayment || parseFloat(downPayment) <= 0) {
      setError('Please enter a valid down payment');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const total = calculateTotal();
    if (parseFloat(downPayment) >= total) {
      setError('Down payment must be less than total amount');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!window.confirm('Confirm installment sale?')) return;

    try {
      setProcessing(true);
      setError('');
      const firstItem = bill[0];
      const totalQuantity = bill.reduce((sum, item) => sum + item.quantity, 0);
      await saleService.processInstallmentSale({
        itemId: firstItem.id,
        quantity: totalQuantity,
        customer,
        witness,
        downPayment: parseFloat(downPayment),
        installmentMonths: parseInt(installmentMonths, 10),
      });
      setSuccess('Installment sale created successfully!');
      setBill([]);
      setCustomer({ name: '', phone: '', idCardNo: '', email: '', address: '', idImage: null });
      setWitness({ name: '', phone: '', idCardNo: '', address: '', idImage: null });
      setDownPayment('');
      setShowInstallmentModal(false);
      newOrderRef();
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process installment sale');
    } finally {
      setProcessing(false);
    }
  };

  const handleInstallmentPayment = async () => {
    if (!selectedPlan || !paymentAmount) {
      setError('Please select a plan and enter payment amount');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!window.confirm('Confirm payment recording?')) return;

    try {
      setProcessing(true);
      setError('');
      const planPayments = pendingPayments.filter((p) => p.installment_plan_id === selectedPlan.id);
      if (planPayments.length === 0) {
        setError('No pending payments for this plan');
        return;
      }
      const nextPayment = planPayments.sort((a, b) => a.payment_number - b.payment_number)[0];
      await installmentPaymentService.recordPayment(
        nextPayment.id,
        parseFloat(paymentAmount),
        paymentNotes
      );
      setSuccess('Payment recorded successfully!');
      setSelectedPlan(null);
      setPaymentAmount('');
      setPaymentNotes('');
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleHold = () => {
    if (bill.length === 0) {
      setError('No items to hold');
      setTimeout(() => setError(''), 2000);
      return;
    }
    localStorage.setItem(
      HOLD_KEY,
      JSON.stringify({ bill, mode, customer, witness, downPayment, installmentMonths, walkInCustomer })
    );
    setSuccess('Order held successfully');
    setBill([]);
    newOrderRef();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRestoreHold = () => {
    const raw = localStorage.getItem(HOLD_KEY);
    if (!raw) {
      setError('No held order found');
      setTimeout(() => setError(''), 2000);
      return;
    }
    try {
      const data = JSON.parse(raw);
      setBill(data.bill || []);
      if (data.mode) setMode(data.mode);
      if (data.customer) setCustomer(data.customer);
      if (data.witness) setWitness(data.witness);
      if (data.downPayment) setDownPayment(data.downPayment);
      if (data.installmentMonths) setInstallmentMonths(data.installmentMonths);
      if (data.walkInCustomer) setWalkInCustomer(data.walkInCustomer);
      setSuccess('Held order restored');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Could not restore held order');
    }
  };

  const handlePaymentAction = () => {
    if (mode === 'cash') handleCashSaleCheckout();
    else if (mode === 'installment') openInstallmentModal();
    else handleInstallmentPayment();
  };

  const total = calculateTotal();
  const installmentPreview = downPayment ? calculateInstallmentPreview() : null;

  const renderInstallmentModal = () => {
    if (!showInstallmentModal) return null;

    return (
      <div
        className="modal show d-block pos-installment-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="installmentModalTitle"
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="installmentModalTitle">
                <i className="bi bi-clipboard-check me-2"></i>
                {t('Installment Sale Details')}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeInstallmentModal}
                disabled={processing}
                aria-label={t('Close')}
              />
            </div>
            <div className="modal-body">
              <div className="pos-installment-order-summary mb-3">
                <span>{t('Order Total')}</span>
                <strong>${total.toFixed(2)}</strong>
                <span className="text-muted small ms-2">
                  ({bill.length} {bill.length === 1 ? t('item') : t('items')})
                </span>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <h6 className="pos-installment-section-title">{t('Customer Details')}</h6>
                  <div className="mb-2">
                    <label className="form-label">{t('Customer Name')} *</label>
                    <input
                      className="form-control"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('Phone')} *</label>
                    <input
                      className="form-control"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('ID Card No')} *</label>
                    <input
                      className="form-control"
                      value={customer.idCardNo}
                      onChange={(e) => setCustomer({ ...customer, idCardNo: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('Address')} *</label>
                    <input
                      className="form-control"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('Email')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm w-100"
                    onClick={() => handleImageCapture('idImage', 'customer')}
                  >
                    <i className="bi bi-camera me-1"></i>
                    {customer.idImage ? t('ID Captured') : t('Capture Customer ID')}
                  </button>
                </div>

                <div className="col-md-6">
                  <h6 className="pos-installment-section-title">{t('Witness Details')}</h6>
                  <div className="mb-2">
                    <label className="form-label">{t('Witness Name')} *</label>
                    <input
                      className="form-control"
                      value={witness.name}
                      onChange={(e) => setWitness({ ...witness, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('Witness Phone')} *</label>
                    <input
                      className="form-control"
                      value={witness.phone}
                      onChange={(e) => setWitness({ ...witness, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('Witness ID')} *</label>
                    <input
                      className="form-control"
                      value={witness.idCardNo}
                      onChange={(e) => setWitness({ ...witness, idCardNo: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('Witness Address')} *</label>
                    <input
                      className="form-control"
                      value={witness.address}
                      onChange={(e) => setWitness({ ...witness, address: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm w-100"
                    onClick={() => handleImageCapture('idImage', 'witness')}
                  >
                    <i className="bi bi-camera me-1"></i>
                    {witness.idImage ? t('ID Captured') : t('Capture Witness ID')}
                  </button>
                </div>
              </div>

              <hr className="my-4" />

              <h6 className="pos-installment-section-title">{t('Payment Terms')}</h6>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">{t('Down Payment')} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">{t('Installment Period')} *</label>
                  <select
                    className="form-select"
                    value={installmentMonths}
                    onChange={(e) => setInstallmentMonths(e.target.value)}
                    disabled={installmentPeriodOptions.length === 0}
                  >
                    {installmentPeriodOptions.map((opt) => (
                      <option key={opt.months} value={opt.months}>
                        {opt.months} {t('months')} ({opt.interest_rate}% {t('interest')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {installmentPreview && (
                <div className="pos-installment-preview mt-3">
                  <div className="preview-row">
                    <span>{t('Total')}</span>
                    <span>${installmentPreview.total}</span>
                  </div>
                  <div className="preview-row">
                    <span>{t('Down Payment')}</span>
                    <span>${installmentPreview.downPayment}</span>
                  </div>
                  <div className="preview-row">
                    <span>{t('Remaining')}</span>
                    <span>${installmentPreview.remaining}</span>
                  </div>
                  <div className="preview-row">
                    <span>{t('Interest')} ({installmentPreview.interestRate}%)</span>
                    <span>${installmentPreview.interestAmount}</span>
                  </div>
                  <div className="preview-row highlight">
                    <span>{t('Total with Interest')}</span>
                    <span>${installmentPreview.totalWithInterest}</span>
                  </div>
                  <div className="preview-row highlight">
                    <span>{t('Monthly Payment')}</span>
                    <span>${installmentPreview.monthlyPayment}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={closeInstallmentModal}
                disabled={processing}
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={processing}
                onClick={handleInstallmentSaleCheckout}
              >
                {processing ? t('Processing...') : `📋 ${t('Create Installment')}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderPanel = () => (
    <aside className="pos-order-panel">
      <div className="pos-order-header">
        <h6>{mode === 'payment' ? t('Record Payment') : t('Order List')}</h6>
        <div className="d-flex align-items-center gap-2">
          {mode !== 'payment' && <span className="pos-order-id">{orderRef}</span>}
          {mode !== 'payment' && bill.length > 0 && (
            <button type="button" className="pos-order-clear" onClick={clearBill} title="Clear order">
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>
      </div>

      {mode !== 'payment' && (
        <>
          <div className="pos-customer-row">
            <select
              className="pos-customer-select"
              value={walkInCustomer}
              onChange={(e) => setWalkInCustomer(e.target.value)}
            >
              <option>Walk in Customer</option>
              <option>Regular Customer</option>
              <option>Member Customer</option>
            </select>
            <button type="button" className="pos-icon-action green" title="Add customer" onClick={handleRestoreHold}>
              <i className="bi bi-person-plus"></i>
            </button>
            <button type="button" className="pos-icon-action blue" title="Restore held order" onClick={handleRestoreHold}>
              <i className="bi bi-arrow-repeat"></i>
            </button>
          </div>

          <div className="pos-order-items">
            {bill.length === 0 ? (
              <div className="pos-order-empty">
                <i className="bi bi-cart3 d-block fs-2 mb-2"></i>
                {t('No items in bill')}
              </div>
            ) : (
              bill.map((item) => (
                <div key={item.id} className="pos-order-item">
                  <div className="pos-order-item-info">
                    <span className="pos-order-item-thumb">
                      <ProductThumbnail item={item} categories={categories} size={22} />
                    </span>
                    <span className="pos-order-item-name">{item.name}</span>
                  </div>
                  <div className="pos-order-item-qty">
                    <button type="button" className="pos-qty-btn" onClick={() => decrementQuantity(item.id)}>−</button>
                    <span className="pos-qty-value">{item.quantity}</span>
                    <button type="button" className="pos-qty-btn" onClick={() => incrementQuantity(item.id)}>+</button>
                  </div>
                  <div className="pos-order-item-cost">${item.total.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          <div className="pos-summary">
            <div className="pos-summary-row"><span>Shipping</span><span>$0.00</span></div>
            <div className="pos-summary-row"><span>Tax</span><span>$0.00</span></div>
            <div className="pos-summary-row discount"><span>Discount</span><span>$0.00</span></div>
            <div className="pos-summary-total">
              <span>{t('Sub Total')}</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            className="pos-checkout-btn"
            disabled={processing || (mode !== 'payment' && bill.length === 0)}
            onClick={handlePaymentAction}
          >
            {processing
              ? t('Processing...')
              : mode === 'cash'
                ? `💳 ${t('Complete Sale')}`
                : mode === 'installment'
                  ? `📋 ${t('Create Installment')}`
                  : t('Record Payment')}
          </button>
        </>
      )}

      {mode === 'payment' && selectedPlan && (
        <div className="p-3">
          <div className="bg-light rounded p-3 mb-3 small">
            <strong>{selectedPlan.customer_name}</strong>
            <div>{t('Remaining')}: ${(selectedPlan.total_with_interest - selectedPlan.paid_amount).toFixed(2)}</div>
          </div>
          <label className="form-label">{t('Payment Amount')}</label>
          <input type="number" className="form-control mb-2" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          <label className="form-label">{t('Notes (Optional)')}</label>
          <textarea className="form-control mb-3" rows={2} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
          <button type="button" className="pos-checkout-btn" disabled={!paymentAmount || processing} onClick={handleInstallmentPayment}>
            {processing ? t('Processing...') : t('Record Payment')}
          </button>
        </div>
      )}

      {mode === 'payment' && !selectedPlan && (
        <div className="pos-order-empty">{t('Select an installment plan to record payment')}</div>
      )}
    </aside>
  );

  if (loading) {
    return (
      <div className="pos-loading">
        <div className="pos-spinner" />
        <p>{t('loading') || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="pos-page">
      <div className="pos-mode-bar">
        <button type="button" className={`pos-mode-btn${mode === 'cash' ? ' active' : ''}`} onClick={() => setMode('cash')}>
          💰 {t('Cash Sale')}
        </button>
        <button
          type="button"
          className={`pos-mode-btn${mode === 'installment' ? ' active' : ''}`}
          onClick={() => {
            setMode('installment');
            setShowInstallmentModal(false);
          }}
        >
          📋 {t('Installment Sale')}
        </button>
        <button type="button" className={`pos-mode-btn${mode === 'payment' ? ' active' : ''}`} onClick={() => setMode('payment')}>
          💳 {t('Installment Payment')}
        </button>
      </div>

      <div className="pos-alerts">
        {error && <div className="pos-alert pos-alert-error">{error}</div>}
        {success && <div className="pos-alert pos-alert-success">{success}</div>}
      </div>

      {mode === 'payment' ? (
        <div className="pos-payment-layout">
          <div className="pos-plans-area">
            <div className="pos-products-header">
              <div className="pos-welcome">
                <h5>{t('Installment Payment')}</h5>
                <p>{t('Select an installment plan to record payment.')}</p>
              </div>
              <div className="pos-products-toolbar">
                <div className="pos-search-wrap">
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder={t('Search by customer name or NIC...')}
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="pos-plans-grid">
              {filteredPlans.length === 0 ? (
                <p className="text-muted">{t('No installment plans available')}</p>
              ) : (
                filteredPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className={`pos-plan-card${selectedPlan?.id === plan.id ? ' selected' : ''}`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="fw-bold">{plan.customer_name}</div>
                    {plan.customer_id_card && <div className="small text-muted">NIC: {plan.customer_id_card}</div>}
                    <div className="small mt-2">
                      {t('Remaining')}: ${(plan.total_with_interest - plan.paid_amount).toFixed(2)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          {renderOrderPanel()}
        </div>
      ) : (
        <div className="pos-main">
          <aside className="pos-categories">
            <button
              type="button"
              className={`pos-cat-item${!selectedCategory ? ' active' : ''}`}
              onClick={() => handleCategorySelect(null)}
            >
              <i className="bi bi-grid"></i>
              {t('All')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pos-cat-item${selectedCategory?.id === cat.id ? ' active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
              >
                <CategoryIcon name={cat.icon} size={22} className="pos-cat-icon" />
                {cat.name}
              </button>
            ))}
          </aside>

          <section className="pos-products">
            <div className="pos-products-header">
              <div className="pos-welcome">
                <h5>Welcome, {user?.name || 'Cashier'}</h5>
                <p>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="pos-products-toolbar">
                <div className="pos-search-wrap">
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder={t('Search Product')}
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                  />
                </div>
                <button type="button" className="pos-btn-brands" onClick={() => handleCategorySelect(null)}>
                  {t('View All Brands')}
                </button>
                <button type="button" className="pos-btn-featured" onClick={() => setItemSearch('')}>
                  <i className="bi bi-star-fill me-1"></i>
                  Featured
                </button>
              </div>
            </div>

            <div className="pos-product-grid-wrap">
              <div className="pos-product-grid">
                {displayItems.length === 0 ? (
                  <p className="text-muted py-4">
                    {mode === 'installment' && !selectedCategory
                      ? t('Choose a category to view items.')
                      : t('No items found')}
                  </p>
                ) : (
                  displayItems.map((item) => {
                    const inBill = bill.find((b) => b.id === item.id);
                    const qty = inBill?.quantity || 0;
                    const cat = categories.find((c) => c.id === item.category_id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`pos-product-card${qty > 0 ? ' selected' : ''}`}
                        onClick={() => addToBill(item)}
                      >
                        <span className="pos-product-check"><i className="bi bi-check-lg"></i></span>
                        <div className="pos-product-image">
                          <ProductThumbnail item={item} categories={categories} size={36} />
                        </div>
                        <div className="pos-product-cat">{cat?.name || 'General'}</div>
                        <div className="pos-product-name">{item.name}</div>
                        <div className="pos-product-price">${(item.selling_price ?? item.price ?? 0).toFixed(2)}</div>
                        <div className="pos-product-qty" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="pos-qty-btn" onClick={(e) => handleProductQty(item, -1, e)} disabled={qty === 0}>−</button>
                          <span className="pos-qty-value">{qty}</span>
                          <button
                            type="button"
                            className="pos-qty-btn"
                            onClick={(e) => handleProductQty(item, 1, e)}
                            disabled={qty >= item.quantity}
                          >
                            +
                          </button>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pos-actions">
              <button type="button" className="pos-action-btn pos-action-hold" onClick={handleHold}>Hold</button>
              <button type="button" className="pos-action-btn pos-action-void" onClick={clearBill}>Void</button>
              <button
                type="button"
                className="pos-action-btn pos-action-payment"
                disabled={processing || bill.length === 0}
                onClick={handlePaymentAction}
              >
                Payment
              </button>
              <button
                type="button"
                className="pos-action-btn pos-action-orders"
                onClick={() => (isAdmin ? navigate('/sales-report') : navigate('/'))}
              >
                View Orders
              </button>
              <button
                type="button"
                className="pos-action-btn pos-action-reset"
                onClick={() => {
                  setItemSearch('');
                  setSelectedCategory(null);
                  setItems(allItems);
                  newOrderRef();
                }}
              >
                Reset
              </button>
              <button type="button" className="pos-action-btn pos-action-transaction" onClick={() => setMode('payment')}>
                Transaction
              </button>
            </div>
          </section>

          {renderOrderPanel()}
        </div>
      )}

      {renderInstallmentModal()}
    </div>
  );
}

export default SellItems;
