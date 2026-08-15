import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

const VARIANTS = ['primary', 'danger', 'warning', 'success'];

const ConfirmDialog = ({
  type = 'confirm',
  title = 'Please confirm',
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef(null);
  const onConfirmRef = useRef(onConfirm);
  const onCancelRef = useRef(onCancel);
  onConfirmRef.current = onConfirm;
  onCancelRef.current = onCancel;

  const tone = VARIANTS.includes(variant) ? variant : 'primary';
  const isAlert = type === 'alert';

  useEffect(() => {
    const previous = document.activeElement;
    confirmRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        (isAlert ? onConfirmRef.current : onCancelRef.current)?.();
      }
      if (e.key === 'Enter' && e.target === confirmRef.current) {
        e.preventDefault();
        onConfirmRef.current?.();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previous && typeof previous.focus === 'function') previous.focus();
    };
  }, [isAlert]);

  const dialog = (
    <div
      className="app-confirm-overlay"
      onClick={() => (isAlert ? onConfirm : onCancel)?.()}
      role="presentation"
    >
      <div
        className="app-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-confirm-title"
        aria-describedby="app-confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="app-confirm-title" className="app-confirm-title">
          {title}
        </h2>
        {message ? (
          <p id="app-confirm-message" className="app-confirm-message">
            {message}
          </p>
        ) : null}
        <div className="app-confirm-actions">
          {!isAlert && (
            <button type="button" className="app-confirm-btn app-confirm-btn--cancel" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            className={`app-confirm-btn app-confirm-btn--${tone}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

export default ConfirmDialog;
