export const DASHBOARD_WIDGETS = [
  { id: 'cashRevenue', labelKey: 'widgetCashRevenue', groupKey: 'widgetGroupMetrics', salesOnly: true },
  { id: 'installmentIn', labelKey: 'widgetInstallmentIn', groupKey: 'widgetGroupMetrics', salesOnly: true },
  { id: 'actualIncome', labelKey: 'widgetActualIncome', groupKey: 'widgetGroupMetrics', salesOnly: true },
  { id: 'cashProfit', labelKey: 'widgetCashProfit', groupKey: 'widgetGroupMetrics', adminOnly: true },
  { id: 'salesChart', labelKey: 'widgetSalesChart', groupKey: 'widgetGroupCharts', salesOnly: true },
  { id: 'categoryMix', labelKey: 'widgetCategoryMix', groupKey: 'widgetGroupCharts', salesOnly: true },
  { id: 'overduePlans', labelKey: 'widgetOverduePlans', groupKey: 'widgetGroupCollections', salesOnly: true },
  { id: 'lowStockBanner', labelKey: 'widgetLowStockBanner', groupKey: 'widgetGroupInventory' },
  { id: 'outOfStock', labelKey: 'widgetOutOfStock', groupKey: 'widgetGroupInventory' },
  { id: 'deadStock', labelKey: 'widgetDeadStock', groupKey: 'widgetGroupInventory', salesOnly: true },
  { id: 'lowStock', labelKey: 'widgetLowStock', groupKey: 'widgetGroupInventory' },
  { id: 'topProducts', labelKey: 'widgetTopProducts', groupKey: 'widgetGroupInventory', salesOnly: true },
];

export const DEFAULT_DASHBOARD_WIDGETS = DASHBOARD_WIDGETS.reduce((acc, widget) => {
  acc[widget.id] = true;
  return acc;
}, {});

export const DEAD_STOCK_DAYS = 90;

export function resolveDashboardWidgets(raw) {
  const next = { ...DEFAULT_DASHBOARD_WIDGETS };
  if (!raw || typeof raw !== 'object') return next;
  DASHBOARD_WIDGETS.forEach(({ id }) => {
    if (raw[id] === false) next[id] = false;
    if (raw[id] === true) next[id] = true;
  });
  return next;
}

export function isDashboardWidgetVisible(id, widgets, access = {}) {
  const isAdmin = !!access.isAdmin;
  const canSeeSales = !!access.canSeeSales || isAdmin;
  const widget = DASHBOARD_WIDGETS.find((item) => item.id === id);
  if (widget?.adminOnly && !isAdmin) return false;
  if (widget?.salesOnly && !canSeeSales) return false;
  return widgets?.[id] !== false;
}
