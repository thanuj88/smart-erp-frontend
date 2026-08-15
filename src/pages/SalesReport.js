import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { saleService } from '../services';
import { useCurrency } from '../contexts/TenantSettingsContext';

const PAGE_SIZE = 10;

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

const PeriodPanel = ({ title, icon, summary, formatMoney }) => {
  if (!summary) return null;
  return (
    <div className="card shadow-sm rounded-4 h-100">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="report-period-icon">
            <i className={`bi ${icon}`}></i>
          </span>
          <h5 className="card-title mb-0">{title}</h5>
        </div>
        <div className="row g-3">
          <div className="col-6">
            <div className="report-stat-pill">
              <small>Cash sales</small>
              <strong>{summary.total_sales || 0}</strong>
              <span>{formatMoney(summary.total_revenue || 0)}</span>
            </div>
          </div>
          <div className="col-6">
            <div className="report-stat-pill">
              <small>Down payments</small>
              <strong>{formatMoney(summary.down_payment_income || 0)}</strong>
            </div>
          </div>
          <div className="col-6">
            <div className="report-stat-pill">
              <small>Installments</small>
              <strong>{formatMoney(summary.installment_income || 0)}</strong>
            </div>
          </div>
          <div className="col-6">
            <div className="report-stat-pill report-stat-pill-highlight">
              <small>Total income</small>
              <strong>{formatMoney(summary.total_actual_income || 0)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalesReport = () => {
  const { formatMoney } = useCurrency();
  const [allSales, setAllSales] = useState([]);
  const [overallSummary, setOverallSummary] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterItem, setFilterItem] = useState('');
  const [filterTeller, setFilterTeller] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      const [salesData, summaryData, daily, weekly, monthly] = await Promise.all([
        saleService.getAll(),
        saleService.getOverallSummary(),
        saleService.getDailySummary(),
        saleService.getWeeklySummary(),
        saleService.getMonthlySummary(),
      ]);
      setAllSales(salesData || []);
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

  const itemOptions = useMemo(() => {
    const names = [...new Set(allSales.map((s) => s.item_name).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [allSales]);

  const tellerOptions = useMemo(() => {
    const names = [...new Set(allSales.map((s) => s.teller_name).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [allSales]);

  const filteredSales = useMemo(() => {
    return allSales.filter((sale) => {
      if (filterItem && sale.item_name !== filterItem) return false;

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
  }, [allSales, filterItem, filterTeller, filterStartDate, filterEndDate]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSales.slice(start, start + PAGE_SIZE);
  }, [filteredSales, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterItem, filterTeller, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setFilterItem('');
    setFilterTeller('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = filterItem || filterTeller || filterStartDate || filterEndDate;

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
    <div className="container-fluid py-4 matte-page admin-page report-page">
      <div className="row mb-4">
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

      <h5 className="report-section-title mb-3">Today&apos;s Statistics</h5>
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            label="Cash Sales Today"
            value={dailySummary?.total_sales || 0}
            sub={`${formatMoney(dailySummary?.total_revenue || 0)} revenue`}
            variant="metric-orange"
            icon="bi-basket3"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            label="Down Payments"
            value={formatMoney(dailySummary?.down_payment_income || 0)}
            sub="Installment down payments"
            variant="metric-blue"
            icon="bi-cash-stack"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            label="Installment Collections"
            value={formatMoney(dailySummary?.installment_income || 0)}
            sub="Payments collected today"
            variant="metric-teal"
            icon="bi-calendar-check"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            label="Total Actual Income"
            value={formatMoney(dailySummary?.total_actual_income || 0)}
            sub={`${dailySummary?.total_items_sold || 0} items sold`}
            variant="metric-dark"
            icon="bi-graph-up-arrow"
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6">
          <MetricCard
            label="Today's Profit"
            value={formatMoney(dailySummary?.total_profit || 0)}
            sub="Cash sales profit"
            variant="metric-teal"
            icon="bi-piggy-bank"
          />
        </div>
        <div className="col-12 col-sm-6">
          <MetricCard
            label="Items Sold Today"
            value={dailySummary?.total_items_sold || 0}
            sub="Units sold"
            variant="metric-blue"
            icon="bi-box-seam"
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <PeriodPanel title="This Week" icon="bi-calendar-week" summary={weeklySummary} formatMoney={formatMoney} />
        </div>
        <div className="col-12 col-lg-6">
          <PeriodPanel title="This Month" icon="bi-calendar-month" summary={monthlySummary} formatMoney={formatMoney} />
        </div>
      </div>

      <h5 className="report-section-title mb-3">Overall Statistics</h5>
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            label="Total Sales"
            value={overallSummary?.total_sales || 0}
            sub="All time transactions"
            variant="metric-blue"
            icon="bi-receipt"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            label="Total Revenue"
            value={formatMoney(overallSummary?.total_revenue || 0)}
            variant="metric-orange"
            icon="bi-currency-dollar"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            label="Total Profit"
            value={formatMoney(overallSummary?.total_profit || 0)}
            variant="metric-teal"
            icon="bi-graph-up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            label="Items Sold"
            value={overallSummary?.total_items_sold || 0}
            sub="All time units"
            variant="metric-dark"
            icon="bi-boxes"
          />
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
            <div>
              <h5 className="card-title mb-1">All Sales</h5>
              <p className="text-muted small mb-0">
                {filteredSales.length} record{filteredSales.length !== 1 ? 's' : ''}
                {hasActiveFilters ? ' (filtered)' : ''}
              </p>
            </div>
          </div>

          <div className="row g-3 mb-4 report-filters">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filterItem" className="form-label fw-semibold small">
                Item
              </label>
              <select
                id="filterItem"
                className="form-select"
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
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filterTeller" className="form-label fw-semibold small">
                Teller
              </label>
              <select
                id="filterTeller"
                className="form-select"
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
            </div>
            <div className="col-12 col-md-6 col-lg-2">
              <label htmlFor="filterStartDate" className="form-label fw-semibold small">
                From
              </label>
              <input
                id="filterStartDate"
                type="date"
                className="form-control"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6 col-lg-2">
              <label htmlFor="filterEndDate" className="form-label fw-semibold small">
                To
              </label>
              <input
                id="filterEndDate"
                type="date"
                className="form-control"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                min={filterStartDate || undefined}
              />
            </div>
            <div className="col-12 col-lg-2 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
              >
                <i className="bi bi-x-circle me-1"></i>
                Clear
              </button>
            </div>
          </div>

          <div className="card border-0 shadow-none">
            <div className="card-body p-0">
              {filteredSales.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-receipt text-muted fs-1 mb-3 d-block"></i>
                  <h5 className="text-muted">No sales found</h5>
                  <p className="text-muted mb-0">
                    {hasActiveFilters ? 'Try adjusting your filters.' : 'No sales recorded yet.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-semibold">Date &amp; Time</th>
                          <th className="border-0 fw-semibold">Item</th>
                          <th className="border-0 fw-semibold">Qty</th>
                          <th className="border-0 fw-semibold">Price</th>
                          <th className="border-0 fw-semibold">Total</th>
                          <th className="border-0 fw-semibold">Teller</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSales.map((sale) => (
                          <tr key={sale.id}>
                            <td className="text-muted">
                              {new Date(sale.sale_date).toLocaleString()}
                            </td>
                            <td className="fw-semibold">{sale.item_name}</td>
                            <td>{sale.quantity}</td>
                            <td>{formatMoney(sale.price || 0)}</td>
                            <td className="fw-semibold">{formatMoney(sale.total || 0)}</td>
                            <td>{sale.teller_name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
