import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            Cookies.remove('admin_token');
            sessionStorage.removeItem('admin_user');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

export const authAPI = {
    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { token, user } = response.data;

        // Store token and user data
        const isSecure = process.env.NODE_ENV === 'production';
        Cookies.set('admin_token', token, { expires: 7, secure: isSecure, sameSite: 'lax' });
        sessionStorage.setItem('admin_user', JSON.stringify(user));

        return { token, user };
    },

    logout: async () => {
        // For Sanctum token-based auth, we only need to clear local storage
        // No need to call the backend as tokens are stateless
        Cookies.remove('admin_token');
        sessionStorage.removeItem('admin_user');
    },

    getUser: () => {
        const userStr = sessionStorage.getItem('admin_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    registerSuperAdmin: async (data) => {
        const response = await apiClient.post('/auth/register-super-admin', data);
        const { token, user } = response.data;

        // Store token and user data
        const isSecure = process.env.NODE_ENV === 'production';
        Cookies.set('admin_token', token, { expires: 7, secure: isSecure, sameSite: 'lax' });
        sessionStorage.setItem('admin_user', JSON.stringify(user));

        return response.data;
    },

    isAuthenticated: () => {
        return !!Cookies.get('admin_token');
    },
};

// ============================================================================
// PROPERTY APIs
// ============================================================================

export const propertyAPI = {
    getAll: async () => {
        const response = await apiClient.get('/properties');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/properties/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/properties', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/properties/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/properties/${id}`);
        return response.data;
    },

    addUnit: async (propertyId, data) => {
        const response = await apiClient.post(`/properties/${propertyId}/units`, data);
        return response.data;
    },
};

// ===========================================================================
// Images upload APIs
// ===========================================================================

export const uploadAPI = {
    upload: async (formData) => {
        const response = await apiClient.post('/upload', formData);
        return response.data;
    }
};

// ============================================================================
// UNIT APIs
// ============================================================================

export const unitAPI = {
    getAll: async () => {
        const response = await apiClient.get('/properties/units');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/properties/units/${id}`);
        return response.data;
    },

    create: async (data, id) => {
        const response = await apiClient.post(`/properties/${id}/units`, data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/properties/units/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/properties/units/${id}`);
        return response.data;
    },
};

// ============================================================================
// TENANT APIs
// ============================================================================

export const tenantAPI = {
    getAll: async () => {
        const response = await apiClient.get('/tenants');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/tenants/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/tenants', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/tenants/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/tenants/${id}`);
        return response.data;
    },

    assignUnit: async (tenantId, data) => {
        const response = await apiClient.post(`/tenants/${tenantId}/assign-unit`, data);
        return response.data;
    },

    getPaymentHistory: async (tenantId) => {
        const response = await apiClient.get(`/tenants/${tenantId}/payment-history`);
        return response.data;
    },
};

// ============================================================================
// FINANCE APIs
// ============================================================================

export const financeAPI = {
    // Invoices
    getInvoices: async () => {
        const response = await apiClient.get('/finance/invoices');
        return response.data;
    },

    getInvoice: async (id) => {
        const response = await apiClient.get(`/finance/invoices/${id}`);
        return response.data;
    },

    generateInvoice: async (data) => {
        const response = await apiClient.post('/finance/invoices/generate', data);
        return response.data;
    },

    // Payments
    getPayments: async () => {
        const response = await apiClient.get('/finance/payments');
        return response.data;
    },

    recordPayment: async (data) => {
        const response = await apiClient.post('/finance/payments', data);
        return response.data;
    },

    // Reports
    getRevenueReport: async () => {
        const response = await apiClient.get('/finance/reports/revenue');
        return response.data;
    },

    getExpenseReport: async () => {
        const response = await apiClient.get('/finance/reports/expenses');
        return response.data;
    },
};

// ============================================================================
// MAINTENANCE APIs
// ============================================================================

export const maintenanceAPI = {
    getAll: async () => {
        const response = await apiClient.get('/maintenance');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/maintenance/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/maintenance', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/maintenance/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/maintenance/${id}`);
        return response.data;
    },
};

// ============================================================================
// EXPENSE APIs
// ============================================================================

export const expenseAPI = {
    getAll: async () => {
        const response = await apiClient.get('/expenses');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/expenses/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/expenses', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/expenses/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/expenses/${id}`);
        return response.data;
    },
};

// ============================================================================
// COMMUNICATION APIs
// ============================================================================

export const communicationAPI = {
    getLogs: async () => {
        const response = await apiClient.get('/communications/logs');
        return response.data;
    },

    send: async (data) => {
        const response = await apiClient.post('/communications/send', data);
        return response.data;
    },
};

// ============================================================================
// SUPER ADMIN APIs
// ============================================================================

export const superAdminAPI = {
    // Admin Management
    getAdmins: async () => {
        const response = await apiClient.get('/super-admin/admins');
        return response.data;
    },

    createAdmin: async (data) => {
        const response = await apiClient.post('/super-admin/admins', data);
        return response.data;
    },

    updateAdmin: async (id, data) => {
        const response = await apiClient.post(`/super-admin/admins/${id}`, data);
        return response.data;
    },

    deleteAdmin: async (id) => {
        const response = await apiClient.delete(`/super-admin/admins/${id}`);
        return response.data;
    },

    suspendAdmin: async (id) => {
        const response = await apiClient.post(`/super-admin/admins/${id}/suspend`);
        return response.data;
    },

    activateAdmin: async (id) => {
        const response = await apiClient.post(`/super-admin/admins/${id}/activate`);
        return response.data;
    },

    // Activity Logs
    getActivityLogs: async () => {
        const response = await apiClient.get('/super-admin/activity-logs');
        return response.data;
    },

    // Settings
    getSettings: async () => {
        const response = await apiClient.get('/super-admin/settings');
        return response.data;
    },

    updateSettings: async (data) => {
        const response = await apiClient.put('/super-admin/settings', data);
        return response.data;
    },
};

// ============================================================================
// DASHBOARD APIs
// ============================================================================

export const dashboardAPI = {
    getStats: async () => {
        const response = await apiClient.get('/dashboard/stats');
        return response.data;
    },

    getRecentActivity: async () => {
        const response = await apiClient.get('/dashboard/recent-activity');
        return response.data;
    },

    getRevenueChart: async () => {
        const response = await apiClient.get('/dashboard/revenue-chart');
        return response.data;
    },
};

// ============================================================================
// PUBLIC APIs (No authentication required)
// ============================================================================

export const publicAPI = {
    getProperties: async (filters = {}) => {
        const response = await axios.get(`${API_BASE_URL}/public/properties`, { params: filters });
        return response.data;
    },

    getProperty: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/public/properties/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await axios.get(`${API_BASE_URL}/public/stats`);
        return response.data;
    },

    submitContactForm: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/public/contact`, data);
        return response.data;
    },
};

// ============================================================================
// MEDIA APIs
// ============================================================================

export const mediaAPI = {
    upload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Export the axios instance for custom requests if needed
export default apiClient;