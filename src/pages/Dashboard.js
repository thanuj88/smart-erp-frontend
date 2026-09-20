import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saleService, itemService, installmentPaymentService, settingsService } from '../services';
import { useTranslation } from 'react-i18next';
import SalesPurchaseChart from '../components/SalesPurchaseChart';
import CategoryMixDonut from '../components/CategoryMixDonut';
import OverduePlansCard from '../components/OverduePlansCard';
import StockListCard from '../components/StockListCard';
import DashboardEditor from '../components/DashboardEditor';
import { useTenantSettings } from '../contexts/TenantSettingsContext';
import {
  DEAD_STOCK_DAYS,
  isDashboardWidgetVisible,
  resolveDashboardWidgets,
} from '../config/dashboardWidgets';

const localDay = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const daysBetween = (fromDay, toDay) => {
  if (!fromDay || !toDay) return 1;
  const ms = new Date(`${toDay}T00:00:00`).getTime() - new Date(`${fromDay}T00:00:00`).getTime();
  return Math.max(1, Math.round(ms / 86400000));
};

const buildCategoryMix = (sales, t) => {
  const totals = new Map();
  (sales || []).forEach((sale) => {
    const name = sale.category_name || sale.category || t('uncategorized');
    totals.set(name, (totals.get(name) || 0) + (Number(sale.total) || 0));
  });
  const rows = Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
  if (rows.length <= 6) return rows;
  const head = rows.slice(0, 5);
  const other = rows.slice(5).reduce((sum, row) => sum + row.value, 0);
  return [...head, { name: t('other'), value: other }];
};

const groupOverduePlans = (payments) => {
  const today = localDay(new Date());
  const map = new Map();
  (payments || []).forEach((payment) => {
    const key = String(payment.installment_plan_id || payment.id);
    if (!map.has(key)) {
      map.set(key, {
        planId: payment.installment_plan_id || payment.id,
        customer_name: payment.customer_name,
        remaining: 0,
        earliestDue: payment.due_date,
        count: 0,
      });
    }
    const group = map.get(key);
    group.remaining += (Number(payment.amount_due) || 0) - (Number(payment.amount_paid) || 0);
    group.count += 1;
    if (!group.customer_name && payment.customer_name) group.customer_name = payment.customer_name;
    if (payment.due_date && (!group.earliestDue || String(payment.due_date) < String(group.earliestDue))) {
      group.earliestDue = payment.due_date;
    }
  });
  return Array.from(map.values())
    .map((plan) => ({
      ...plan,
      daysOverdue: daysBetween(localDay(plan.earliestDue), today),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue || b.remaining - a.remaining)
    .slice(0, 6);
};

const toStockRows = (items, mapItem) => items.slice(0, 6).map(mapItem);

const Dashboard = () => {
  const { isAdmin, user } = useAuth();
  const { formatMoney, settings, setSettings } = useTenantSettings();
  const { t } = useTranslation();
  const [dailySummary, setDailySummary] = useState(null);
  const [todaySales, setTodaySales] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState([]);
  const [topRange, setTopRange] = useState('week');
  const [summaryRange, setSummaryRange] = useState('1Y');
  const [salesPurchaseSummary, setSalesPurchaseSummary] = useState({
    total_revenue: 0,
    total_purchase: 0,
    total_sales: 0,
  });
  const [trendData, setTrendData] = useState([]);
  const [editing, setEditing] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);

  const widgets = useMemo(
    () => resolveDashboardWidgets(settings?.dashboardWidgets),
    [settings?.dashboardWidgets]
  );
  const show = (id) => isDashboardWidgetVisible(id, widgets, isAdmin);

  const loadTopProducts = useCallback(async () => {
    try {
      const top = await saleService.getTop(topRange, 6);
      setTopProducts(top || []);
    } catch (err) {
      console.error('Failed to load top products', err);
      setTopProducts([]);
    }
  }, [topRange]);

  const loadSalesPurchaseSummary = useCallback(async () => {
    try {
      const summary = await saleService.getSummary(summaryRange);
      const trend = await saleService.getTrend(summaryRange);
      setSalesPurchaseSummary(summary || { total_revenue: 0, total_purchase: 0, total_sales: 0 });
      setTrendData(trend || []);
    } catch (err) {
      console.error('Failed to load sales/purchase summary', err);
      setSalesPurchaseSummary({ total_revenue: 0, total_purchase: 0, total_sales: 0 });
      setTrendData([]);
    }
  }, [summaryRange]);

  const loadData = useCallback(async () => {
    try {
      const [daily, today, overdue, items, recent] = await Promise.all([
        saleService.getDailySummary(),
        saleService.getToday().catch(() => []),
        installmentPaymentService.getOverdue().catch(() => []),
        itemService.getAll().catch(() => []),
        saleService.getRecent(DEAD_STOCK_DAYS).catch(() => []),
      ]);
      setDailySummary(daily);
      setTodaySales(today || []);
      setOverduePayments(overdue || []);
      setInventoryItems(items || []);
      setRecentSales(recent || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadSalesPurchaseSummary();
    const interval = setInterval(() => {
      loadData();
      loadSalesPurchaseSummary();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData, loadSalesPurchaseSummary]);

  useEffect(() => {
    loadTopProducts();
  }, [loadTopProducts]);

  const categoryMix = useMemo(() => buildCategoryMix(todaySales, t), [todaySales, t]);
  const overduePlans = useMemo(() => groupOverduePlans(overduePayments), [overduePayments]);

  const stockLists = useMemo(() => {
    const threshold = Number(settings?.lowStockThreshold ?? 15);
    const soldIds = new Set();
    (recentSales || []).forEach((sale) => {
      if (sale.is_return || sale.return_flag) return;
      if (sale.item_id) soldIds.add(`id:${sale.item_id}`);
      if (sale.item_name) soldIds.add(`name:${sale.item_name}`);
    });

    const outOfStock = [];
    const lowStock = [];
    const deadStock = [];
    (inventoryItems || []).forEach((item) => {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        outOfStock.push(item);
        return;
      }
      if (qty <= threshold) lowStock.push(item);
      const moved = soldIds.has(`id:${item.id}`) || soldIds.has(`name:${item.name}`);
      if (!moved) deadStock.push(item);
    });

    return {
      outOfStock: toStockRows(outOfStock, (item) => ({
        id: item.id,
        name: item.name,
        badge: t('leftCount', { count: 0 }),
      })),
      lowStock: toStockRows(lowStock, (item) => ({
        id: item.id,
        name: item.name,
        badge: t('leftCount', { count: item.quantity }),
      })),
      deadStock: toStockRows(deadStock, (item) => ({
        id: item.id,
        name: item.name,
        sub: t('noSalesInDays', { days: DEAD_STOCK_DAYS }),
        badge: t('onHandCount', { count: item.quantity }),
      })),
      lowStockRaw: lowStock,
    };
  }, [inventoryItems, recentSales, settings?.lowStockThreshold, t]);

  const toggleWidget = async (id) => {
    const next = { ...widgets, [id]: widgets[id] === false };
    setSettings((prev) => ({ ...(prev || {}), dashboardWidgets: next }));
    setSavingLayout(true);
    try {
      const updated = await settingsService.update({ dashboardWidgets: next });
      setSettings(updated);
    } catch (err) {
      console.error('Failed to save dashboard layout', err);
      setSettings((prev) => ({ ...(prev || {}), dashboardWidgets: widgets }));
    } finally {
      setSavingLayout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-2 text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  const todayRevenue = dailySummary?.total_revenue || 0;
  const todayActualIncome = dailySummary?.total_actual_income || 0;
  const todayProfit = dailySummary?.total_profit || 0;
  const todayCollections =
    (Number(dailySummary?.down_payment_income) || 0) +
    (Number(dailySummary?.installment_income) || 0);

  const metricCards = [
    show('cashRevenue') && {
      id: 'cashRevenue',
      label: t('widgetCashRevenue'),
      value: formatMoney(todayRevenue),
      sub: t('subCashSalesOnly'),
      variant: 'metric-orange',
      icon: 'bi-currency-dollar',
    },
    show('installmentIn') && {
      id: 'installmentIn',
      label: t('widgetInstallmentIn'),
      value: formatMoney(todayCollections),
      sub: t('subDownPaymentsCollections'),
      variant: 'metric-blue',
      icon: 'bi-calendar-check',
    },
    show('actualIncome') && {
      id: 'actualIncome',
      label: t('widgetActualIncome'),
      value: formatMoney(todayActualIncome),
      sub: t('subCashPlusInstallment'),
      variant: 'metric-dark',
      icon: 'bi-graph-up',
    },
    show('cashProfit') && {
      id: 'cashProfit',
      label: t('widgetCashProfit'),
      value: formatMoney(todayProfit),
      sub: t('subOnCashSalesOnly'),
      variant: 'metric-teal',
      icon: 'bi-piggy-bank',
    },
  ].filter(Boolean);

  const showMixRow = show('categoryMix') || show('overduePlans');
  const showStockRow = show('outOfStock') || show('deadStock');
  const showMainLeft = show('salesChart') || showMixRow || showStockRow;
  const showMainRight = show('lowStock') || show('topProducts');

  return (
    <div className="container-fluid matte-page dashboard-page">
      <div className="page-welcome d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h4>{t('welcomeUser', { name: user?.name || user?.full_name || t('admin') })}</h4>
          <p>{t('dashboardSubtitle')}</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="text-muted small">
            <i className="bi bi-calendar3 me-1"></i>
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          {isAdmin && (
            <button
              type="button"
              className={`btn btn-sm ${editing ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setEditing((value) => !value)}
            >
              <i className="bi bi-sliders me-1"></i>
              {editing ? t('editingDashboard') : t('editDashboard')}
            </button>
          )}
        </div>
      </div>

      {editing && isAdmin && (
        <DashboardEditor
          widgets={widgets}
          onToggle={toggleWidget}
          onClose={() => setEditing(false)}
          saving={savingLayout}
          isAdmin={isAdmin}
        />
      )}

      {show('lowStockBanner') && stockLists.lowStockRaw.length > 0 && (
        <div className="alert-dreams mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {t('lowStockBanner', {
            name: stockLists.lowStockRaw[0].name,
            qty: stockLists.lowStockRaw[0].quantity,
            threshold:
              settings?.lowStockThreshold != null
                ? t('lowStockThresholdNote', { count: settings.lowStockThreshold })
                : '',
          })}
          <a href="/inventory" className="ms-2 fw-semibold text-decoration-none">{t('manageInventory')}</a>
        </div>
      )}

      {metricCards.length > 0 && (
        <div className="row g-3 mb-3">
          {metricCards.map((card) => (
            <div key={card.id} className="col-12 col-sm-6 col-xl-3">
              <div className={`metric-card ${card.variant}`}>
                <div className="metric-info">
                  <small>{card.label}</small>
                  <h3>{card.value}</h3>
                  <div className="metric-sub">{card.sub}</div>
                </div>
                <div className="metric-icon">
                  <i className={`bi ${card.icon} fs-4`}></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showMainLeft || showMainRight) && (
        <div className="row g-3 dashboard-main-row align-items-stretch">
          {showMainLeft && (
            <div className={`d-flex flex-column gap-3 ${showMainRight ? 'col-12 col-xl-8' : 'col-12'}`}>
              {show('salesChart') && (
                <SalesPurchaseChart
                  summaryRange={summaryRange}
                  onRangeChange={setSummaryRange}
                  summary={salesPurchaseSummary}
                  trendData={trendData}
                />
              )}
              {showMixRow && (
                <div className="row g-3">
                  {show('categoryMix') && (
                    <div className={show('overduePlans') ? 'col-12 col-lg-6' : 'col-12'}>
                      <CategoryMixDonut slices={categoryMix} formatMoney={formatMoney} />
                    </div>
                  )}
                  {show('overduePlans') && (
                    <div className={show('categoryMix') ? 'col-12 col-lg-6' : 'col-12'}>
                      <OverduePlansCard plans={overduePlans} formatMoney={formatMoney} />
                    </div>
                  )}
                </div>
              )}
              {showStockRow && (
                <div className="row g-3">
                  {show('outOfStock') && (
                    <div className={show('deadStock') ? 'col-12 col-lg-6' : 'col-12'}>
                      <StockListCard
                        title={t('widgetOutOfStock')}
                        items={stockLists.outOfStock}
                        emptyText={t('outOfStockEmpty')}
                        linkLabel={t('manageArrow')}
                        badgeClass="bg-danger"
                      />
                    </div>
                  )}
                  {show('deadStock') && (
                    <div className={show('outOfStock') ? 'col-12 col-lg-6' : 'col-12'}>
                      <StockListCard
                        title={t('widgetDeadStock')}
                        items={stockLists.deadStock}
                        emptyText={t('deadStockEmpty', { days: DEAD_STOCK_DAYS })}
                        linkLabel={t('manageArrow')}
                        badgeClass="bg-secondary"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {showMainRight && (
            <div className={showMainLeft ? 'col-12 col-xl-4' : 'col-12'}>
              <div className="dashboard-side-stack h-100 d-flex flex-column gap-3">
                {show('lowStock') && (
                  <div className="card shadow-sm rounded-4 dashboard-side-card">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h5 className="card-title mb-0">{t('widgetLowStock')}</h5>
                        <a href="/inventory" className="text-decoration-none small text-primary">{t('manageArrow')}</a>
                      </div>
                      <div className="list-group list-group-flush">
                        {stockLists.lowStock.length === 0 ? (
                          <div className="text-muted small">{t('lowStockEmpty')}</div>
                        ) : (
                          stockLists.lowStock.map((item) => (
                            <div key={item.id} className="list-group-item px-0 border-0 d-flex justify-content-between align-items-center py-2">
                              <div className="small">{item.name}</div>
                              <span className="badge bg-warning text-dark rounded-pill">{item.badge}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {show('topProducts') && (
                  <div className="card shadow-sm rounded-4 dashboard-side-card flex-grow-1">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h5 className="card-title mb-0">{t('widgetTopProducts')}</h5>
                        <i className="bi bi-award-fill text-primary"></i>
                      </div>
                      <div className="list-group list-group-flush top-products">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="small text-muted">{t('topSelling')}</div>
                          <select
                            className="form-select form-select-sm"
                            value={topRange}
                            onChange={(e) => setTopRange(e.target.value)}
                            style={{ width: '8.5rem' }}
                          >
                            <option value="week">{t('thisWeek')}</option>
                            <option value="month">{t('thisMonth')}</option>
                            <option value="overall">{t('overallStatistics')}</option>
                          </select>
                        </div>
                        {topProducts.length === 0 ? (
                          <div className="text-muted small">{t('noSalesData')}</div>
                        ) : (
                          topProducts.map((p, idx) => (
                            <div key={p.name} className="list-group-item px-0 border-0 d-flex justify-content-between align-items-center py-2">
                              <div>
                                <strong className="small">{p.name}</strong>
                                <div className="text-muted small">{t('soldCount', { count: p.qty })}</div>
                              </div>
                              <span className={`badge ${idx === 0 ? 'bg-primary' : 'bg-secondary'} rounded-pill`}>
                                #{idx + 1}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
