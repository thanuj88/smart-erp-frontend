import React from 'react';
import CategoryIcon from './CategoryIcon';
import { resolveCategoryIconKey } from '../config/categoryIcons';
import { resolveProductImageUrl } from '../utils/productImage';
import './ProductThumbnail.css';

/**
 * Product image when available; otherwise the category icon.
 */
const ProductThumbnail = ({
  item,
  categories = [],
  size = 32,
  className = '',
  imgClassName = 'product-thumbnail-img',
  alt,
}) => {
  const src = resolveProductImageUrl(item?.image_path || item?.imagePath);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || item?.name || 'Product'}
        className={imgClassName}
        width={size}
        height={size}
        loading="lazy"
      />
    );
  }

  const iconName = resolveCategoryIconKey(item?.category_icon, categories, item?.category_id);
  return <CategoryIcon name={iconName} size={size} className={className} />;
};

export default ProductThumbnail;
