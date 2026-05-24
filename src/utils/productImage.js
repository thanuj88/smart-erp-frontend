const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/** Resolve stored product image path to a full URL for <img src>. */
export function resolveProductImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return null;
  if (imagePath.startsWith('data:') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_ORIGIN}${path}`;
}
