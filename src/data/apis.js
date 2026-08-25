import axios from "axios";
import Cookies from "js-cookie";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

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
        const isSuperAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/super-admin');
        const errorCode = error.response?.data?.error_code;

        if (error.response?.status === 401 || (error.response?.status === 403 && isSuperAdminRoute)) {
            // Token expired, invalid, or insufficient privilege for super-admin portal
            Cookies.remove('admin_token');
            sessionStorage.removeItem('admin_user');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login?error=session_expired';
            }
        } else if (error.response?.status === 403 && ['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED', 'ACCOUNT_SUSPENDED'].includes(errorCode)) {
            // Immediate forced logout when trial/subscription expires with insufficient wallet balance
            Cookies.remove('admin_token');
            sessionStorage.removeItem('admin_user');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                const msg = error.response.data?.message || 'Your account has expired. Please log in to top up.';
                window.location.href = `/login?error=${errorCode.toLowerCase()}&msg=${encodeURIComponent(msg)}`;
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
        const { token, user, must_change_password } = response.data;

        // Store token and user data
        const isSecure = process.env.NODE_ENV === 'production';
        Cookies.set('admin_token', token, { expires: 7, secure: isSecure, sameSite: 'lax' });
        sessionStorage.setItem('admin_user', JSON.stringify(user));

        return { token, user, must_change_password };
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

    updateUser: (user) => {
        sessionStorage.setItem('admin_user', JSON.stringify(user));
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

    forgotPassword: async (email) => {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (data) => {
        const response = await apiClient.post('/auth/reset-password', data);
        return response.data;
    }
};

// ============================================================================
// PROPERTY APIs
// ============================================================================

export const propertyAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/properties', { params });
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

    bulkAddUnits: async (propertyId, data) => {
        const response = await apiClient.post(`/properties/${propertyId}/units/bulk`, data);
        return response.data;
    },
};

// ===========================================================================
// Images upload APIs
// ===========================================================================

export const uploadAPI = {
    upload: async (formData) => {
        const response = await apiClient.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    }
};

// ============================================================================
// UNIT APIs
// ============================================================================

export const unitAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/properties/units', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/properties/units/${id}`);
        return response.data;
    },

    create: async (id, data) => {
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
    getAll: async (params = {}) => {
        const response = await apiClient.get('/tenants', { params });
        return response.data;
    },

    getActive: async (params = {}) => {
        const response = await apiClient.get('/tenants/active', { params });
        return response.data;
    },

    getHistory: async (params = {}) => {
        const response = await apiClient.get('/tenants/history', { params });
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

    toggleStatus: async (tenantId, data) => {
        const response = await apiClient.post(`/tenants/${tenantId}/toggle-status`, data);
        return response.data;
    },

    sendBalanceReminders: async () => {
        const response = await apiClient.post('/tenants/send-reminders');
        return response.data;
    },
};

// ============================================================================
// FINANCE APIs
// ============================================================================

export const financeAPI = {
    // Invoices
    getInvoices: async (params = {}) => {
        const response = await apiClient.get('/finance/invoices', { params });
        return response.data;
    },

    getInvoice: async (id) => {
        const response = await apiClient.get(`/finance/invoices/${id}`);
        return response.data;
    },

    generateInvoice: async (data = {}) => {
        const response = await apiClient.post('/finance/invoices/generate', data);
        return response.data;
    },

    generateMonthlyInvoices: async (data = {}) => {
        const response = await apiClient.post('/finance/invoices/generate-monthly', data);
        return response.data;
    },

    // Payments
    getPayments: async (params = {}) => {
        const response = await apiClient.get('/finance/payments', { params });
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

    getPropertyReport: async (params = {}) => {
        const response = await apiClient.get('/finance/reports/property', { params });
        return response.data;
    },

    getTenantReport: async (params = {}) => {
        const response = await apiClient.get('/finance/reports/tenant', { params });
        return response.data;
    },

    getUnitReport: async (params = {}) => {
        const response = await apiClient.get('/finance/reports/unit', { params });
        return response.data;
    },
    getTransactions: async (params = {}) => {
        const response = await apiClient.get('/mpesa/transactions', { params });
        return response.data;
    },
    registerC2BUrls: async () => {
        const response = await apiClient.post('/payments-adapter/register-c2b-urls');
        return response.data;
    },
    reconcileTransaction: async (data) => {
        const response = await apiClient.post('/mpesa/reconcile', data);
        return response.data;
    },
    triggerC2BSimulation: async (data) => {
        const response = await apiClient.post('/mpesa/simulate-c2b', data);
        return response.data;
    },
};

// ============================================================================
// MAINTENANCE APIs
// ============================================================================

export const maintenanceAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/maintenance', { params });
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
    getAll: async (params = {}) => {
        const response = await apiClient.get('/expenses', { params });
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
    getLogs: async (params = {}) => {
        const response = await apiClient.get('/communications/logs', { params });
        return response.data;
    },

    send: async (data) => {
        const response = await apiClient.post('/communications/send', data);
        return response.data;
    },
    getNotifications: async () => {
        const response = await apiClient.get('/user/notifications');
        return response.data;
    },

};

// ============================================================================
// ADMIN / TEAM MANAGEMENT APIs
// ============================================================================

export const adminAPI = {
    getAdmins: async (params = {}) => {
        const response = await apiClient.get('/admins', { params });
        return response.data;
    },

    createAdmin: async (data) => {
        const response = await apiClient.post('/admins', data);
        return response.data;
    },

    updateAdmin: async (id, data) => {
        const response = await apiClient.put(`/admins/${id}`, data);
        return response.data;
    },

    deleteAdmin: async (id) => {
        const response = await apiClient.delete(`/admins/${id}`);
        return response.data;
    },

    suspendAdmin: async (id) => {
        const response = await apiClient.post(`/admins/${id}/suspend`);
        return response.data;
    },

    activateAdmin: async (id) => {
        const response = await apiClient.post(`/admins/${id}/activate`);
        return response.data;
    },
};

// ============================================================================
// ACTIVITY LOG APIs
// ============================================================================

export const activityAPI = {
    getActivityLogs: async (params = {}) => {
        const response = await apiClient.get('/activity-logs', { params });
        return response.data;
    },
};

// ============================================================================
// SUPER ADMIN APIs
// ============================================================================

export const superAdminAPI = {
    // Admin Management (Legacy/Alias)
    getAdmins: async (params = {}) => {
        const response = await apiClient.get('/admins', { params });
        return response.data;
    },

    createAdmin: async (data) => {
        const response = await apiClient.post('/admins', data);
        return response.data;
    },

    updateAdmin: async (id, data) => {
        const response = await apiClient.put(`/admins/${id}`, data);
        return response.data;
    },

    deleteAdmin: async (id) => {
        const response = await apiClient.delete(`/admins/${id}`);
        return response.data;
    },

    suspendAdmin: async (id) => {
        const response = await apiClient.post(`/admins/${id}/suspend`);
        return response.data;
    },

    activateAdmin: async (id) => {
        const response = await apiClient.post(`/admins/${id}/activate`);
        return response.data;
    },

    // Activity Logs
    getActivityLogs: async (params = {}) => {
        const response = await apiClient.get('/activity-logs', { params });
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
    deletePayment: async (id) => {
        const response = await apiClient.delete(`/super-admin/payments/${id}`);
        return response.data;
    },

    // Subscription billing (super admin)
    getSubscriptionBilling: async () => {
        const response = await apiClient.get('/super-admin/subscription/billing');
        return response.data;
    },

    getAllSubscriptionPayments: async (params = {}) => {
        const response = await apiClient.get('/super-admin/subscription/payments', { params });
        return response.data;
    },

    recordSubscriptionPayment: async (data) => {
        const response = await apiClient.post('/super-admin/subscription/record-payment', data);
        return response.data;
    },

    adjustWalletBalance: async (data) => {
        const response = await apiClient.post('/super-admin/subscription/adjust-wallet', data);
        return response.data;
    },

    getOrgSubscriptionPayments: async (orgId, params = {}) => {
        const response = await apiClient.get(`/super-admin/subscription/org/${orgId}/payments`, { params });
        return response.data;
    },
};

// ============================================================================
// BILLING APIs (Landlord self-service)
// ============================================================================

export const billingAPI = {
    getMyBillingStatus: async () => {
        const response = await apiClient.get('/billing/status');
        return response.data;
    },

    getMyPayments: async (params = {}) => {
        const response = await apiClient.get('/billing/payments', { params });
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

    getSearchOptions: async () => {
        const response = await axios.get(`${API_BASE_URL}/public/search-options`);
        return response.data;
    },

    getProperty: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/public/properties/${id}`);
        return response.data;
    },

    getUnits: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/public/properties/${id}/units`);
        return response.data;
    },

    getUnit: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/public/properties/units/${id}`);
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

    getAgencies: async () => {
        const response = await axios.get(`${API_BASE_URL}/public/agencies`);
        return response.data;
    },

    getAgencyProperties: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/public/agencies/${id}/properties`);
        return response.data;
    },

    getSettings: async () => {
        const response = await axios.get(`${API_BASE_URL}/public/settings`);
        return response.data;
    },
};

// ============================================================================
// REPAIRS APIs
// ============================================================================

export const repairAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/repairs', { params });
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/repairs', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/repairs/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/repairs/${id}`);
        return response.data;
    },

    charge: async (id) => {
        const response = await apiClient.post(`/repairs/${id}/charge`);
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

// ============================================================================
// SAAS & SUBSCRIPTION APIs
// ============================================================================

export const saasAPI = {
    registerOrganization: async (data) => {
        const response = await apiClient.post('/auth/register-organization', data);
        return response.data;
    },

    getPlans: async () => {
        const response = await apiClient.get('/saas/plans');
        return response.data;
    },

    getSubscriptionStatus: async () => {
        const response = await apiClient.get('/saas/subscription-status');
        return response.data;
    },

    upgradePlan: async (data) => {
        const response = await apiClient.post('/saas/upgrade', data);
        return response.data;
    },

    getSuperAdminOverview: async (params = {}) => {
        const response = await apiClient.get('/super-admin/saas/overview', { params });
        return response.data;
    },

    updateOrganizationStatus: async (id, data) => {
        const response = await apiClient.put(`/super-admin/saas/organizations/${id}`, data);
        return response.data;
    },

    updatePlan: async (id, data) => {
        const response = await apiClient.put(`/super-admin/saas/plans/${id}`, data);
        return response.data;
    },

    getOrganizationsWithUsers: async (params = {}) => {
        const response = await apiClient.get('/super-admin/organizations', { params });
        return response.data;
    },

    getSaasReports: async (params = {}) => {
        const response = await apiClient.get('/super-admin/saas/reports', { params });
        return response.data;
    },

    getSaasMonthAudit: async (params = {}) => {
        const response = await apiClient.get('/super-admin/saas/reports/month-audit', { params });
        return response.data;
    },
};

// ============================================================================
// ORGANIZATION / LANDLORD SETTINGS APIs
// ============================================================================

export const orgSettingsAPI = {
    getSettings: async () => {
        const response = await apiClient.get('/organization/settings');
        return response.data;
    },

    updateSettings: async (data) => {
        const response = await apiClient.put('/organization/settings', data);
        return response.data;
    },
};

// Export the axios instance for custom requests if needed
export default apiClient;