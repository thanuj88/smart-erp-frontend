export const RECEIPT_LOGO = {
  types: ['image/png', 'image/jpeg', 'image/webp'],
  accept: 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp',
  maxBytes: 8 * 1024 * 1024,
  minPx: 200,
  maxPx: 4000,
  outputPx: 600,
};

export const RECEIPT_LOGO_HINT =
  'PNG, JPG or WebP. Crop after upload. At least 200px, max 8MB.';

export const CROP_FRAME = 280;

function resetInput(input) {
  if (input) input.value = '';
}

export function validateReceiptLogoFile(file, input) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Please choose a logo image.'));
      return;
    }

    if (!RECEIPT_LOGO.types.includes(file.type)) {
      resetInput(input);
      reject(new Error('Use PNG, JPG or WebP.'));
      return;
    }

    if (file.size > RECEIPT_LOGO.maxBytes) {
      resetInput(input);
      reject(new Error('Image must be 8MB or smaller.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = image;
      if (width < RECEIPT_LOGO.minPx || height < RECEIPT_LOGO.minPx) {
        resetInput(input);
        reject(new Error(`Image must be at least ${RECEIPT_LOGO.minPx}×${RECEIPT_LOGO.minPx} pixels.`));
        return;
      }
      if (width > RECEIPT_LOGO.maxPx || height > RECEIPT_LOGO.maxPx) {
        resetInput(input);
        reject(new Error(`Image must be ${RECEIPT_LOGO.maxPx}px or smaller on each side.`));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => {
        resetInput(input);
        reject(new Error('Could not read the logo file.'));
      };
      reader.readAsDataURL(file);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resetInput(input);
      reject(new Error('The file could not be opened as an image.'));
    };
    image.src = objectUrl;
  });
}

export function minCoverZoom(imgW, imgH, frame = CROP_FRAME) {
  return frame / Math.min(imgW, imgH);
}

export function fitZoom(imgW, imgH, frame = CROP_FRAME) {
  return (frame / Math.max(imgW, imgH)) * 0.88;
}

export function zoomFromLevel(level, imgW, imgH, frame = CROP_FRAME) {
  const base = fitZoom(imgW, imgH, frame);
  return base * 1.12 ** level;
}

export function clampCropOffset(offsetX, offsetY, zoom, imgW, imgH, frame = CROP_FRAME) {
  const limit = (scaled) => Math.abs(scaled - frame) / 2;
  const maxX = limit(imgW * zoom);
  const maxY = limit(imgH * zoom);
  return {
    x: Math.min(maxX, Math.max(-maxX, offsetX)),
    y: Math.min(maxY, Math.max(-maxY, offsetY)),
  };
}

export function cropLogoToSquare(image, { zoom, offsetX, offsetY, frame = CROP_FRAME, output = RECEIPT_LOGO.outputPx }) {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const imageLeft = frame / 2 - (w * zoom) / 2 + offsetX;
  const imageTop = frame / 2 - (h * zoom) / 2 + offsetY;
  const sourceSize = frame / zoom;
  const sourceX = -imageLeft / zoom;
  const sourceY = -imageTop / zoom;

  const canvas = document.createElement('canvas');
  canvas.width = output;
  canvas.height = output;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, output, output);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, output, output);
  return canvas.toDataURL('image/png');
}
