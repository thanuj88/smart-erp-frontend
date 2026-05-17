import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saleService, itemService } from '../services';
import { useTranslation } from 'react-i18next';
import SalesPurchaseChart from '../components/SalesPurchaseChart';

const Dashboard = () => {
  const { isAdmin, user } = useAuth();
  const { t } = useTranslation();
  const [dailySummary, setDailySummary] = useState(null);
  const [todaySales, setTodaySales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState([]);
  const [topRange, setTopRange] = useState('week'); // week | month | overall
  const [summaryRange, setSummaryRange] = useState('1Y');
  const [salesPurchaseSummary, setSalesPurchaseSummary] = useState({
    total_revenue: 0,
    total_purchase: 0,
    total_sales: 0
  });
  const [trendData, setTrendData] = useState([]);

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

      setSalesPurchaseSummary(summary || {
        total_revenue: 0,
        total_purchase: 0,
        total_sales: 0
      });
      setTrendData(trend || []);
    } catch (err) {
      console.error('Failed to load sales/purchase summary', err);
      setSalesPurchaseSummary({
        total_revenue: 0,
        total_purchase: 0,
        total_sales: 0
      });
      setTrendData([]);
    }
  }, [summaryRange]);

  const loadData = useCallback(async () => {
    try {
      const [daily, salesData] = await Promise.all([
        saleService.getDailySummary(),
        saleService.getToday()
      ]);

      setDailySummary(daily);
      setTodaySales(salesData);

      if (isAdmin) {
        const items = await itemService.getAll();
        const lowStockItems = items.filter(item => item.quantity < 10);
        setLowStock(lowStockItems);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
    loadSalesPurchaseSummary();
    
    // Auto-refresh data every 10 seconds
    const interval = setInterval(() => {
      loadData();
      loadSalesPurchaseSummary();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [loadData, loadSalesPurchaseSummary]);

  // Load all sales (for admin) to compute top products
  useEffect(() => {
    loadTopProducts();
  }, [loadTopProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-2 text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  const totalRevenue = dailySummary?.total_actual_income || 0;
  const todayRevenue = dailySummary?.total_revenue || 0;
  const todaySalesCount = dailySummary?.total_sales || 0;
  const totalItemsSold = dailySummary?.total_items_sold || 0;
  

  return (
    <div className="container-fluid matte-page dashboard-page">
      <div className="page-welcome d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h4>Welcome, {user?.name || 'Admin'}</h4>
          <p>Track sales, inventory, and store performance at a glance.</p>
        </div>
        <div className="text-muted small">
          <i className="bi bi-calendar3 me-1"></i>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {isAdmin && lowStock.length > 0 && (
        <div className="alert-dreams mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Your Product <strong>{lowStock[0].name}</strong> is running Low, already below {lowStock[0].quantity} Pcs.
          <a href="/inventory" className="ms-2 fw-semibold text-decoration-none">Manage Inventory</a>
        </div>
      )}

      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card metric-orange">
            <div className="metric-info">
              <small>Today's Revenue</small>
              <h3>${todayRevenue.toFixed(2)}</h3>
              <div className="metric-sub">{totalItemsSold} items sold</div>
            </div>
            <div className="metric-icon">
              <i className="bi bi-currency-dollar fs-4"></i>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card metric-dark">
            <div className="metric-info">
              <small>Today's Sales</small>
              <h3>{todaySalesCount}</h3>
              <div className="metric-sub">{todaySales.length} transactions</div>
            </div>
            <div className="metric-icon">
              <i className="bi bi-basket3 fs-4"></i>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card metric-teal">
            <div className="metric-info">
              <small>Total Revenue</small>
              <h3>${totalRevenue.toFixed(2)}</h3>
              <div className="metric-sub">Total income</div>
            </div>
            <div className="metric-icon">
              <i className="bi bi-graph-up fs-4"></i>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card metric-blue">
            <div className="metric-info">
              <small>Items Sold</small>
              <h3>{totalItemsSold}</h3>
              <div className="metric-sub">Total items</div>
            </div>
            <div className="metric-icon">
              <i className="bi bi-box-seam fs-4"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4 dashboard-main-row align-items-stretch">
        <div className="col-12 col-xl-8 dashboard-chart-col">
          <SalesPurchaseChart
            summaryRange={summaryRange}
            onRangeChange={setSummaryRange}
            summary={salesPurchaseSummary}
            trendData={trendData}
          />
        </div>
        <div className="col-12 col-xl-4 dashboard-side-col">
          <div className="dashboard-side-stack h-100">
            <div className="card shadow-sm rounded-4 dashboard-side-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="card-title mb-0">Low Stock Alerts</h5>
                  {isAdmin && (
                    <a href="/inventory" className="text-decoration-none small text-primary">Manage →</a>
                  )}
                </div>
                <div className="list-group list-group-flush">
                  {lowStock.length === 0 ? (
                    <div className="text-muted small">No low stock alerts at the moment.</div>
                  ) : (
                    lowStock.slice(0, 5).map((item) => (
                      <div key={item.id} className="list-group-item px-0 border-0 d-flex justify-content-between align-items-center py-2">
                        <div className="small">{item.name}</div>
                        <span className="badge bg-warning text-dark rounded-pill">{item.quantity} left</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="card shadow-sm rounded-4 dashboard-side-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="card-title mb-0">Top Products</h5>
                  <i className="bi bi-award-fill text-primary"></i>
                </div>
                <div className="list-group list-group-flush top-products">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="small text-muted">Top Selling</div>
                    <select className="form-select form-select-sm" value={topRange} onChange={(e) => setTopRange(e.target.value)} style={{ width: '8.5rem' }}>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="overall">Overall</option>
                    </select>
                  </div>
                  {topProducts.length === 0 ? (
                    <div className="text-muted small">No sales data available.</div>
                  ) : (
                    topProducts.map((p, idx) => (
                      <div key={p.name} className="list-group-item px-0 border-0 d-flex justify-content-between align-items-center py-2">
                        <div>
                          <strong className="small">{p.name}</strong>
                          <div className="text-muted small">{p.qty} sold</div>
                        </div>
                        <span className={`badge ${idx === 0 ? 'bg-primary' : 'bg-secondary'} rounded-pill`}>#{idx + 1}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm rounded-4">
            <div className="card-body">
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-4 gap-3">
                <div>
                  <h5 className="card-title">Recent Sales</h5>
                  <p className="text-muted mb-0">Latest sales activity from today.</p>
                </div>
                <span className="badge bg-info text-dark rounded-pill py-2 px-3">{todaySales.length} total</span>
              </div>
              <div className="table-responsive">
                <table className="table table-borderless align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Receipt #</th>
                      <th>Time</th>
                      <th>Items</th>
                      <th>Payment</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaySales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">No sales recorded today.</td>
                      </tr>
                    ) : (
                      todaySales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="fw-semibold">#{sale.id}</td>
                          <td>{new Date(sale.sale_date).toLocaleString()}</td>
                          <td>{sale.quantity}</td>
                          <td>
                            <span className={`badge rounded-pill ${sale.payment_type === 'cash' ? 'bg-success' : 'bg-primary'}`}>
                              {sale.payment_type || 'Cash'}
                            </span>
                          </td>
                          <td className="fw-semibold">${sale.total.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default Dashboard;
