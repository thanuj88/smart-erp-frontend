import React from 'react';
import * as BsIcons from 'react-icons/bs';
import * as MdIcons from 'react-icons/md';
import { DEFAULT_CATEGORY_ICON, isCategoryIconName } from '../config/categoryIcons';

const ICON_PACKS = {
  Bs: BsIcons,
  Md: MdIcons,
};

function getIconComponent(name) {
  if (!isCategoryIconName(name)) return BsIcons[DEFAULT_CATEGORY_ICON];
  const pack = ICON_PACKS[name.slice(0, 2)];
  return pack?.[name] || BsIcons[DEFAULT_CATEGORY_ICON];
}

/**
 * Renders a stored icon key (e.g. "BsPhone", "MdChair") from react-icons.
 */
const CategoryIcon = ({ name, className, size, title }) => {
  const Icon = getIconComponent(name);

  return <Icon className={className} size={size} title={title} aria-hidden={title ? undefined : true} />;
};

export default CategoryIcon;
