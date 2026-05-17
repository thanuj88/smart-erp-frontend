import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import { saleService } from '../services';

const SalesReport = () => {
  const [sales, setSales] = useState([]);
  const [overallSummary, setOverallSummary] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [salesData, summaryData, daily, weekly, monthly] = await Promise.all([
        saleService.getAll(),
        saleService.getOverallSummary(),
        saleService.getDailySummary(),
        saleService.getWeeklySummary(),
        saleService.getMonthlySummary(),
      ]);
      setSales(salesData);
      setOverallSummary(summaryData);
      setDailySummary(daily);
      setWeeklySummary(weekly);
      setMonthlySummary(monthly);
    } catch (err) {
      console.error('Error loading sales report:', err);
      setError('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh data every 10 seconds
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDateFilter = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await saleService.getByDateRange(startDate, endDate);
      setSales(data);
    } catch (err) {
      console.error('Error filtering sales:', err);
      setError('Failed to filter sales');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    loadData();
  };

  if (loading) {
    return <AdminLoading message="Loading sales report..." />;
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page report-page">
      <PageHeader
        title="Sales Report"
        subtitle="View sales performance, revenue, and transaction history."
      />

      <AdminAlerts error={error} onClearError={() => setError('')} />

      {/* Today's Statistics */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">📊</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Today's Statistics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800 mb-1">Cash Sales Today</div>
            <div className="text-2xl font-bold text-green-900">{dailySummary?.total_sales || 0}</div>
            <div className="text-sm text-green-600 mt-1">
              ${(dailySummary?.total_revenue || 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800 mb-1">💰 Down Payments</div>
            <div className="text-2xl font-bold text-blue-900">
              ${(dailySummary?.down_payment_income || 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-800 mb-1">📅 Installment Collections</div>
            <div className="text-2xl font-bold text-orange-900">
              ${(dailySummary?.installment_income || 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800 mb-1">💵 Total Actual Income</div>
            <div className="text-2xl font-bold text-green-900">
              ${(dailySummary?.total_actual_income || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800 mb-1">Today's Profit (Cash Sales)</div>
            <div className="text-2xl font-bold text-green-900">
              ${(dailySummary?.total_profit || 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-800 mb-1">Items Sold Today</div>
            <div className="text-2xl font-bold text-orange-900">
              {dailySummary?.total_items_sold || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly & Monthly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Cash Sales</div>
              <div className="text-xl font-bold text-blue-900">
                {weeklySummary?.total_sales || 0} - ${(weeklySummary?.total_revenue || 0).toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">💰 Down Payments</div>
              <div className="text-xl font-bold text-blue-900">
                ${(weeklySummary?.down_payment_income || 0).toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">📅 Installment Collections</div>
              <div className="text-xl font-bold text-orange-900">
                ${(weeklySummary?.installment_income || 0).toFixed(2)}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-1">💵 Total Actual Income</div>
              <div className="text-2xl font-bold text-green-900">
                ${(weeklySummary?.total_actual_income || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📆</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Cash Sales</div>
              <div className="text-xl font-bold text-blue-900">
                {monthlySummary?.total_sales || 0} - ${(monthlySummary?.total_revenue || 0).toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">💰 Down Payments</div>
              <div className="text-xl font-bold text-blue-900">
                ${(monthlySummary?.down_payment_income || 0).toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">📅 Installment Collections</div>
              <div className="text-xl font-bold text-orange-900">
                ${(monthlySummary?.installment_income || 0).toFixed(2)}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-1">💵 Total Actual Income</div>
              <div className="text-2xl font-bold text-green-900">
                ${(monthlySummary?.total_actual_income || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">📈</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Overall Statistics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800 mb-1">Total Sales</div>
            <div className="text-2xl font-bold text-blue-900">{overallSummary?.total_sales || 0}</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-green-900">
              ${(overallSummary?.total_revenue || 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800 mb-1">Total Profit</div>
            <div className="text-2xl font-bold text-green-900">
              ${(overallSummary?.total_profit || 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-800 mb-1">Total Items Sold</div>
            <div className="text-2xl font-bold text-orange-900">{overallSummary?.total_items_sold || 0}</div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">🔍</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Filter by Date Range</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex-1">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button onClick={handleDateFilter} className="btn btn-primary">
            Apply Filter
          </button>

          <button onClick={handleClearFilter} className="btn btn-outline-secondary">
            Clear
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">All Sales</h2>
        </div>

        {sales.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sales found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teller
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.sale_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${sale.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.teller_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
