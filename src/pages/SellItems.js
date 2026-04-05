import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService, categoryService, saleService, installmentSettingsService, installmentPaymentService, installmentPlanService } from '../services';

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
  const [planSearch, setPlanSearch] = useState('');

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

  const filteredPlans = installmentPlans.filter(plan =>
    plan.customer_name.toLowerCase().includes(planSearch.toLowerCase()) ||
    (plan.customer_id_card && plan.customer_id_card.toLowerCase().includes(planSearch.toLowerCase()))
  );

  if (loading) {
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
    <div className="p-6 space-y-6">
      {/* Mode Selection Header */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
            mode === 'cash'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setMode('cash')}
        >
          💰 {t('Cash Sale')}
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
            mode === 'installment'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setMode('installment')}
        >
          📋 {t('Installment Sale')}
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
            mode === 'payment'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setMode('payment')}
        >
          💳 {t('Installment Payment')}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Cash Sale & Installment Sale Layout */}
      {(mode === 'cash' || mode === 'installment') && (
        <div className={`${mode === 'installment' ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}`}>
          {mode === 'cash' ? (
            <>
              {/* Cash Sale: 3-column layout */}
              {/* Left Panel - Categories */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📂</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('Select Category')}</h3>
                </div>

                <input
                  type="text"
                  className="input mb-4"
                  placeholder={t('Search categories...')}
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {filteredCategories.length === 0 ? (
                    <p className="text-gray-500 text-center col-span-2 py-4">{t('No categories found')}</p>
                  ) : (
                    filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedCategory?.id === category.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCategorySelect(category)}
                      >
                        <div className="text-2xl mb-2 text-center">{category.icon || '📦'}</div>
                        <div className="text-sm font-medium text-center text-gray-900">{category.name}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Center Panel - Items */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedCategory
                      ? `${selectedCategory.icon || '📦'} ${selectedCategory.name}`
                      : t('Items')}
                  </h3>
                </div>

                <input
                  type="text"
                  className="input mb-4"
                  placeholder={t('Search items...')}
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                />

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {!selectedCategory ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">👈</div>
                      <p className="text-gray-500">{t('Select a category to view items')}</p>
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-gray-500">{t('No items found')}</p>
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-all"
                        onClick={() => addToBill(item)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="font-bold text-primary-600">${(item.selling_price || item.price).toFixed(2)}</span>
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-600 mb-2">{item.description}</div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${item.quantity < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                            📦 {item.quantity} {t('in stock')}
                          </span>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToBill(item);
                            }}
                          >
                            ➕ {t('Add')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Panel - Bill */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🛒</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('Current Bill')}</h3>
                </div>

                <div className="flex-1 min-h-0">
                  {bill.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🛒</div>
                      <p className="text-gray-500">{t('No items in bill')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                      {bill.map((item) => (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <button
                              className="text-red-500 hover:text-red-700 text-lg"
                              onClick={() => removeFromBill(item.id)}
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <button
                                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"
                                onClick={() => decrementQuantity(item.id)}
                                disabled={item.quantity <= 1}
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"
                                onClick={() => incrementQuantity(item.id)}
                                disabled={item.quantity >= item.maxQuantity}
                              >
                                +
                              </button>
                            </div>
                            <span className="font-bold text-gray-900">${item.total.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{t('Total')}:</span>
                    <span className="text-primary-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleCashSaleCheckout}
                    disabled={bill.length === 0 || processing}
                  >
                    {processing ? t('Processing...') : `💳 ${t('Complete Sale')}`}
                  </button>
                  <button
                    className="btn btn-ghost w-full"
                    onClick={clearBill}
                    disabled={bill.length === 0}
                  >
                    🗑️ {t('Clear Bill')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Installment Sale: 2-row layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Categories Section */}
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📂</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('Select Category')}</h3>
                  </div>

                  <input
                    type="text"
                    className="input mb-4"
                    placeholder={t('Search categories...')}
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                    {filteredCategories.length === 0 ? (
                      <p className="text-gray-500 text-center col-span-2 py-4">{t('No categories found')}</p>
                    ) : (
                      filteredCategories.map((category) => (
                        <div
                          key={category.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedCategory?.id === category.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleCategorySelect(category)}
                        >
                          <div className="text-2xl mb-2 text-center">{category.icon || '📦'}</div>
                          <div className="text-sm font-medium text-center text-gray-900">{category.name}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Items Section */}
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📋</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedCategory
                        ? `${selectedCategory.icon || '📦'} ${selectedCategory.name}`
                        : t('Items')}
                    </h3>
                  </div>

                  <input
                    type="text"
                    className="input mb-4"
                    placeholder={t('Search items...')}
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                  />

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {!selectedCategory ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">👈</div>
                        <p className="text-gray-500">{t('Select a category to view items')}</p>
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-gray-500">{t('No items found')}</p>
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-all"
                          onClick={() => addToBill(item)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="font-bold text-primary-600">${(item.selling_price || item.price).toFixed(2)}</span>
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-600 mb-2">{item.description}</div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${item.quantity < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                              📦 {item.quantity} {t('in stock')}
                            </span>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToBill(item);
                              }}
                            >
                              ➕ {t('Add')}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Customer Details & Bill */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer & Witness Details Section */}
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📋</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('Customer & Payment Details')}</h3>
                  </div>

                  {bill.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-gray-500">{t('Add items to bill first')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <h4 className="font-semibold text-gray-900">{t('Customer Details')}</h4>
                      <input
                        type="text"
                        className="input"
                        placeholder={t('Name')}
                        value={customer.name}
                        onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={t('Phone')}
                        value={customer.phone}
                        onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={t('ID Card No')}
                        value={customer.idCardNo}
                        onChange={(e) => setCustomer({...customer, idCardNo: e.target.value})}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={t('Email (Optional)')}
                        value={customer.email}
                        onChange={(e) => setCustomer({...customer, email: e.target.value})}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={t('Address')}
                        value={customer.address}
                        onChange={(e) => setCustomer({...customer, address: e.target.value})}
                      />
                      <button
                        className="btn btn-secondary w-full"
                        onClick={() => handleImageCapture('idImage', 'customer')}
                      >
                        📷 {customer.idImage ? t('ID Captured ✓') : t('Capture ID')}
                      </button>

                      <h4 className="font-semibold text-gray-900 mt-6">{t('Witness Details')}</h4>
                      <input
                        type="text"
                        className="input"
                        placeholder={t('Witness Name')}
                        value={witness.name}
                        onChange={(e) => setWitness({...witness, name: e.target.value})}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={t('Witness Phone')}
                        value={witness.phone}
                        onChange={(e) => setWitness({...witness, phone: e.target.value})}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={t('Witness ID')}
                        value={witness.idCardNo}
                        onChange={(e) => setWitness({...witness, idCardNo: e.target.value})}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={t('Witness Address')}
                        value={witness.address}
                        onChange={(e) => setWitness({...witness, address: e.target.value})}
                      />
                      <button
                        className="btn btn-secondary w-full"
                        onClick={() => handleImageCapture('idImage', 'witness')}
                      >
                        📷 {witness.idImage ? t('ID Captured ✓') : t('Capture ID')}
                      </button>

                      <h4 className="font-semibold text-gray-900 mt-6">{t('Payment Terms')}</h4>
                      <input
                        type="number"
                        className="input"
                        placeholder={t('Down Payment')}
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                      />
                      <select
                        className="input"
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
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>{t('Total')}:</span>
                              <span className="font-medium">${calculateInstallmentPreview().total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('Down Payment')}:</span>
                              <span className="font-medium">${calculateInstallmentPreview().downPayment}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('Remaining')}:</span>
                              <span className="font-medium">${calculateInstallmentPreview().remaining}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('Interest')} ({calculateInstallmentPreview().interestRate}%):</span>
                              <span className="font-medium">${calculateInstallmentPreview().interestAmount}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t border-blue-300 pt-2">
                              <span>{t('Total with Interest')}:</span>
                              <span>${calculateInstallmentPreview().totalWithInterest}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>{t('Monthly Payment')}:</span>
                              <span>${calculateInstallmentPreview().monthlyPayment}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bill Summary Panel */}
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🛒</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('Current Bill')}</h3>
                  </div>

                  <div className="flex-1 min-h-0 mb-4">
                    {bill.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🛒</div>
                        <p className="text-gray-500">{t('No items in bill')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {bill.map((item) => (
                          <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <button
                                className="text-red-500 hover:text-red-700 text-lg"
                                onClick={() => removeFromBill(item.id)}
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <button
                                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"
                                  onClick={() => decrementQuantity(item.id)}
                                  disabled={item.quantity <= 1}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <button
                                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"
                                  onClick={() => incrementQuantity(item.id)}
                                  disabled={item.quantity >= item.maxQuantity}
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-bold text-gray-900">${item.total.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t('Total')}:</span>
                      <span className="text-primary-600">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                      className="btn btn-primary w-full"
                      onClick={handleInstallmentSaleCheckout}
                      disabled={bill.length === 0 || processing}
                    >
                      {processing ? t('Processing...') : `📋 ${t('Create Installment Plan')}`}
                    </button>
                    <button
                      className="btn btn-ghost w-full"
                      onClick={clearBill}
                      disabled={bill.length === 0}
                    >
                      🗑️ {t('Clear Bill')}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Installment Payment Layout */}
      {mode === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('Select Installment Plan')}</h3>
            </div>

            <input
              type="text"
              className="input mb-4"
              placeholder={t('Search by customer name or NIC...')}
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
            />

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPlans.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {planSearch ? t('No matching plans found') : t('No active installment plans')}
                </p>
              ) : (
                filteredPlans.map(plan => (
                  <div
                    key={plan.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedPlan?.id === plan.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="font-medium text-gray-900 mb-1">{plan.customer_name}</div>
                    {plan.customer_id_card && (
                      <div className="text-sm text-gray-600 mb-2">NIC: {plan.customer_id_card}</div>
                    )}
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{t('Total')}: ${plan.total_with_interest}</div>
                      <div>{t('Paid')}: ${plan.paid_amount}</div>
                    </div>
                    <div className="text-sm font-medium text-orange-600 mt-2">
                      {t('Remaining')}: ${(plan.total_with_interest - plan.paid_amount).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">💳</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('Record Payment')}</h3>
            </div>

            {!selectedPlan ? (
              <p className="text-gray-500 text-center py-8">{t('Select a plan to record payment')}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Plan Details')}</label>
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <p><strong>{t('Customer')}:</strong> {selectedPlan.customer_name}</p>
                    {selectedPlan.customer_id_card && (
                      <p><strong>{t('NIC')}:</strong> {selectedPlan.customer_id_card}</p>
                    )}
                    <p><strong>{t('Monthly Payment')}:</strong> ${selectedPlan.monthly_payment}</p>
                    <p><strong>{t('Remaining')}:</strong> ${(selectedPlan.total_with_interest - selectedPlan.paid_amount).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Payment Amount')}</label>
                  <input
                    type="number"
                    className="input"
                    placeholder={t('Enter amount')}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Notes (Optional)')}</label>
                  <textarea
                    className="input"
                    placeholder={t('Payment notes...')}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows="3"
                  />
                </div>

                <button
                  className="btn btn-primary w-full"
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
