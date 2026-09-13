export function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(dateStr, days) {
  const [year, month, day] = String(dateStr).split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + days);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function promotionStatus(promo, today = localToday()) {
  if (!promo || promo.active === false) return 'inactive';
  const start = String(promo.start_date || '');
  const end = String(promo.end_date || '');
  if (start && today < start) return 'scheduled';
  if (end && today > end) return 'expired';
  return 'active';
}

export function promotionMatchesItem(promo, item) {
  if (!promo) return false;
  const applies = promo.applies_to || 'all';
  if (applies === 'all') return true;
  const itemId = String(item?.id ?? '');
  const categoryId = String(item?.category_id ?? '');
  if (applies === 'items') {
    return (promo.item_ids || []).map(String).includes(itemId);
  }
  if (applies === 'categories') {
    return (promo.category_ids || []).map(String).includes(categoryId);
  }
  return false;
}

const SPECIFICITY = { items: 3, categories: 2, all: 1 };

export function getBestPromotion(item, promotions = []) {
  const matches = (promotions || []).filter((promo) => promotionMatchesItem(promo, item));
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => {
    const byPercent = Number(b.percent || 0) - Number(a.percent || 0);
    if (byPercent !== 0) return byPercent;
    return (SPECIFICITY[b.applies_to] || 0) - (SPECIFICITY[a.applies_to] || 0);
  })[0];
}

export function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function applyPromotionPrice(item, promotions = []) {
  const listPrice = Number(item?.selling_price ?? item?.price ?? 0);
  const promotion = getBestPromotion(item, promotions);
  if (!promotion) {
    return { listPrice, price: listPrice, promotion: null };
  }
  const price = roundMoney(listPrice * (1 - Number(promotion.percent || 0) / 100));
  return { listPrice, price, promotion };
}
