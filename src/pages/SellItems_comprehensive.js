import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService, categoryService, saleService, installmentSettingsService, installmentPaymentService, installmentPlanService } from '../services';
import './SellItems.css';

function SellItems() {
  const { t } = useTranslation();
  
  // Mode selection: 'cash', 'installment', 'payment'
  const [mode, setMode] = useState('cash');
  
  // Common states
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bill, setBill] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search states
  const [categorySearch, setCategorySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  
  // Installment sale states
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
  
  // Installment payment states
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [mode]);

  const loadData = async () => {
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
        
        const rates = {};
        settingsData.forEach((setting) => {
          rates[setting.months] = setting.interest_rate;
        });
        setInterestRates(rates);
        
        if (!installmentMonths && settingsData.length > 0) {
          const sortedSettings = settingsData.sort((a, b) => a.months - b.months);
          setInstallmentMonths(sortedSettings[0].months.toString());
        }
      } else if (mode === 'payment') {
        const [plansData, paymentsData] = await Promise.all([
          installmentPlanService.getActive(),
          installmentPaymentService.getPending(),
        ]);
        setInstallmentPlans(plansData);
        setPendingPayments(paymentsData);
      }
    } catch (error) {
      setError(t('Failed to load data'));
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    try {
      const categoryItems = await itemService.getByCategory(category.id);
      setItems(categoryItems);
    } catch (error) {
      const filtered = allItems.filter(item => item.category_id === category.id);
      setItems(filtered);
    }
  };

  const addToBill = (item) => {
    const existingIndex = bill.findIndex(billItem => billItem.id === item.id);
    
    if (existingIndex !== -1) {
      const newBill = [...bill];
      if (newBill[existingIndex].quantity < item.quantity) {
        newBill[existingIndex].quantity += 1;
        newBill[existingIndex].total = newBill[existingIndex].quantity * newBill[existingIndex].price;
        setBill(newBill);
        setSuccess(`${item.name} quantity updated!`);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError('Cannot add more than available stock!');
        setTimeout(() => setError(''), 2000);
      }
    } else {
      const billItem = {
        id: item.id,
        name: item.name,
        price: item.selling_price || item.price,
        quantity: 1,
        maxQuantity: item.quantity,
        total: item.selling_price || item.price,
      };
      setBill([...bill, billItem]);
      setSuccess(`${item.name} added to bill!`);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const incrementQuantity = (itemId) => {
    const newBill = bill.map(item => {
      if (item.id === itemId && item.quantity < item.maxQuantity) {
        return {
          ...item,
          quantity: item.quantity + 1,
          total: (item.quantity + 1) * item.price,
        };
      }
      return item;
    });
    setBill(newBill);
  };

  const decrementQuantity = (itemId) => {
    const newBill = bill.map(item => {
      if (item.id === itemId && item.quantity > 1) {
        return {
          ...item,
          quantity: item.quantity - 1,
          total: (item.quantity - 1) * item.price,
        };
      }
      return item;
    });
    setBill(newBill);
  };

  const removeFromBill = (itemId) => {
    setBill(bill.filter(item => item.id !== itemId));
  };

  const clearBill = () => {
    if (bill.length > 0 && window.confirm(t('Are you sure you want to clear the entire bill?'))) {
      setBill([]);
      setCustomer({ name: '', phone: '', idCardNo: '', email: '', address: '', idImage: null });
      setWitness({ name: '', phone: '', idCardNo: '', address: '', idImage: null });
      setDownPayment('');
    }
  };

  const calculateTotal = () => {
    return bill.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateInstallmentPreview = () => {
    const total = calculateTotal();
    const down = parseFloat(downPayment) || 0;
    const remaining = total - down;
    const rate = interestRates[installmentMonths] || 0;
    const interest = (remaining * rate) / 100;
    const totalWithInterest = remaining + interest;
    const monthly = totalWithInterest / parseInt(installmentMonths);
    
    return {
      total: total.toFixed(2),
      downPayment: down.toFixed(2),
      remaining: remaining.toFixed(2),
      interestRate: rate,
      interestAmount: interest.toFixed(2),
      totalWithInterest: totalWithInterest.toFixed(2),
      monthlyPayment: monthly.toFixed(2),
      months: installmentMonths,
    };
  };

  const handleImageCapture = (field, type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === 'customer') {
            setCustomer({ ...customer, [field]: reader.result });
          } else {
            setWitness({ ...witness, [field]: reader.result });
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

    if (!window.confirm(t('Confirm sale and process payment?'))) {
      return;
    }

    try {
      setProcessing(true);
      setError('');

      for (const item of bill) {
        await saleService.processCashSale(item.id, item.quantity);
      }

      setSuccess(t('Sale completed successfully!'));
      setBill([]);
      await loadData();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.error || t('Failed to process sale'));
      console.error('Checkout error:', error);
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

    if (!window.confirm('Confirm installment sale?')) {
      return;
    }

    try {
      setProcessing(true);
      setError('');

      // Use first item for installment (or combine if needed)
      const firstItem = bill[0];
      const totalQuantity = bill.reduce((sum, item) => sum + item.quantity, 0);

      const installmentData = {
        itemId: firstItem.id,
        quantity: totalQuantity,
        customer,
        witness,
        downPayment: parseFloat(downPayment),
        installmentMonths: parseInt(installmentMonths),
      };

      await saleService.processInstallmentSale(installmentData);

      setSuccess('Installment sale created successfully!');
      setBill([]);
      setCustomer({ name: '', phone: '', idCardNo: '', email: '', address: '', idImage: null });
      setWitness({ name: '', phone: '', idCardNo: '', address: '', idImage: null });
      setDownPayment('');
      await loadData();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to process installment sale');
      console.error('Installment sale error:', error);
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

    if (!window.confirm('Confirm payment recording?')) {
      return;
    }

    try {
      setProcessing(true);
      setError('');

      // Find the next pending payment for this plan
      const planPayments = pendingPayments.filter(p => p.installment_plan_id === selectedPlan.id);
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
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to record payment');
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>{t('Loading...')}</p>
      </div>
    );
  }

  return (
    <div className="sell-container">
      {/* Mode Selection Header */}
      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'cash' ? 'active' : ''}`}
          onClick={() => setMode('cash')}
        >
          💰 {t('Cash Sale')}
        </button>
        <button
          className={`mode-btn ${mode === 'installment' ? 'active' : ''}`}
          onClick={() => setMode('installment')}
        >
          📋 {t('Installment Sale')}
        </button>
        <button
          className={`mode-btn ${mode === 'payment' ? 'active' : ''}`}
          onClick={() => setMode('payment')}
        >
          💳 {t('Installment Payment')}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Cash Sale & Installment Sale Layout */}
      {(mode === 'cash' || mode === 'installment') && (
        <div className="sell-items-container">
          {/* Left Panel - Categories */}
          <div className="categories-panel">
            <h3>📂 {t('Select Category')}</h3>
            <input
              type="text"
              className="search-input"
              placeholder={t('Search categories...')}
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
            <div className="categories-grid-sell">
              {filteredCategories.length === 0 ? (
                <p className="empty-message">{t('No categories found')}</p>
              ) : (
                filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`category-card-sell ${selectedCategory?.id === category.id ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div className="category-icon-sell">{category.icon || '📦'}</div>
                    <div className="category-name-sell">{category.name}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center Panel - Items */}
          <div className="items-panel">
            <div className="items-panel-header">
              <h3>
                {selectedCategory
                  ? `${selectedCategory.icon || '📦'} ${selectedCategory.name}`
                  : '📋 ' + t('Items')}
              </h3>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder={t('Search items...')}
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
            <div className="items-list">
              {!selectedCategory ? (
                <div className="empty-items">
                  <div className="empty-items-icon">👈</div>
                  <p>{t('Select a category to view items')}</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="empty-items">
                  <div className="empty-items-icon">📭</div>
                  <p>{t('No items found')}</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="item-card-sell"
                    onClick={() => addToBill(item)}
                  >
                    <div className="item-header-sell">
                      <span className="item-name-sell">{item.name}</span>
                      <span className="item-price-sell">${(item.selling_price || item.price).toFixed(2)}</span>
                    </div>
                    {item.description && (
                      <div className="item-description-sell">{item.description}</div>
                    )}
                    <div className="item-footer-sell">
                      <span className={`item-stock ${item.quantity < 10 ? 'low' : ''}`}>
                        📦 {item.quantity} {t('in stock')}
                      </span>
                      <button className="add-item-btn" onClick={(e) => {
                        e.stopPropagation();
                        addToBill(item);
                      }}>
                        ➕ {t('Add')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Bill */}
          <div className="bill-panel-right">
            <div className="bill-header">
              <h3>{t('Current Bill')}</h3>
            </div>

            <div className="bill-content">
              {bill.length === 0 ? (
                <div className="empty-bill">
                  <div className="empty-bill-icon">🛒</div>
                  <p>{t('No items in bill')}</p>
                </div>
              ) : (
                <>
                  {bill.map((item) => (
                    <div key={item.id} className="bill-item">
                      <div className="bill-item-header">
                        <span className="bill-item-name">{item.name}</span>
                        <button
                          className="remove-item-btn"
                          onClick={() => removeFromBill(item.id)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="bill-item-details">
                        <div className="quantity-controls">
                          <button
                            className="qty-btn"
                            onClick={() => decrementQuantity(item.id)}
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="qty-display">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => incrementQuantity(item.id)}
                            disabled={item.quantity >= item.maxQuantity}
                          >
                            +
                          </button>
                        </div>
                        <span className="bill-item-price">${item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Installment Details Section (Only for Installment Mode) */}
            {mode === 'installment' && bill.length > 0 && (
              <div className="installment-details">
                <h4>{t('Customer Details')}</h4>
                <input
                  type="text"
                  className="form-input-sm"
                  placeholder={t('Name')}
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                />
                <input
                  type="text"
                  className="form-input-sm"
                  placeholder={t('Phone')}
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                />
                <input
                  type="text"
                  className="form-input-sm"
                  placeholder={t('ID Card No')}
                  value={customer.idCardNo}
                  onChange={(e) => setCustomer({...customer, idCardNo: e.target.value})}
                />
                <input
                  type="text"
                  className="form-input-sm"
                  placeholder={t('Address')}
                  value={customer.address}
                  onChange={(e) => setCustomer({...customer, address: e.target.value})}
                />
                <button
                  className="btn-upload-sm"
                  onClick={() => handleImageCapture('idImage', 'customer')}
                >
                  📷 {customer.idImage ? t('ID Captured') : t('Capture ID')}
                </button>

                <h4 style={{marginTop: '1rem'}}>{t('Witness Details')}</h4>
                <input
                  type="text"
                  className="form-input-sm"
                  placeholder={t('Witness Name')}
                  value={witness.name}
                  onChange={(e) => setWitness({...witness, name: e.target.value})}
                />
                <input
                  type="text"
                  className="form-input-sm"
                  placeholder={t('Witness Phone')}
                  value={witness.phone}
                  onChange={(e) => setWitness({...witness, phone: e.target.value})}
                />
                <input
                  type="text"
                  className="form-input-sm"
                  placeholder={t('Witness ID')}
                  value={witness.idCardNo}
                  onChange={(e) => setWitness({...witness, idCardNo: e.target.value})}
                />
                <input
                  type="text"
                  className="form-input-sm"
                  placeholder={t('Witness Address')}
                  value={witness.address}
                  onChange={(e) => setWitness({...witness, address: e.target.value})}
                />
                <button
                  className="btn-upload-sm"
                  onClick={() => handleImageCapture('idImage', 'witness')}
                >
                  📷 {witness.idImage ? t('ID Captured') : t('Capture ID')}
                </button>

                <h4 style={{marginTop: '1rem'}}>{t('Payment Terms')}</h4>
                <input
                  type="number"
                  className="form-input-sm"
                  placeholder={t('Down Payment')}
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
                <select
                  className="form-select-sm"
                  value={installmentMonths}
                  onChange={(e) => setInstallmentMonths(e.target.value)}
                >
                  {Object.keys(interestRates).map(months => (
                    <option key={months} value={months}>
                      {months} {t('months')} ({interestRates[months]}% {t('interest')})
                    </option>
                  ))}
                </select>

                {downPayment && (
                  <div className="installment-preview">
                    <div className="preview-row">
                      <span>{t('Total')}:</span>
                      <span>${calculateInstallmentPreview().total}</span>
                    </div>
                    <div className="preview-row">
                      <span>{t('Down Payment')}:</span>
                      <span>${calculateInstallmentPreview().downPayment}</span>
                    </div>
                    <div className="preview-row">
                      <span>{t('Remaining')}:</span>
                      <span>${calculateInstallmentPreview().remaining}</span>
                    </div>
                    <div className="preview-row">
                      <span>{t('Interest')} ({calculateInstallmentPreview().interestRate}%):</span>
                      <span>${calculateInstallmentPreview().interestAmount}</span>
                    </div>
                    <div className="preview-row highlight">
                      <span>{t('Total with Interest')}:</span>
                      <span>${calculateInstallmentPreview().totalWithInterest}</span>
                    </div>
                    <div className="preview-row highlight">
                      <span>{t('Monthly Payment')}:</span>
                      <span>${calculateInstallmentPreview().monthlyPayment}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bill-summary">
              <div className="bill-total">
                <span className="bill-total-label">{t('Total')}:</span>
                <span className="bill-total-amount">${calculateTotal().toFixed(2)}</span>
              </div>
              <button
                className="checkout-btn"
                onClick={mode === 'cash' ? handleCashSaleCheckout : handleInstallmentSaleCheckout}
                disabled={bill.length === 0 || processing}
              >
                {processing ? t('Processing...') : 
                  mode === 'cash' ? `💳 ${t('Complete Sale')}` : `📋 ${t('Create Installment Plan')}`}
              </button>
              <button
                className="clear-bill-btn"
                onClick={clearBill}
                disabled={bill.length === 0}
              >
                🗑️ {t('Clear Bill')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installment Payment Layout */}
      {mode === 'payment' && (
        <div className="payment-container">
          <div className="payment-plans-section">
            <h3>📋 {t('Select Installment Plan')}</h3>
            <div className="plans-list">
              {installmentPlans.length === 0 ? (
                <p className="empty-message">{t('No active installment plans')}</p>
              ) : (
                installmentPlans.map(plan => (
                  <div
                    key={plan.id}
                    className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="plan-customer">{plan.customer_name}</div>
                    <div className="plan-details">
                      <span>{t('Total')}: ${plan.total_with_interest}</span>
                      <span>{t('Paid')}: ${plan.paid_amount}</span>
                    </div>
                    <div className="plan-remaining">
                      {t('Remaining')}: ${(plan.total_with_interest - plan.paid_amount).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="payment-form-section">
            <h3>💳 {t('Record Payment')}</h3>
            {!selectedPlan ? (
              <p className="empty-message">{t('Select a plan to record payment')}</p>
            ) : (
              <div className="payment-form">
                <div className="form-group">
                  <label>{t('Plan Details')}</label>
                  <div className="plan-info">
                    <p><strong>{t('Customer')}:</strong> {selectedPlan.customer_name}</p>
                    <p><strong>{t('Monthly Payment')}:</strong> ${selectedPlan.monthly_payment}</p>
                    <p><strong>{t('Remaining')}:</strong> ${(selectedPlan.total_with_interest - selectedPlan.paid_amount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('Payment Amount')}</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={t('Enter amount')}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('Notes (Optional)')}</label>
                  <textarea
                    className="form-input"
                    placeholder={t('Payment notes...')}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows="3"
                  />
                </div>

                <button
                  className="checkout-btn"
                  onClick={handleInstallmentPayment}
                  disabled={!paymentAmount || processing}
                >
                  {processing ? t('Processing...') : `💰 ${t('Record Payment')}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SellItems;
