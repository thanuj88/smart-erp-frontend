import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService, categoryService, saleService } from '../services';
import './SellItems.css';

function SellItems() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bill, setBill] = useState([]);
  const [isBillCollapsed, setIsBillCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, itemsData] = await Promise.all([
        categoryService.getAll(),
        itemService.getAvailable(),
      ]);
      setCategories(categoriesData);
      setAllItems(itemsData);
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
      console.error('Error loading category items:', error);
      // Fallback to filtering from all items
      const filtered = allItems.filter(item => item.category_id === category.id);
      setItems(filtered);
    }
  };

  const addToBill = (item) => {
    const existingIndex = bill.findIndex(billItem => billItem.id === item.id);
    
    if (existingIndex !== -1) {
      // Item already in bill, increment quantity
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
      // Add new item to bill
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
    }
  };

  const calculateTotal = () => {
    return bill.reduce((sum, item) => sum + item.total, 0).toFixed(2);
  };

  const handleCheckout = async () => {
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

      // Process each item as a cash sale
      for (const item of bill) {
        await saleService.processCashSale(item.id, item.quantity);
      }

      setSuccess(t('Sale completed successfully!'));
      setBill([]);
      await loadData(); // Reload to update stock quantities
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.error || t('Failed to process sale'));
      console.error('Checkout error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>{t('Loading...')}</p>
      </div>
    );
  }

  return (
    <div className="sell-items-container">
      {/* Left Panel - Bill */}
      <div className={`bill-panel ${isBillCollapsed ? 'collapsed' : ''}`}>
        <div className="bill-header">
          <h3>{t('Current Bill')}</h3>
          <button
            className="toggle-bill-btn"
            onClick={() => setIsBillCollapsed(!isBillCollapsed)}
            title={isBillCollapsed ? t('Expand Bill') : t('Collapse Bill')}
          >
            {isBillCollapsed ? '▶️' : '◀️'}
          </button>
        </div>

        <div className="bill-content">
          {bill.length === 0 ? (
            <div className="empty-bill">
              <div className="empty-bill-icon">🛒</div>
              <p>{t('No items in bill')}</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {t('Select a category and add items')}
              </p>
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
                      title={t('Remove')}
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

        {!isBillCollapsed && (
          <div className="bill-summary">
            <div className="bill-total">
              <span className="bill-total-label">{t('Total')}:</span>
              <span className="bill-total-amount">${calculateTotal()}</span>
            </div>
            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={bill.length === 0 || processing}
            >
              {processing ? t('Processing...') : `💳 ${t('Complete Sale')}`}
            </button>
            <button
              className="clear-bill-btn"
              onClick={clearBill}
              disabled={bill.length === 0}
            >
              🗑️ {t('Clear Bill')}
            </button>
          </div>
        )}
      </div>

      {/* Center Panel - Categories */}
      <div className="categories-panel">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <h3>📂 {t('Select Category')}</h3>
        <div className="categories-grid-sell">
          {categories.length === 0 ? (
            <p style={{ color: 'var(--color-text-light)', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              {t('No categories available. Create categories first.')}
            </p>
          ) : (
categories.map((category) => (
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

      {/* Right Panel - Items */}
      <div className="items-panel">
        <div className="items-panel-header">
          <h3>
            {selectedCategory
              ? `${selectedCategory.icon || '📦'} ${selectedCategory.name}`
              : '📋 ' + t('Items')}
          </h3>
        </div>

        <div className="items-list">
          {!selectedCategory ? (
            <div className="empty-items">
              <div className="empty-items-icon">👈</div>
              <p>{t('Select a category to view items')}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-items">
              <div className="empty-items-icon">📭</div>
              <p>{t('No items in this category')}</p>
            </div>
          ) : (
            items.map((item) => (
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
    </div>
  );
}

export default SellItems;
