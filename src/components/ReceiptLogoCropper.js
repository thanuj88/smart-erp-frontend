import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  clampCropOffset,
  cropLogoToSquare,
  zoomFromLevel,
} from '../utils/receiptLogo';
import './ReceiptLogoCropper.css';

const LEVEL_MIN = -5;
const LEVEL_MAX = 8;

const formatLevel = (level) => {
  if (level === 0) return '0';
  return level > 0 ? `+${level}` : String(level);
};

const ReceiptLogoCropper = ({ src, onApply, onCancel, onError }) => {
  const imageRef = useRef(null);
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [level, setLevel] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [applying, setApplying] = useState(false);

  const zoom = size.w && size.h ? zoomFromLevel(level, size.w, size.h) : 1;

  const setClampedOffset = useCallback(
    (x, y, nextZoom = zoom) => {
      const next = clampCropOffset(x, y, nextZoom, size.w, size.h);
      offsetRef.current = next;
      setOffset(next);
    },
    [size.h, size.w, zoom]
  );

  const handleImageLoad = (e) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setSize({ w, h });
    setLevel(0);
    offsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
    setReady(true);
  };

  useEffect(() => {
    const img = imageRef.current;
    if (img?.complete && img.naturalWidth) {
      handleImageLoad({ currentTarget: img });
    }
  }, [src]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      e.preventDefault();
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      setClampedOffset(dragRef.current.ox + dx, dragRef.current.oy + dy);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [setClampedOffset]);

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    };
  };

  const changeLevel = (nextLevel) => {
    const bounded = Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, nextLevel));
    const nextZoom = zoomFromLevel(bounded, size.w, size.h);
    setLevel(bounded);
    setClampedOffset(offsetRef.current.x, offsetRef.current.y, nextZoom);
  };

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;
    const onWheelNative = (e) => {
      e.preventDefault();
      changeLevel(level + (e.deltaY > 0 ? -1 : 1));
    };
    node.addEventListener('wheel', onWheelNative, { passive: false });
    return () => node.removeEventListener('wheel', onWheelNative);
  }, [level, size.h, size.w]);

  const handleApply = () => {
    const image = imageRef.current;
    if (!image) return;
    setApplying(true);
    try {
      const dataUrl = cropLogoToSquare(image, {
        zoom,
        offsetX: offset.x,
        offsetY: offset.y,
      });
      onApply(dataUrl);
    } catch {
      setApplying(false);
      onError?.('Could not crop this image. Try uploading it again.');
    }
  };

  const imageStyle = {
    width: size.w,
    height: size.h,
    marginLeft: -size.w / 2,
    marginTop: -size.h / 2,
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
  };

  const dialog = (
    <div className="logo-crop-overlay" onClick={onCancel} role="presentation">
      <div
        className="logo-crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logo-crop-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="logo-crop-title" className="logo-crop-title">
          Adjust logo
        </h2>
        <p className="logo-crop-help">Drag to move · Use − / + to zoom</p>

        <div
          ref={viewportRef}
          className="logo-crop-viewport"
          onPointerDown={onPointerDown}
        >
          {src ? (
            <img
              ref={imageRef}
              src={src}
              alt=""
              className="logo-crop-image"
              style={ready ? imageStyle : { opacity: 0 }}
              onLoad={handleImageLoad}
              crossOrigin={src.startsWith('data:') ? undefined : 'anonymous'}
              draggable={false}
            />
          ) : null}
          <div className="logo-crop-mask" aria-hidden="true" />
        </div>

        <div className="logo-crop-zoom">
          <button
            type="button"
            className="logo-crop-zoom-btn"
            onClick={() => changeLevel(level - 1)}
            disabled={!ready || level <= LEVEL_MIN}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="logo-crop-zoom-value" aria-live="polite">
            {formatLevel(level)}
          </span>
          <button
            type="button"
            className="logo-crop-zoom-btn"
            onClick={() => changeLevel(level + 1)}
            disabled={!ready || level >= LEVEL_MAX}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <div className="logo-crop-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!ready || applying}
          >
            {applying ? 'Applying…' : 'Use logo'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

export default ReceiptLogoCropper;
