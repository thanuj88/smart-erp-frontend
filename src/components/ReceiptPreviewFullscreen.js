import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReceiptPreview from './ReceiptPreview';

const ReceiptPreviewFullscreen = ({ onClose, ...previewProps }) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="receipt-preview-fullscreen" role="dialog" aria-modal="true" aria-label="Receipt preview">
      <div className="receipt-preview-fullscreen-bar">
        <div className="receipt-preview-fullscreen-title">Receipt preview</div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onClose}
          aria-label="Close full screen preview"
        >
          <i className="bi bi-fullscreen-exit me-1"></i>
          Close
        </button>
      </div>
      <div className="receipt-preview-fullscreen-body">
        <ReceiptPreview {...previewProps} />
      </div>
    </div>,
    document.body
  );
};

export default ReceiptPreviewFullscreen;
