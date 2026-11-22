import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services';

const TillPinGate = ({ children }) => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const needsPin = String(user?.role || '').toUpperCase() === 'TENANT_ADMIN' && user?.hasPin === false;
  if (!needsPin) return children;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (pin !== confirm) {
      setError(t('pinMismatch'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await authService.setPin(pin);
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('pinHelp'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="till-lock">
      <form className="till-lock-card" onSubmit={onSubmit}>
        <h1 className="till-lock-title">{t('tillLocked')}</h1>
        <p className="till-lock-lead">{t('addTenantPin')}</p>
        <label className="form-label" htmlFor="tenant-pin">
          {t('posPin')}
        </label>
        <input
          id="tenant-pin"
          className="form-control"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
          required
        />
        <label className="form-label mt-3" htmlFor="tenant-pin-confirm">
          {t('confirmPin')}
        </label>
        <input
          id="tenant-pin-confirm"
          className="form-control"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
          required
        />
        <div className="form-text">{t('pinHelp')}</div>
        {error ? <div className="text-danger small mt-2">{error}</div> : null}
        <button type="submit" className="btn btn-primary mt-3" disabled={saving || pin.length < 6}>
          {saving ? t('saving') : t('savePin')}
        </button>
      </form>
    </div>
  );
};

TillPinGate.propTypes = {
  children: PropTypes.node,
};

export default TillPinGate;
