import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saleService, itemService } from '../services';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [todaySales, setTodaySales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [daily, weekly, monthly, salesData] = await Promise.all([
        saleService.getDailySummary(),
        saleService.getWeeklySummary(),
        saleService.getMonthlySummary(),
        saleService.getToday()
      ]);

      setDailySummary(daily);
      setWeeklySummary(weekly);
      setMonthlySummary(monthly);
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
    
    // Auto-refresh data every 10 seconds
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-2 text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
      </div>

      {/* Today's Stats */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 {t('todayStatistics')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="text-sm text-gray-600 mb-1">{t('todaySales')} (Cash)</div>
            <div className="text-2xl font-bold text-green-700">{dailySummary?.total_sales || 0}</div>
            <div className="text-xs text-gray-500">
              ${(dailySummary?.total_revenue || 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">💰 Installment Down Payments</div>
            <div className="text-2xl font-bold text-blue-700">
              ${(dailySummary?.down_payment_income || 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="text-sm text-gray-600 mb-1">📅 Installment Collections</div>
            <div className="text-2xl font-bold text-yellow-700">
              ${(dailySummary?.installment_income || 0).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {dailySummary?.installment_payment_count || 0} payments
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="text-sm text-gray-600 mb-1">💵 {t('todayRevenue')} (Total Received)</div>
            <div className="text-2xl font-bold text-green-700">
              ${(dailySummary?.total_actual_income || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Profit Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="text-sm text-gray-600 mb-1">{t('todayProfit')} (Cash Sales)</div>
            <div className="text-2xl font-bold text-green-700">${(dailySummary?.total_profit || 0).toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{t('itemsSoldToday')}</div>
            <div className="text-2xl font-bold text-gray-700">{dailySummary?.total_items_sold || 0}</div>
          </div>
        </div>
      </div>

      {/* Weekly & Monthly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 {t('thisWeek')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-1">{t('totalSales')} (Cash)</div>
              <div className="text-xl font-bold text-blue-600">{weeklySummary?.total_sales || 0}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-1">💵 Cash Sales {t('revenue')}</div>
              <div className="text-lg font-bold text-green-600">${(weeklySummary?.total_revenue || 0).toFixed(2)}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-1">💰 Installment Down Payments</div>
              <div className="text-lg font-bold text-blue-600">${(weeklySummary?.down_payment_income || 0).toFixed(2)}</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-1">📅 Installment Collections</div>
              <div className="text-lg font-bold text-yellow-600">${(weeklySummary?.installment_income || 0).toFixed(2)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow col-span-2">
              <div className="text-sm text-gray-600 mb-1">💵 Total Actual Income</div>
              <div className="text-xl font-bold text-green-600">${(weeklySummary?.total_actual_income || 0).toFixed(2)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow col-span-2">
              <div className="text-sm text-gray-600 mb-1">{t('profit')} (Cash Sales)</div>
              <div className="text-lg font-bold text-green-600">${(weeklySummary?.total_profit || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📆 {t('thisMonth')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-1">{t('totalSales')} (Cash)</div>
              <div className="text-xl font-bold text-blue-600">{monthlySummary?.total_sales || 0}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-1">💵 Cash Sales {t('revenue')}</div>
              <div className="text-lg font-bold text-green-600">${(monthlySummary?.total_revenue || 0).toFixed(2)}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-1">💰 Installment Down Payments</div>
              <div className="text-lg font-bold text-blue-600">${(monthlySummary?.down_payment_income || 0).toFixed(2)}</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-1">📅 Installment Collections</div>
              <div className="text-lg font-bold text-yellow-600">${(monthlySummary?.installment_income || 0).toFixed(2)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow col-span-2">
              <div className="text-sm text-gray-600 mb-1">💵 Total Actual Income</div>
              <div className="text-xl font-bold text-green-600">${(monthlySummary?.total_actual_income || 0).toFixed(2)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow col-span-2">
              <div className="text-sm text-gray-600 mb-1">{t('profit')} (Cash Sales)</div>
              <div className="text-lg font-bold text-green-600">${(monthlySummary?.total_profit || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
      {isAdmin && lowStock.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ {t('lowStockAlert')}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('itemName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('quantity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('price')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStock.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      item.quantity === 0 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Sales */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('todaySalesList')}</h2>
        {todaySales.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('noSalesToday')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('time')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('item')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('quantity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('total')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payment')}
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('profit')}
                    </th>
                  )}
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('teller')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todaySales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.sale_date).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                        sale.payment_type === 'cash'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sale.payment_type || 'cash'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${(sale.profit || 0).toFixed(2)}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.teller_name}</td>
                    )}
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

export default Dashboard;
