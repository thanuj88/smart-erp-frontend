import React from 'react';
import * as BsIcons from 'react-icons/bs';
import { DEFAULT_CATEGORY_ICON, isBsIconName } from '../config/categoryIcons';

/**
 * Renders a stored Bootstrap icon key (e.g. "BsPhone") from react-icons/bs.
 */
const CategoryIcon = ({ name, className, size, title }) => {
  const iconName = isBsIconName(name) ? name : DEFAULT_CATEGORY_ICON;
  const Icon = BsIcons[iconName] || BsIcons[DEFAULT_CATEGORY_ICON];

  return <Icon className={className} size={size} title={title} aria-hidden={title ? undefined : true} />;
};

export default CategoryIcon;
