import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

const LeaveSaleDialog = ({
  title,
  message,
  stayLabel,
  holdLabel,
  voidLabel,
  onStay,
  onHold,
  onVoid,
}) => {
  const stayRef = useRef(null);
  const onStayRef = useRef(onStay);
  onStayRef.current = onStay;

  useEffect(() => {
    const previous = document.activeElement;
    stayRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onStayRef.current?.();
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
  }, []);

  const dialog = (
    <div className="app-confirm-overlay" onClick={onStay} role="presentation">
      <div
        className="app-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-sale-title"
        aria-describedby="leave-sale-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="leave-sale-title" className="app-confirm-title">
          {title}
        </h2>
        {message ? (
          <p id="leave-sale-message" className="app-confirm-message">
            {message}
          </p>
        ) : null}
        <div className="app-confirm-actions app-confirm-actions--leave">
          <button
            ref={stayRef}
            type="button"
            className="app-confirm-btn app-confirm-btn--cancel"
            onClick={onStay}
          >
            {stayLabel}
          </button>
          <button type="button" className="app-confirm-btn app-confirm-btn--primary" onClick={onHold}>
            {holdLabel}
          </button>
          <button type="button" className="app-confirm-btn app-confirm-btn--danger" onClick={onVoid}>
            {voidLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

export default LeaveSaleDialog;
