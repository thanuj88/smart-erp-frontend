import api from './api';

function persistAuth(data) {
  const access = data.accessToken || data.token;
  if (access) localStorage.setItem('token', access);
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
}

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    persistAuth(response.data);
    return response.data;
  },

  loginPin: async (username, pin, tenantId, branchId) => {
    const response = await api.post('/auth/login/pin', { username, pin, tenantId, branchId });
    persistAuth(response.data);
    return response.data;
  },

  register: async (payload) => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        /* session cleared locally regardless */
      }
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  listBranches: async (tenantId) => {
    const response = await api.get(`/auth/branches?tenantId=${tenantId}`);
    return response.data;
  },
};

export const platformService = {
  getReports: async () => {
    const response = await api.get('/platform/reports');
    return response.data;
  },
  listTenants: async () => {
    const response = await api.get('/platform/tenants');
    return response.data;
  },
  createTenant: async (payload) => {
    const response = await api.post('/platform/tenants', payload);
    return response.data;
  },
  assignTenantPlan: async (tenantId, planCode) => {
    const response = await api.put(`/platform/tenants/${tenantId}/plan`, { planCode });
    return response.data;
  },
  listPlans: async () => {
    const response = await api.get('/platform/plans');
    return response.data;
  },
  createPlan: async (payload) => {
    const response = await api.post('/platform/plans', payload);
    return response.data;
  },
  listUsers: async () => {
    const response = await api.get('/platform/users');
    return response.data;
  },
  createUser: async (payload) => {
    const response = await api.post('/platform/users', payload);
    return response.data;
  },
  updateUser: async (id, payload) => {
    const response = await api.put(`/platform/users/${id}`, payload);
    return response.data;
  },
  listPermissions: async () => {
    const response = await api.get('/platform/permissions');
    return response.data;
  },
  createPermission: async (payload) => {
    const response = await api.post('/platform/permissions', payload);
    return response.data;
  },
  listRoles: async () => {
    const response = await api.get('/platform/roles');
    return response.data;
  },
  createRole: async (payload) => {
    const response = await api.post('/platform/roles', payload);
    return response.data;
  },
  getRole: async (code) => {
    const response = await api.get(`/platform/roles/${code}`);
    return response.data;
  },
  updateRolePermissions: async (code, permissions) => {
    const response = await api.put(`/platform/roles/${code}/permissions`, { permissions });
    return response.data;
  },
};

/** Capability codes used for UI gating (must match backend PERMISSIONS) */
export const PERMISSIONS = {
  SALES_CREATE: 'sales:create',
  SALES_VIEW: 'sales:view',
  INVENTORY_MANAGE: 'inventory:manage',
  INVENTORY_VIEW: 'inventory:view',
  REPORTS_VIEW: 'reports:view',
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
  SUBSCRIPTION_MANAGE: 'subscription:manage',
  PLATFORM_MANAGE: 'platform:manage',
  TENANTS_VIEW: 'tenants:view',
  TENANTS_MANAGE: 'tenants:manage',
  ROLES_MANAGE: 'roles:manage',
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
