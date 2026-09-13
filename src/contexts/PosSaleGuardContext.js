import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LeaveSaleDialog from '../components/LeaveSaleDialog';

const PosSaleGuardContext = createContext(null);

export function PosSaleGuardProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const handlersRef = useRef(null);
  const pendingRef = useRef(null);
  const [prompt, setPrompt] = useState(null);

  const setSaleGuard = useCallback((handlers) => {
    handlersRef.current = handlers;
    return () => {
      if (handlersRef.current === handlers) handlersRef.current = null;
    };
  }, []);

  const hasOpenSale = useCallback(() => Boolean(handlersRef.current?.hasOpenSale?.()), []);

  const requestNavigation = useCallback(
    (to, options) => {
      if (!to || to === location.pathname) return true;
      if (!hasOpenSale()) return true;
      pendingRef.current = { type: 'navigate', to, options };
      setPrompt({ type: 'navigate' });
      return false;
    },
    [hasOpenSale, location.pathname]
  );

  const requestLogout = useCallback(
    (doLogout) => {
      if (!hasOpenSale()) return true;
      pendingRef.current = { type: 'logout', doLogout };
      setPrompt({ type: 'logout' });
      return false;
    },
    [hasOpenSale]
  );

  const finishLeave = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setPrompt(null);
    if (pending?.type === 'logout') {
      pending.doLogout?.();
      return;
    }
    if (pending?.type === 'navigate' && pending.to) {
      navigate(pending.to, pending.options);
    }
  }, [navigate]);

  const stay = useCallback(() => {
    pendingRef.current = null;
    setPrompt(null);
  }, []);

  const holdAndLeave = useCallback(() => {
    handlersRef.current?.hold?.();
    finishLeave();
  }, [finishLeave]);

  const voidAndLeave = useCallback(() => {
    handlersRef.current?.voidSale?.();
    finishLeave();
  }, [finishLeave]);

  return (
    <PosSaleGuardContext.Provider value={{ setSaleGuard, requestNavigation, requestLogout, hasOpenSale }}>
      {children}
      {prompt && (
        <LeaveSaleDialog
          title={t('unfinishedSaleTitle')}
          message={
            prompt.type === 'logout'
              ? t('unfinishedSaleLogoutMessage')
              : t('unfinishedSaleMessage')
          }
          stayLabel={t('stayOnRegister')}
          holdLabel={t('holdSale')}
          voidLabel={t('voidSale')}
          onStay={stay}
          onHold={holdAndLeave}
          onVoid={voidAndLeave}
        />
      )}
    </PosSaleGuardContext.Provider>
  );
}

export function usePosSaleGuard() {
  const ctx = useContext(PosSaleGuardContext);
  if (!ctx) {
    throw new Error('usePosSaleGuard must be used within PosSaleGuardProvider');
  }
  return ctx;
}
