import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { settingsService } from '../services';
import {
  currencyFromSettings,
  currencyFromUser,
  DEFAULT_CURRENCY,
  formatMoney as formatMoneyUtil,
} from '../utils/currency';
import { APP_NAME, getPageTitle, resolveBusinessName } from '../config/app';

const TenantSettingsContext = createContext(null);

export const useTenantSettings = () => {
  const ctx = useContext(TenantSettingsContext);
  if (!ctx) {
    throw new Error('useTenantSettings must be used within TenantSettingsProvider');
  }
  return ctx;
};

/** Safe when provider is optional — falls back to user profile currency */
export const useCurrency = () => {
  const ctx = useContext(TenantSettingsContext);
  const { user } = useAuth();

  const currency = ctx?.currency || currencyFromUser(user) || DEFAULT_CURRENCY;
  const formatMoney = useCallback(
    (amount) => formatMoneyUtil(amount, currency),
    [currency]
  );

  return {
    currency,
    symbol: currency.symbol,
    formatMoney,
    settings: ctx?.settings ?? user?.tenantSettings ?? null,
    loading: ctx?.loading ?? false,
    reloadSettings: ctx?.reloadSettings ?? (() => Promise.resolve()),
  };
};

/** Store display name from Settings, with product name as fallback */
export const useBusinessName = () => {
  const ctx = useContext(TenantSettingsContext);
  const { user, isSuperAdmin } = useAuth();
  if (isSuperAdmin) return APP_NAME;
  return resolveBusinessName(ctx?.settings || user?.tenantSettings);
};

export const TenantSettingsProvider = ({ children }) => {
  const { user, isAuthenticated, isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated || !user?.tenantId) {
      setSettings(user?.tenantSettings ?? null);
      return;
    }
    setLoading(true);
    try {
      const data = await settingsService.get();
      setSettings(data);
    } catch {
      setSettings(user?.tenantSettings ?? null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.tenantId, user?.tenantSettings]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const storeName = isSuperAdmin ? APP_NAME : resolveBusinessName(settings || user?.tenantSettings);
    document.title = getPageTitle(undefined, storeName);
  }, [isSuperAdmin, settings, user?.tenantSettings]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && user?.tenantId) {
        load();
      }
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load, user?.tenantId]);

  const currency = useMemo(
    () => (settings ? currencyFromSettings(settings) : currencyFromUser(user)),
    [settings, user]
  );

  const formatMoney = useCallback(
    (amount) => formatMoneyUtil(amount, currency),
    [currency]
  );

  const value = useMemo(
    () => ({
      settings,
      loading,
      currency,
      symbol: currency.symbol,
      formatMoney,
      reloadSettings: load,
      setSettings,
    }),
    [settings, loading, currency, formatMoney, load]
  );

  return (
    <TenantSettingsContext.Provider value={value}>{children}</TenantSettingsContext.Provider>
  );
};
