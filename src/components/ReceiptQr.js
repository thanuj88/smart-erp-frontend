import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const ReceiptQr = ({ value, size = 108 }) => {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(String(value || ''), {
      width: size * 2,
      margin: 0,
      color: { dark: '#111111', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) {
    return <div className="receipt-qr" style={{ width: size, height: size }} />;
  }

  return (
    <div className="receipt-qr">
      <img src={src} alt="" width={size} height={size} />
    </div>
  );
};

export default ReceiptQr;
