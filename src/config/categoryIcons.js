/**
 * Bootstrap Icons (react-icons/bs) for category picker.
 * @see https://react-icons.github.io/react-icons/icons/bs/
 */
export const DEFAULT_CATEGORY_ICON = 'BsBox';

export const CATEGORY_ICON_LIBRARY = [
  'BsPhone',
  'BsLaptop',
  'BsDisplay',
  'BsSmartwatch',
  'BsCamera',
  'BsCameraVideo',
  'BsController',
  'BsHeadphones',
  'BsMusicNote',
  'BsMusicNoteBeamed',
  'BsPalette',
  'BsPencil',
  'BsBook',
  'BsJournalText',
  'BsPinMap',
  'BsSearch',
  'BsKey',
  'BsTools',
  'BsHammer',
  'BsGear',
  'BsLightning',
  'BsFire',
  'BsLightbulb',
  'BsHeartPulse',
  'BsHospital',
  'BsShop',
  'BsShopWindow',
  'BsCart',
  'BsCart2',
  'BsCart3',
  'BsCart4',
  'BsBag',
  'BsHandbag',
  'BsEyeglasses',
  'BsWatch',
  'BsGem',
  'BsCup',
  'BsCupStraw',
  'BsEggFried',
  'BsCake2',
  'BsCookie',
  'BsBasket',
  'BsBalloon',
  'BsTrophy',
  'BsBicycle',
  'BsCarFront',
  'BsTruck',
  'BsAirplane',
  'BsHouse',
  'BsHouseDoor',
  'BsBuilding',
  'BsFlower1',
  'BsFlower2',
  'BsTree',
  'BsGlobe',
  'BsGift',
  'BsScissors',
  'BsPrinter',
  'BsUsbDrive',
  'BsHdd',
  'BsWifi',
  'BsBluetooth',
  'BsBatteryCharging',
  'BsPlug',
  'BsBrush',
  'BsEyedropper',
  'BsBox',
  'BsBoxSeam',
  'BsArchive',
  'BsTag',
  'BsTags',
  'BsStar',
  'BsHeart',
  'BsPerson',
  'BsPeople',
  'BsPersonBadge',
  'BsHeart',
  'BsEmojiSmile',
];

export function isBsIconName(value) {
  return typeof value === 'string' && /^Bs[A-Z]/.test(value);
}

export function resolveCategoryIconKey(stored, categories = [], categoryId = null) {
  if (isBsIconName(stored)) return stored;
  if (categoryId != null && categories.length) {
    const cat = categories.find((c) => String(c.id) === String(categoryId));
    if (cat?.icon && isBsIconName(cat.icon)) return cat.icon;
  }
  return DEFAULT_CATEGORY_ICON;
}
