export const DASHBOARD_WIDGETS = [
  { id: 'cashRevenue', labelKey: 'widgetCashRevenue', groupKey: 'widgetGroupMetrics' },
  { id: 'installmentIn', labelKey: 'widgetInstallmentIn', groupKey: 'widgetGroupMetrics' },
  { id: 'actualIncome', labelKey: 'widgetActualIncome', groupKey: 'widgetGroupMetrics' },
  { id: 'cashProfit', labelKey: 'widgetCashProfit', groupKey: 'widgetGroupMetrics', adminOnly: true },
  { id: 'salesChart', labelKey: 'widgetSalesChart', groupKey: 'widgetGroupCharts' },
  { id: 'categoryMix', labelKey: 'widgetCategoryMix', groupKey: 'widgetGroupCharts' },
  { id: 'overduePlans', labelKey: 'widgetOverduePlans', groupKey: 'widgetGroupCollections' },
  { id: 'lowStockBanner', labelKey: 'widgetLowStockBanner', groupKey: 'widgetGroupInventory' },
  { id: 'outOfStock', labelKey: 'widgetOutOfStock', groupKey: 'widgetGroupInventory' },
  { id: 'deadStock', labelKey: 'widgetDeadStock', groupKey: 'widgetGroupInventory' },
  { id: 'lowStock', labelKey: 'widgetLowStock', groupKey: 'widgetGroupInventory' },
  { id: 'topProducts', labelKey: 'widgetTopProducts', groupKey: 'widgetGroupInventory' },
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

export function isDashboardWidgetVisible(id, widgets, isAdmin = true) {
  if (id === 'cashProfit' && !isAdmin) return false;
  return widgets?.[id] !== false;
}
