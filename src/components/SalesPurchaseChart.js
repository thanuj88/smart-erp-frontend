import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useCurrency } from '../contexts/TenantSettingsContext';

const RANGES = ['1D', '1W', '1M', '3M', '6M', '1Y'];

const formatCompact = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${Math.round(n)}`;
};

const niceMax = (value) => {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
};

const SalesPurchaseChart = ({
  summaryRange,
  onRangeChange,
  summary,
  trendData,
}) => {
  const { formatMoney } = useCurrency();
  const chartModel = useMemo(() => {
    const points = trendData || [];
    const stackMax = Math.max(
      ...points.map((p) => (p.sales || 0) + (p.purchase || 0)),
      1
    );
    const axisMax = niceMax(stackMax);
    const ticks = Array.from({ length: 6 }, (_, i) => {
      const value = (axisMax / 5) * i;
      return { index: i, value, label: formatCompact(value) };
    }).reverse();

    return { points, axisMax, ticks };
  }, [trendData]);

  const totalPurchase = summary?.total_purchase || 0;
  const totalSales = summary?.total_revenue || 0;

  return (
    <div className="card shadow-sm rounded-4 sales-purchase-card">
      <div className="card-body">
        <div className="sp-header">
          <div className="sp-title-wrap">
            <span className="sp-title-icon">
              <i className="bi bi-bar-chart-line"></i>
            </span>
            <div>
              <h5 className="sp-title mb-0">Sales &amp; Purchase</h5>
              <p className="sp-subtitle mb-0">View sales and purchase totals over the selected timeframe.</p>
            </div>
          </div>
          <div className="sales-purchase-tabs" aria-label="Timeframe selector">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                className={`sp-range-btn${summaryRange === range ? ' active' : ''}`}
                onClick={() => onRangeChange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="sp-legend-row">
          <div className="sp-legend-chip">
            <span className="legend-dot legend-purchase" />
            <span className="sp-legend-label">Total Purchase</span>
            <strong className="sp-legend-value">{formatCompact(totalPurchase)}</strong>
          </div>
          <div className="sp-legend-chip">
            <span className="legend-dot legend-sales" />
            <span className="sp-legend-label">Total Sales</span>
            <strong className="sp-legend-value">{formatCompact(totalSales)}</strong>
          </div>
        </div>

        <div className="sp-chart-area">
          <div className="sp-y-axis" aria-hidden="true">
            {chartModel.ticks.map((tick) => (
              <span key={`y-tick-${tick.index}-${tick.value}`} className="sp-y-tick">
                {tick.label}
              </span>
            ))}
          </div>

          <div className="sp-chart-main">
            <div className="sp-grid-lines" aria-hidden="true">
              {chartModel.ticks.map((tick) => (
                <span key={`grid-${tick.index}-${tick.value}`} className="sp-grid-line" />
              ))}
            </div>

            {chartModel.points.length === 0 ? (
              <div className="sp-chart-empty">No trend data available for this range.</div>
            ) : (
              <div className="sp-bars">
                {chartModel.points.map((point, idx) => {
                  const purchase = point.purchase || 0;
                  const sales = point.sales || 0;
                  const stackTotal = purchase + sales;
                  const barHeightPct = (stackTotal / chartModel.axisMax) * 100;
                  const purchasePct = stackTotal > 0 ? (purchase / stackTotal) * 100 : 0;
                  const salesPct = stackTotal > 0 ? (sales / stackTotal) * 100 : 0;

                  return (
                    <div
                      key={`${point.label}-${idx}`}
                      className="sp-bar-column"
                      title={`${point.label}: Sales ${formatMoney(sales)}, Purchase ${formatMoney(purchase)}`}
                    >
                      <div className="sp-bar-track">
                        <div
                          className="sp-bar-stack"
                          style={{ height: `${Math.max(barHeightPct, stackTotal > 0 ? 4 : 0)}%` }}
                        >
                          <div
                            className="sp-bar-segment sp-bar-purchase"
                            style={{ height: `${purchasePct}%` }}
                          />
                          <div
                            className="sp-bar-segment sp-bar-sales"
                            style={{ height: `${salesPct}%` }}
                          />
                        </div>
                      </div>
                      <span className="sp-bar-label">{point.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

SalesPurchaseChart.propTypes = {
  summaryRange: PropTypes.string.isRequired,
  onRangeChange: PropTypes.func.isRequired,
  summary: PropTypes.shape({
    total_purchase: PropTypes.number,
    total_revenue: PropTypes.number,
    total_sales: PropTypes.number,
  }),
  trendData: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      sales: PropTypes.number,
      purchase: PropTypes.number,
    })
  ),
};

export default SalesPurchaseChart;
