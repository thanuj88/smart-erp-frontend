import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { saleService } from '../services';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { formatOrderId } from '../utils/orderId';
import PaginationBar from '../components/PaginationBar';
import DateRangePicker from '../components/DateRangePicker';
import { usePagination } from '../hooks/usePagination';
import { useTranslation } from 'react-i18next';

const actualIncome = (summary) => {
  if (!summary) return 0;
  if (typeof summary.total_actual_income === 'number') return summary.total_actual_income;
  return (
    (Number(summary.total_revenue) || 0) +
    (Number(summary.down_payment_income) || 0) +
    (Number(summary.installment_income) || 0)
  );
};

const MetricCard = ({ label, value, sub, variant = 'metric-orange', icon }) => (
  <div className={`metric-card ${variant}`}>
    <div className="metric-info">
      <small>{label}</small>
      <h3>{value}</h3>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
    <div className="metric-icon">
      <i className={`bi ${icon} fs-4`}></i>
    </div>
  </div>
);

const STATS_TAB_KEYS = [
  { id: 'today', labelKey: 'todayStatistics' },
  { id: 'week', labelKey: 'thisWeek' },
  { id: 'month', labelKey: 'thisMonth' },
  { id: 'overall', labelKey: 'overallStatistics' },
];

const PeriodMetrics = ({ summary, formatMoney, collectionsSub, t }) => (
  <div className="row g-3">
    <div className="col-12 col-sm-6 col-xl-3">
      <MetricCard
        label={t('downPayments')}
        value={formatMoney(summary?.down_payment_income || 0)}
        sub={t('subInstallmentDownPayments')}
        variant="metric-blue"
        icon="bi-cash-stack"
      />
    </div>
    <div className="col-12 col-sm-6 col-xl-3">
      <MetricCard
        label={t('installmentCollections')}
        value={formatMoney(summary?.installment_income || 0)}
        sub={collectionsSub}
        variant="metric-teal"
        icon="bi-calendar-check"
      />
    </div>
    <div className="col-12 col-sm-6 col-xl-3">
      <MetricCard
        label={t('totalActualIncome')}
        value={formatMoney(actualIncome(summary))}
        sub={t('subCashRevenueAmount', { amount: formatMoney(summary?.total_revenue || 0) })}
        variant="metric-dark"
        icon="bi-graph-up-arrow"
      />
    </div>
    <div className="col-12 col-sm-6 col-xl-3">
      <MetricCard
        label={t('widgetCashProfit')}
        value={formatMoney(summary?.total_profit || 0)}
        sub={t('subOnCashSalesOnly')}
        variant="metric-teal"
        icon="bi-piggy-bank"
      />
    </div>
  </div>
);

const SalesReport = () => {
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const [allSales, setAllSales] = useState([]);
  const [returns, setReturns] = useState([]);
  const [overallSummary, setOverallSummary] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterItem, setFilterItem] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterOrder, setFilterOrder] = useState('');
  const [filterTeller, setFilterTeller] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [statsTab, setStatsTab] = useState('today');

  const loadData = useCallback(async () => {
    try {
      const [salesData, summaryData, daily, weekly, monthly, returnsData] = await Promise.all([
        saleService.getAll(),
        saleService.getOverallSummary(),
        saleService.getDailySummary(),
        saleService.getWeeklySummary(),
        saleService.getMonthlySummary(),
        saleService.getReturns().catch(() => []),
      ]);
      setAllSales(salesData || []);
      setReturns(returnsData || []);
      setOverallSummary(summaryData);
      setDailySummary(daily);
      setWeeklySummary(weekly);
      setMonthlySummary(monthly);
      setError('');
    } catch (err) {
      console.error('Error loading sales report:', err);
      setError('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const combinedSales = useMemo(() => {
    const categoryByKey = new Map();
    allSales.forEach((sale) => {
      const name = sale.category_name || sale.category;
      if (!name) return;
      if (sale.item_id) categoryByKey.set(`id:${sale.item_id}`, name);
      if (sale.item_name) categoryByKey.set(`name:${sale.item_name}`, name);
    });

    const recordedReturns = new Set(
      allSales.filter((sale) => sale.return_number).map((sale) => String(sale.return_number))
    );

    const extras = [];
    returns.forEach((ret) => {
      if (recordedReturns.has(String(ret.return_number))) return;
      (ret.lines || []).forEach((line, idx) => {
        const categoryName =
          categoryByKey.get(`id:${line.item_id}`) ||
          categoryByKey.get(`name:${line.item_name}`) ||
          '';
        extras.push({
          id: `legacy-return-${ret.id}-${line.sale_id || idx}`,
          order_number: ret.order_number,
          sale_date: ret.created_at || ret.createdAt,
          item_name: line.item_name,
          item_id: line.item_id,
          quantity: line.qty,
          returned_qty: line.qty,
          price: line.unit_price,
          total: (ret.return_type || 'cash') === 'cash' ? -(Number(line.line_total) || 0) : 0,
          teller_name: ret.teller_name,
          is_return: true,
          return_flag: true,
          return_type: ret.return_type || 'cash',
          return_number: ret.return_number,
          category_name: categoryName,
        });
      });
    });

    return [...allSales, ...extras].sort(
      (a, b) => new Date(b.sale_date || 0) - new Date(a.sale_date || 0)
    );
  }, [allSales, returns]);

  const itemOptions = useMemo(() => {
    const names = [...new Set(combinedSales.map((s) => s.item_name).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [combinedSales]);

  const categoryOptions = useMemo(() => {
    const names = [
      ...new Set(combinedSales.map((s) => s.category_name || s.category).filter(Boolean)),
    ];
    return names.sort((a, b) => a.localeCompare(b));
  }, [combinedSales]);

  const tellerOptions = useMemo(() => {
    const names = [...new Set(combinedSales.map((s) => s.teller_name).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [combinedSales]);

  const filteredSales = useMemo(() => {
    return combinedSales.filter((sale) => {
      const isReturn = Boolean(sale.is_return || sale.return_flag);
      if (filterType === 'sale' && isReturn) return false;
      if (filterType === 'return' && !isReturn) return false;

      if (filterCategory) {
        const category = sale.category_name || sale.category || '';
        if (category !== filterCategory) return false;
      }

      if (filterItem && sale.item_name !== filterItem) return false;

      if (filterOrder) {
        const needle = filterOrder.replace(/[#\s]/g, '').toLowerCase();
        const hay = String(sale.order_number || sale.id || '').replace(/[#\s]/g, '').toLowerCase();
        if (!hay.includes(needle)) return false;
      }

      if (filterTeller && sale.teller_name !== filterTeller) return false;

      if (filterStartDate) {
        const saleDay = new Date(sale.sale_date).toISOString().slice(0, 10);
        if (saleDay < filterStartDate) return false;
      }

      if (filterEndDate) {
        const saleDay = new Date(sale.sale_date).toISOString().slice(0, 10);
        if (saleDay > filterEndDate) return false;
      }

      return true;
    });
  }, [combinedSales, filterType, filterCategory, filterItem, filterOrder, filterTeller, filterStartDate, filterEndDate]);

  const {
    page,
    setPage,
    pageItems: paginatedSales,
    total,
    totalPages,
    pageSize,
  } = usePagination(filteredSales, {
    resetKey: `${filterType}|${filterCategory}|${filterItem}|${filterOrder}|${filterTeller}|${filterStartDate}|${filterEndDate}`,
  });

  const handleClearFilters = () => {
    setFilterItem('');
    setFilterCategory('');
    setFilterType('');
    setFilterOrder('');
    setFilterTeller('');
    setFilterStartDate('');
    setFilterEndDate('');
    setPage(1);
  };

  const hasActiveFilters =
    filterItem || filterCategory || filterType || filterOrder || filterTeller || filterStartDate || filterEndDate;

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('loading')}</span>
          </div>
          <p className="text-muted mt-2">{t('loadingSalesReport')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid matte-page admin-page report-page table-page">
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
            <div className="mb-3 mb-lg-0">
              <h1 className="h3 mb-1">{t('salesReport')}</h1>
              <p className="text-muted small mb-0">
                {t('salesReportSubtitle')}
              </p>
            </div>
            <div className="text-muted small">
              <i className="bi bi-calendar3 me-1"></i>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      <ul className="nav nav-tabs admin-tabs mb-3" role="tablist">
        {STATS_TAB_KEYS.map((tab) => (
          <li className="nav-item" role="presentation" key={tab.id}>
            <button
              type="button"
              role="tab"
              id={`stats-tab-${tab.id}`}
              aria-controls={`stats-panel-${tab.id}`}
              aria-selected={statsTab === tab.id}
              className={`nav-link ${statsTab === tab.id ? 'active' : ''}`}
              onClick={() => setStatsTab(tab.id)}
            >
              {t(tab.labelKey)}
            </button>
          </li>
        ))}
      </ul>

      <div className="mb-3" id={`stats-panel-${statsTab}`} role="tabpanel" aria-labelledby={`stats-tab-${statsTab}`}>
        {statsTab === 'today' && (
          <PeriodMetrics
            summary={dailySummary}
            formatMoney={formatMoney}
            collectionsSub={t('collectionsToday')}
            t={t}
          />
        )}

        {statsTab === 'week' && (
          <PeriodMetrics
            summary={weeklySummary}
            formatMoney={formatMoney}
            collectionsSub={t('collectionsWeek')}
            t={t}
          />
        )}

        {statsTab === 'month' && (
          <PeriodMetrics
            summary={monthlySummary}
            formatMoney={formatMoney}
            collectionsSub={t('collectionsMonth')}
            t={t}
          />
        )}

        {statsTab === 'overall' && (
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-xl-4">
              <MetricCard
                label={t('totalSales')}
                value={overallSummary?.total_sales || 0}
                sub={t('allTimeTransactions')}
                variant="metric-blue"
                icon="bi-receipt"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-4">
              <MetricCard
                label={t('totalRevenue')}
                value={formatMoney(overallSummary?.total_revenue || 0)}
                sub={t('allTimeCashRevenue')}
                variant="metric-orange"
                icon="bi-currency-dollar"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-4">
              <MetricCard
                label={t('widgetCashProfit')}
                value={formatMoney(overallSummary?.total_profit || 0)}
                sub={t('allTimeCashSales')}
                variant="metric-teal"
                icon="bi-graph-up"
              />
            </div>
          </div>
        )}
      </div>

      <div className="card table-panel">
        <div className="card-body p-0">
          <div className="d-flex align-items-baseline gap-2 px-3 pt-3 pb-2">
            <h5 className="card-title mb-0">{t('allSales')}</h5>
            <span className="text-muted small">{filteredSales.length}</span>
          </div>
          <div className="table-responsive">
                    <table className="table table-hover admin-table mb-0 sales-table">
                      <colgroup>
                        <col className="col-order" />
                        <col className="col-datetime" />
                        <col className="col-item" />
                        <col className="col-category" />
                        <col className="col-qty" />
                        <col className="col-returned" />
                        <col className="col-flag" />
                        <col className="col-price" />
                        <col className="col-total" />
                        <col className="col-teller" />
                      </colgroup>
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-semibold">{t('orderId')}</th>
                          <th className="border-0 fw-semibold">{t('date')}</th>
                          <th className="border-0 fw-semibold">{t('item')}</th>
                          <th className="border-0 fw-semibold">{t('category')}</th>
                          <th className="border-0 fw-semibold text-center">{t('qty')}</th>
                          <th className="border-0 fw-semibold text-center" title={t('returned')}>{t('rtn')}</th>
                          <th className="border-0 fw-semibold">{t('flag')}</th>
                          <th className="border-0 fw-semibold">{t('price')}</th>
                          <th className="border-0 fw-semibold">{t('total')}</th>
                          <th className="border-0 fw-semibold">{t('teller')}</th>
                        </tr>
                        <tr className="report-filter-row">
                          <th>
                            <input
                              id="filterOrder"
                              type="text"
                              className="form-control form-control-sm"
                              placeholder={t('orderId')}
                              value={filterOrder}
                              onChange={(e) => setFilterOrder(e.target.value)}
                            />
                          </th>
                          <th>
                            <DateRangePicker
                              startDate={filterStartDate}
                              endDate={filterEndDate}
                              placeholder={t('dates')}
                              onChange={({ startDate, endDate }) => {
                                setFilterStartDate(startDate);
                                setFilterEndDate(endDate);
                              }}
                            />
                          </th>
                          <th>
                            <select
                              id="filterItem"
                              className="form-select form-select-sm"
                              value={filterItem}
                              onChange={(e) => setFilterItem(e.target.value)}
                            >
                              <option value="">{t('allItems')}</option>
                              {itemOptions.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </th>
                          <th>
                            <select
                              id="filterCategory"
                              className="form-select form-select-sm"
                              value={filterCategory}
                              onChange={(e) => setFilterCategory(e.target.value)}
                            >
                              <option value="">{t('All categories')}</option>
                              {categoryOptions.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </th>
                          <th />
                          <th />
                          <th>
                            <select
                              id="filterType"
                              className="form-select form-select-sm"
                              value={filterType}
                              onChange={(e) => setFilterType(e.target.value)}
                            >
                              <option value="">{t('All')}</option>
                              <option value="sale">{t('sale')}</option>
                              <option value="return">{t('Returns')}</option>
                            </select>
                          </th>
                          <th />
                          <th />
                          <th>
                            <div className="report-teller-filter">
                              <select
                                id="filterTeller"
                                className="form-select form-select-sm"
                                value={filterTeller}
                                onChange={(e) => setFilterTeller(e.target.value)}
                              >
                                <option value="">{t('allTellers')}</option>
                                {tellerOptions.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={handleClearFilters}
                                disabled={!hasActiveFilters}
                              >
                                {t('clear')}
                              </button>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSales.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-5">
                              <i className="bi bi-receipt text-muted fs-1 mb-3 d-block"></i>
                              <h5 className="text-muted">{t('noSalesFound')}</h5>
                              <p className="text-muted mb-0">
                                {hasActiveFilters ? t('tryAdjustFilters') : t('noSalesRecorded')}
                              </p>
                            </td>
                          </tr>
                        ) : (
                          paginatedSales.map((sale) => {
                          const isReturn = Boolean(sale.is_return || sale.return_flag);
                          return (
                          <tr key={sale.id}>
                            <td className="order-id-cell">
                              <span className="order-id-badge">{formatOrderId(sale.order_number, sale.id)}</span>
                            </td>
                            <td className="text-muted sale-datetime">
                              {new Date(sale.sale_date).toLocaleString(undefined, {
                                month: 'numeric',
                                day: 'numeric',
                                year: '2-digit',
                                hour: 'numeric',
                                minute: '2-digit',
                              }).replace(',', '')}
                            </td>
                            <td className="fw-semibold sale-item" title={sale.item_name}>{sale.item_name}</td>
                            <td className="sale-category" title={sale.category_name || sale.category || ''}>
                              {sale.category_name || sale.category || '-'}
                            </td>
                            <td className="text-center">{sale.quantity}</td>
                            <td className="text-center">{sale.returned_qty || 0}</td>
                            <td>
                              {isReturn ? (
                                <span className="badge bg-danger">
                                  {t('Return')}
                                  {sale.return_type && sale.return_type !== 'cash'
                                    ? ` · ${sale.return_type === 'warranty' ? t('Warranty claim') : sale.return_type === 'defect' ? t('Defect') : sale.return_type}`
                                    : sale.return_type === 'cash'
                                      ? ` · ${t('cash')}`
                                      : ''}
                                </span>
                              ) : (
                                <span className="badge bg-success">{t('sale')}</span>
                              )}
                            </td>
                            <td>{formatMoney(sale.price || 0)}</td>
                            <td className={`fw-semibold${isReturn ? ' text-danger' : ''}`}>
                              {formatMoney(sale.total || 0)}
                            </td>
                            <td>{sale.teller_name || '-'}</td>
                          </tr>
                          );
                        })
                        )}
                      </tbody>
                    </table>
                  </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            label={t('sales')}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
