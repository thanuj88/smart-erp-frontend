import React, { useState, useEffect } from 'react';
import { itemService, saleService } from '../services';
import Navbar from '../components/Navbar';

const SellItems = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await itemService.getAvailable();
      setItems(data);
    } catch (error) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setProcessing(true);

    try {
      await saleService.processSale(parseInt(selectedItem), parseInt(quantity));
      setSuccess('Sale processed successfully!');
      setSelectedItem('');
      setQuantity(1);
      loadItems(); // Reload items to update available quantities
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to process sale');
    } finally {
      setProcessing(false);
    }
  };

  const getSelectedItemDetails = () => {
    return items.find((item) => item.id === parseInt(selectedItem));
  };

  const calculateTotal = () => {
    const item = getSelectedItemDetails();
    if (item) {
      return (item.price * quantity).toFixed(2);
    }
    return '0.00';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading items...</p>
        </div>
      </>
    );
  }

  const selectedItemDetails = getSelectedItemDetails();

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 className="card-title">Process Sale</h1>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="grid-2">
          <div className="card">
            <h2 className="card-title">Sale Form</h2>
            {items.length === 0 ? (
              <p style={{ color: '#7f8c8d' }}>No items available for sale.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Item *</label>
                  <select
                    className="form-select"
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    required
                  >
                    <option value="">-- Choose an item --</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - ${item.price.toFixed(2)} (Stock: {item.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedItemDetails && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Quantity *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        max={selectedItemDetails.quantity}
                        required
                      />
                      <small style={{ color: '#7f8c8d' }}>
                        Available: {selectedItemDetails.quantity}
                      </small>
                    </div>

                    <div className="alert alert-info">
                      <strong>Total:</strong> ${calculateTotal()}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ width: '100%' }}
                  disabled={!selectedItem || processing}
                >
                  {processing ? 'Processing...' : 'Process Sale'}
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Available Items</h2>
            {items.length === 0 ? (
              <p style={{ color: '#7f8c8d' }}>No items available.</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #ecf0f1',
                      cursor: 'pointer',
                      backgroundColor: selectedItem == item.id ? '#f0f8ff' : 'transparent',
                    }}
                    onClick={() => setSelectedItem(item.id.toString())}
                  >
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                      {item.description}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                        ${item.price.toFixed(2)}
                      </span>
                      {' | '}
                      <span style={{ color: item.quantity < 10 ? '#e74c3c' : '#7f8c8d' }}>
                        Stock: {item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SellItems;
