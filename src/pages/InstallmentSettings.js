import React, { useState, useEffect } from 'react';
import { installmentSettingsService } from '../services';

const InstallmentSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    3: '',
    6: '',
    12: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await installmentSettingsService.getAll();
      setSettings(data);
      
      const settingsMap = {};
      data.forEach((setting) => {
        settingsMap[setting.months] = setting.interest_rate;
      });
      setFormData(settingsMap);
    } catch (error) {
      setError('Failed to load installment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (months, value) => {
    setFormData({
      ...formData,
      [months]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const settingsArray = Object.entries(formData).map(([months, rate]) => ({
        months: parseInt(months),
        interestRate: parseFloat(rate),
      }));

      await installmentSettingsService.update(settingsArray);
      setSuccess('Interest rates updated successfully');
      await loadSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="card-title mb-3">Installment Settings</h1>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#2c3e50' }}>
            Interest Rate Configuration
          </h2>
          <p style={{ color: '#7f8c8d', marginBottom: '1.5rem' }}>
            Configure the interest rates for different installment durations. These rates will be
            applied to calculate monthly payments for customers.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">3 Months Interest Rate (%)</label>
              <input
                type="number"
                className="form-input"
                value={formData[3]}
                onChange={(e) => handleInputChange(3, e.target.value)}
                step="0.1"
                min="0"
                max="100"
                required
              />
              <small style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
                Current rate: {formData[3]}% - Applied to 3-month installment plans
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">6 Months Interest Rate (%)</label>
              <input
                type="number"
                className="form-input"
                value={formData[6]}
                onChange={(e) => handleInputChange(6, e.target.value)}
                step="0.1"
                min="0"
                max="100"
                required
              />
              <small style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
                Current rate: {formData[6]}% - Applied to 6-month installment plans
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">12 Months Interest Rate (%)</label>
              <input
                type="number"
                className="form-input"
                value={formData[12]}
                onChange={(e) => handleInputChange(12, e.target.value)}
                step="0.1"
                min="0"
                max="100"
                required
              />
              <small style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
                Current rate: {formData[12]}% - Applied to 12-month installment plans
              </small>
            </div>

            <div className="flex flex-gap">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ flex: 1 }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={loadSettings}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2c3e50' }}>
            Interest Rate Calculation Example
          </h3>
          <div style={{ color: '#7f8c8d' }}>
            <p><strong>Example:</strong> Item price = $1000, Down payment = $200</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Remaining amount = $800</li>
              <li>With 3 months ({formData[3]}%): Interest = ${(800 * formData[3] / 100).toFixed(2)}, Total = ${(800 + 800 * formData[3] / 100).toFixed(2)}, Monthly = ${((800 + 800 * formData[3] / 100) / 3).toFixed(2)}</li>
              <li>With 6 months ({formData[6]}%): Interest = ${(800 * formData[6] / 100).toFixed(2)}, Total = ${(800 + 800 * formData[6] / 100).toFixed(2)}, Monthly = ${((800 + 800 * formData[6] / 100) / 6).toFixed(2)}</li>
              <li>With 12 months ({formData[12]}%): Interest = ${(800 * formData[12] / 100).toFixed(2)}, Total = ${(800 + 800 * formData[12] / 100).toFixed(2)}, Monthly = ${((800 + 800 * formData[12] / 100) / 12).toFixed(2)}</li>
            </ul>
          </div>
        </div>
    </>
  );
};

export default InstallmentSettings;
