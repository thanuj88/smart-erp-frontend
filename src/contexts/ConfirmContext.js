import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

const ConfirmContext = createContext(null);

function normalizeOptions(options, defaults) {
  if (typeof options === 'string') {
    return { ...defaults, message: options };
  }
  return { ...defaults, ...(options || {}) };
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const close = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback((options) => {
    if (resolverRef.current) resolverRef.current(false);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog(
        normalizeOptions(options, {
          type: 'confirm',
          title: 'Please confirm',
          confirmLabel: 'OK',
          cancelLabel: 'Cancel',
          variant: 'primary',
        })
      );
    });
  }, []);

  const alert = useCallback((options) => {
    if (resolverRef.current) resolverRef.current(false);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog(
        normalizeOptions(options, {
          type: 'alert',
          title: 'Notice',
          confirmLabel: 'OK',
          variant: 'primary',
        })
      );
    });
  }, []);

  const handleConfirm = useCallback(() => close(true), [close]);
  const handleCancel = useCallback(() => close(false), [close]);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && (
        <ConfirmDialog
          {...dialog}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}
