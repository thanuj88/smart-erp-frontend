import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { saleService } from '../services';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { formatOrderId } from '../utils/orderId';

const PAGE_SIZE = 10;

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

const STATS_TABS = [
  { id: 'today', label: "Today's Statistics" },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'overall', label: 'Overall Statistics' },
];

const PeriodMetrics = ({ summary, formatMoney, collectionsSub }) => (
  <div className="row g-3">
    <div className="col-12 col-sm-6 col-xl-3">
      <MetricCard
        label="Down Payments"
        value={formatMoney(summary?.down_payment_income || 0)}
        sub="Installment down payments"
        variant="metric-blue"
        icon="bi-cash-stack"
      />
    </div>
    <div className="col-12 col-sm-6 col-xl-3">
      <MetricCard
        label="Installment Collections"
        value={formatMoney(summary?.installment_income || 0)}
        sub={collectionsSub}
        variant="metric-teal"
        icon="bi-calendar-check"
      />
    </div>
    <div className="col-12 col-sm-6 col-xl-3">
      <MetricCard
        label="Total Actual Income"
        value={formatMoney(actualIncome(summary))}
        sub={`${formatMoney(summary?.total_revenue || 0)} cash revenue`}
        variant="metric-dark"
        icon="bi-graph-up-arrow"
      />
    </div>
    <div className="col-12 col-sm-6 col-xl-3">
      <MetricCard
        label="Cash Sales Profit"
        value={formatMoney(summary?.total_profit || 0)}
        sub="On cash sales only"
        variant="metric-teal"
        icon="bi-piggy-bank"
      />
    </div>
  </div>
);

const SalesReport = () => {
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
  const [currentPage, setCurrentPage] = useState(1);
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

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSales.slice(start, start + PAGE_SIZE);
  }, [filteredSales, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCategory, filterItem, filterOrder, filterTeller, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setFilterItem('');
    setFilterCategory('');
    setFilterType('');
    setFilterOrder('');
    setFilterTeller('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filterItem || filterCategory || filterType || filterOrder || filterTeller || filterStartDate || filterEndDate;

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Loading sales report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid matte-page admin-page report-page">
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
            <div className="mb-3 mb-lg-0">
              <h1 className="h3 mb-1">Sales Report</h1>
              <p className="text-muted small mb-0">
                View sales performance, revenue, and transaction history.
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
        {STATS_TABS.map((tab) => (
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
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mb-3" id={`stats-panel-${statsTab}`} role="tabpanel" aria-labelledby={`stats-tab-${statsTab}`}>
        {statsTab === 'today' && (
          <PeriodMetrics
            summary={dailySummary}
            formatMoney={formatMoney}
            collectionsSub="Payments collected today"
          />
        )}

        {statsTab === 'week' && (
          <PeriodMetrics
            summary={weeklySummary}
            formatMoney={formatMoney}
            collectionsSub="Payments collected this week"
          />
        )}

        {statsTab === 'month' && (
          <PeriodMetrics
            summary={monthlySummary}
            formatMoney={formatMoney}
            collectionsSub="Payments collected this month"
          />
        )}

        {statsTab === 'overall' && (
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-xl-4">
              <MetricCard
                label="Total Sales"
                value={overallSummary?.total_sales || 0}
                sub="All time transactions"
                variant="metric-blue"
                icon="bi-receipt"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-4">
              <MetricCard
                label="Total Revenue"
                value={formatMoney(overallSummary?.total_revenue || 0)}
                variant="metric-orange"
                icon="bi-currency-dollar"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-4">
              <MetricCard
                label="Cash Sales Profit"
                value={formatMoney(overallSummary?.total_profit || 0)}
                sub="All time cash sales"
                variant="metric-teal"
                icon="bi-graph-up"
              />
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-baseline gap-2 mb-2">
            <h5 className="card-title mb-0">All Sales</h5>
            <span className="text-muted small">{filteredSales.length}</span>
          </div>

          <div className="card border-0 shadow-none">
            <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover admin-table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-semibold">Order ID</th>
                          <th className="border-0 fw-semibold">Date &amp; Time</th>
                          <th className="border-0 fw-semibold">Item</th>
                          <th className="border-0 fw-semibold">Category</th>
                          <th className="border-0 fw-semibold">Qty</th>
                          <th className="border-0 fw-semibold">Returned</th>
                          <th className="border-0 fw-semibold">Flag</th>
                          <th className="border-0 fw-semibold">Price</th>
                          <th className="border-0 fw-semibold">Total</th>
                          <th className="border-0 fw-semibold">Teller</th>
                        </tr>
                        <tr className="report-filter-row">
                          <th>
                            <input
                              id="filterOrder"
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Order ID"
                              value={filterOrder}
                              onChange={(e) => setFilterOrder(e.target.value)}
                            />
                          </th>
                          <th>
                            <div className="report-date-range">
                              <input
                                id="filterStartDate"
                                type="date"
                                className="form-control form-control-sm"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                aria-label="From date"
                              />
                              <span className="report-date-range-sep" aria-hidden="true">–</span>
                              <input
                                id="filterEndDate"
                                type="date"
                                className="form-control form-control-sm"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                min={filterStartDate || undefined}
                                aria-label="To date"
                              />
                            </div>
                          </th>
                          <th>
                            <select
                              id="filterItem"
                              className="form-select form-select-sm"
                              value={filterItem}
                              onChange={(e) => setFilterItem(e.target.value)}
                            >
                              <option value="">All items</option>
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
                              <option value="">All categories</option>
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
                              <option value="">All</option>
                              <option value="sale">Sales</option>
                              <option value="return">Returns</option>
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
                                <option value="">All tellers</option>
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
                                Clear
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
                              <h5 className="text-muted">No sales found</h5>
                              <p className="text-muted mb-0">
                                {hasActiveFilters ? 'Try adjusting your filters.' : 'No sales recorded yet.'}
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
                            <td className="text-muted text-nowrap">
                              {new Date(sale.sale_date).toLocaleString(undefined, {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="fw-semibold">{sale.item_name}</td>
                            <td>{sale.category_name || sale.category || '—'}</td>
                            <td>{sale.quantity}</td>
                            <td>{sale.returned_qty || 0}</td>
                            <td>
                              {isReturn ? (
                                <span className="badge bg-danger">
                                  Return
                                  {sale.return_type && sale.return_type !== 'cash'
                                    ? ` · ${sale.return_type}`
                                    : sale.return_type === 'cash'
                                      ? ' · cash'
                                      : ''}
                                </span>
                              ) : (
                                <span className="badge bg-success">Sale</span>
                              )}
                            </td>
                            <td>{formatMoney(sale.price || 0)}</td>
                            <td className={`fw-semibold${isReturn ? ' text-danger' : ''}`}>
                              {formatMoney(sale.total || 0)}
                            </td>
                            <td>{sale.teller_name || '—'}</td>
                          </tr>
                          );
                        })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredSales.length > 0 && (
                  <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 px-3 py-3 border-top">
                    <p className="text-muted small mb-0">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                      {Math.min(currentPage * PAGE_SIZE, filteredSales.length)} of{' '}
                      {filteredSales.length}
                    </p>
                    <nav aria-label="Sales pagination">
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            if (totalPages <= 7) return true;
                            return (
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1
                            );
                          })
                          .map((page, idx, arr) => {
                            const prev = arr[idx - 1];
                            const showEllipsis = prev && page - prev > 1;
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && (
                                  <li className="page-item disabled">
                                    <span className="page-link">…</span>
                                  </li>
                                )}
                                <li className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                  <button
                                    type="button"
                                    className="page-link"
                                    onClick={() => setCurrentPage(page)}
                                  >
                                    {page}
                                  </button>
                                </li>
                              </React.Fragment>
                            );
                          })}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                  )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
