import React, { useRef } from 'react';
import ProductThumbnail from './ProductThumbnail';
import './ProductThumbnail.css';

const ProductImageField = ({
  imagePreview,
  categoryId,
  categories,
  onSelect,
  onRemove,
}) => {
  const fileInputRef = useRef(null);

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onSelect(null, 'Please select a valid image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onSelect(null, 'Image must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onSelect(reader.result, null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove();
  };

  return (
    <>
      <label className="form-label fw-semibold">Product Image</label>
      <input
        ref={fileInputRef}
        type="file"
        className="d-none"
        accept="image/*"
        onChange={handleChange}
      />
      {imagePreview ? (
        <div className="product-form-image-selected">
          <button
            type="button"
            className="product-form-image-display-btn"
            onClick={openPicker}
            title="Change image"
          >
            <img src={imagePreview} alt="Selected product" className="product-form-image-display" />
          </button>
          <div className="product-form-image-meta">
            <span className="text-muted small">Image attached</span>
            <div className="product-form-image-actions">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={openPicker}>
                Change
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleRemove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" className="product-form-image-empty" onClick={openPicker}>
          <ProductThumbnail
            item={{
              category_icon: categories.find((c) => String(c.id) === String(categoryId))?.icon,
              category_id: categoryId,
            }}
            categories={categories}
            size={32}
          />
          <span className="product-form-image-empty-text">Choose image</span>
        </button>
      )}
      <div className="form-text mb-0 mt-1">Optional. Max 2MB. Category icon is used if no image.</div>
    </>
  );
};

export default ProductImageField;
