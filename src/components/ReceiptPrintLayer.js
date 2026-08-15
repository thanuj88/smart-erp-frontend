import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReceiptPreview from './ReceiptPreview';

function waitForAssets(root, timeoutMs = 2500) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (!root) {
        resolve();
        return;
      }
      const images = [...root.querySelectorAll('img')];
      const pending = images.filter((img) => !img.complete || img.naturalWidth === 0);
      if (pending.length === 0 || Date.now() - started > timeoutMs) {
        resolve();
        return;
      }
      window.setTimeout(tick, 80);
    };
    window.setTimeout(tick, 50);
  });
}

const ReceiptPrintLayer = ({ job, onDone }) => {
  const rootRef = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!job) return undefined;
    let cancelled = false;
    const pageStyle = document.createElement('style');
    pageStyle.setAttribute('data-receipt-print', 'true');
    pageStyle.textContent = `@media print { @page { margin: 0; size: ${job.pageSize || '80mm auto'}; } }`;
    document.head.appendChild(pageStyle);

    const run = async () => {
      await waitForAssets(rootRef.current);
      if (cancelled) return;
      let finished = false;
      const finish = () => {
        if (finished || cancelled) return;
        finished = true;
        window.removeEventListener('afterprint', finish);
        onDoneRef.current?.();
      };
      window.addEventListener('afterprint', finish);
      window.print();
      window.setTimeout(finish, 20000);
    };
    run();

    return () => {
      cancelled = true;
      pageStyle.remove();
    };
  }, [job]);

  if (!job) return null;

  return createPortal(
    <div id="receipt-print-root" className="receipt-print-root" ref={rootRef}>
      <ReceiptPreview {...job.preview} />
    </div>,
    document.body
  );
};

export default ReceiptPrintLayer;
