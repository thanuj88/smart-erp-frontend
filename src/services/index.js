import api from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export const itemService = {
  getAll: async () => {
    const response = await api.get('/items');
    return response.data;
  },

  getAvailable: async () => {
    const response = await api.get('/items/available');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  getByCategory: async (categoryId) => {
    const response = await api.get(`/items/category/${categoryId}`);
    return response.data;
  },

  create: async (itemData) => {
    const response = await api.post('/items', itemData);
    return response.data;
  },

  update: async (id, itemData) => {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  search: async (query) => {
    const response = await api.get(`/items/search?q=${query}`);
    return response.data;
  },
};

export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  update: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  search: async (query) => {
    const response = await api.get(`/categories/search?q=${query}`);
    return response.data;
  },
};

export const saleService = {
  processCashSale: async (itemId, quantity) => {
    const response = await api.post('/sales/cash', { itemId, quantity });
    return response.data;
  },

  processInstallmentSale: async (saleData) => {
    const response = await api.post('/sales/installment', saleData);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/sales');
    return response.data;
  },

  getToday: async () => {
    const response = await api.get('/sales/today');
    return response.data;
  },

  getDailySummary: async () => {
    const response = await api.get('/sales/summary/daily');
    return response.data;
  },

  getWeeklySummary: async () => {
    const response = await api.get('/sales/summary/weekly');
    return response.data;
  },

  getMonthlySummary: async () => {
    const response = await api.get('/sales/summary/monthly');
    return response.data;
  },

  getOverallSummary: async () => {
    const response = await api.get('/sales/summary/overall');
    return response.data;
  },

  getByDateRange: async (startDate, endDate) => {
    const response = await api.get(`/sales/date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  getSummary: async (range = '1Y') => {
    const response = await api.get(`/sales/summary?range=${range}`);
    return response.data;
  },

  getTrend: async (range = '1Y') => {
    const response = await api.get(`/sales/summary/trend?range=${range}`);
    return response.data;
  },

  getTop: async (range = 'week', limit = 6) => {
    const response = await api.get(`/sales/top?range=${range}&limit=${limit}`);
    return response.data;
  },
};

export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const installmentSettingsService = {
  getAll: async () => {
    const response = await api.get('/installment-settings');
    return response.data;
  },

  update: async (settings) => {
    const response = await api.put('/installment-settings', settings);
    return response.data;
  },

  delete: async (months) => {
    const response = await api.delete(`/installment-settings/${months}`);
    return response.data;
  },
};

export const customerService = {
  getAll: async () => {
    const response = await api.get('/customers');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  search: async (query) => {
    const response = await api.get(`/customers/search?q=${query}`);
    return response.data;
  },
};

export const installmentPlanService = {
  getAll: async () => {
    const response = await api.get('/installment-plans');
    return response.data;
  },

  getActive: async () => {
    const response = await api.get('/installment-plans/active');
    return response.data;
  },

  getCompleted: async () => {
    const response = await api.get('/installment-plans/completed');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/installment-plans/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/installment-plans/${id}/status`, { status });
    return response.data;
  },
};

export const installmentPaymentService = {
  getPending: async () => {
    const response = await api.get('/installment-payments/pending');
    return response.data;
  },

  getOverdue: async () => {
    const response = await api.get('/installment-payments/overdue');
    return response.data;
  },

  recordPayment: async (id, amountPaid, notes) => {
    const response = await api.post(`/installment-payments/${id}/pay`, {
      amountPaid,
      notes,
    });
    return response.data;
  },
};
