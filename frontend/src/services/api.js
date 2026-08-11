// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'https://api.vatapex.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// ===== 全局 fetch 拦截 =====
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (typeof url === 'string' && url.startsWith('/api/v1/')) {
        url = API_BASE_URL + url;
    }
    return originalFetch.call(this, url, options);
};

// 请求拦截器 - 添加 Token 和 Tenant ID
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // ===== 添加租户ID到请求头 =====
        if (tenantId) {
            config.headers['X-Tenant-ID'] = tenantId;
        }
        
        console.log('📤 API 请求:', config.method.toUpperCase(), config.url, {
            tenantId: tenantId,
            data: config.data || ''
        });
        return config;
    },
    (error) => {
        console.error('❌ 请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        console.log('📥 API 响应:', response.config.url, response.status);
        return response.data;
    },
    (error) => {
        console.error('❌ API 响应错误:', error);
        
        if (error.response) {
            if (error.response.status === 401) {
                const currentPath = window.location.pathname;
                const isLoginPage = currentPath === '/login';
                const isLoginRequest = error.config?.url?.includes('/auth/login');
                
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('tenantId');
                
                if (isLoginRequest) {
                    return Promise.reject({
                        status: 401,
                        message: '用户名或密码错误'
                    });
                }
                
                if (!isLoginPage) {
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                }
                
                return Promise.reject({
                    status: 401,
                    message: '登录已过期，请重新登录'
                });
            }
            
            return Promise.reject({
                status: error.response.status,
                message: error.response.data?.error || error.response.data?.message || '请求失败',
                data: error.response.data
            });
        }
        
        if (error.request) {
            return Promise.reject({
                status: 0,
                message: '网络连接失败，请检查网络'
            });
        }
        
        return Promise.reject({
            status: 0,
            message: error.message || '请求失败'
        });
    }
);

// =============================================
// ===== API 方法 =====
// =============================================

export const authAPI = {
    login: (email, password) => api.post('/api/v1/auth/login', { email, password }),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
        return api.post('/api/v1/auth/logout');
    },
    getCurrentUser: () => api.get('/api/v1/auth/me'),
    updatePassword: (currentPassword, newPassword) => 
        api.put('/api/v1/auth/password', { currentPassword, newPassword }),
    resetPassword: (email) => api.post('/api/v1/auth/reset-password', { email })
};

export const tenantAPI = {
    getTenants: () => api.get('/api/v1/tenants'),
    getTenant: (tenantId) => api.get(`/api/v1/tenants/${tenantId}`),
    createTenant: (data) => api.post('/api/v1/tenants', data),
    updateTenant: (tenantId, data) => api.put(`/api/v1/tenants/${tenantId}`, data),
    deleteTenant: (tenantId) => api.delete(`/api/v1/tenants/${tenantId}`),
    toggleStatus: (tenantId) => api.post(`/api/v1/tenants/${tenantId}/toggle`),
    getStats: (tenantId) => api.get(`/api/v1/tenants/${tenantId}/stats`)
};

export const countryAPI = {
    getCountries: () => api.get('/api/v1/countries'),
};

export const platformAPI = {
    getPlatforms: () => api.get('/api/v1/platforms'),
    getTenantPlatforms: (tenantId) => api.get(`/api/v1/tenants/${tenantId}/platforms`),
    bindPlatform: (tenantId, data) => api.post(`/api/v1/tenants/${tenantId}/platforms`, data),
};

export const taxAPI = {
    getTaxPlatforms: () => api.get('/api/v1/tax/platforms'),
    getEcommercePlatforms: () => api.get('/api/v1/tax/ecommerce-platforms'),
    validate: (data) => api.post('/api/v1/tax/validate', data),
    validateBatch: (data) => api.post('/api/v1/tax/validate-batch', data),
    summary: (data) => api.post('/api/v1/tax/summary', data),
    uploadC79: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/api/v1/tax/c79/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadC88: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/api/v1/tax/c88/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadTaxFile: (platform, file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('platform', platform);
        return api.post('/api/v1/tax/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export const fileAPI = {
    upload: (files, onProgress) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return api.post('/api/v1/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            }
        });
    },
    getFiles: (params) => api.get('/api/v1/files', { params }),
    getFile: (fileId) => api.get(`/api/v1/files/${fileId}`),
    deleteFile: (fileId) => api.delete(`/api/v1/files/${fileId}`),
    retry: (fileId) => api.post(`/api/v1/files/${fileId}/retry`),
    getStatus: (jobId) => api.get(`/api/v1/files/status/${jobId}`),
    getStats: () => api.get('/api/v1/files/stats')
};

export const reportAPI = {
    getReports: (params) => api.get('/api/v1/reports', { params }),
    getReport: (reportId) => api.get(`/api/v1/reports/${reportId}`),
    generate: (data) => api.post('/api/v1/reports/generate', data),
    deleteReport: (reportId) => api.delete(`/api/v1/reports/${reportId}`),
    download: (reportId, format) => api.get(`/api/v1/reports/${reportId}/download`, {
        params: { format },
        responseType: 'blob'
    }),
    submit: (reportId) => api.put(`/api/v1/reports/${reportId}/submit`),
    share: (reportId, data) => api.post(`/api/v1/reports/${reportId}/share`, data),
    email: (reportId, data) => api.post(`/api/v1/reports/${reportId}/email`, data),
    preview: (reportId) => api.get(`/api/v1/reports/${reportId}/preview`)
};

export const transactionAPI = {
    getTransactions: (params) => api.get('/api/v1/transactions', { params }),
    getTransaction: (id) => api.get(`/api/v1/transactions/${id}`),
    getStats: (params) => api.get('/api/v1/transactions/stats', { params }),
    updateStatus: (id, status) => api.put(`/api/v1/transactions/${id}/status`, { status }),
    batchCreate: (data) => api.post('/api/v1/transactions/batch', data),
    batchUpdate: (ids, status) => api.post('/api/v1/transactions/batch-update', { transactionIds: ids, status }),
    deleteTransaction: (id) => api.delete(`/api/v1/transactions/${id}`),
    batchDelete: (ids) => api.post('/api/v1/transactions/batch-delete', { transactionIds: ids }),
    export: (params) => api.get('/api/v1/transactions/export', {
        params,
        responseType: 'blob'
    }),
    getPeriods: () => api.get('/api/v1/transactions/periods')
};

export const settingsAPI = {
    getSettings: () => api.get('/api/v1/settings'),
    updateSettings: (data) => api.put('/api/v1/settings', data),
    getTaxSettings: () => api.get('/api/v1/settings/tax'),
    updateTaxSettings: (data) => api.put('/api/v1/settings/tax', data),
    getNotificationSettings: () => api.get('/api/v1/settings/notifications'),
    updateNotificationSettings: (data) => api.put('/api/v1/settings/notifications', data),
    clearCache: () => api.post('/api/v1/settings/clear-cache')
};

export const dashboardAPI = {
    getDashboard: () => api.get('/api/v1/dashboard'),
    getVATTrend: (params) => api.get('/api/v1/dashboard/vat-trend', { params }),
    getCountryDistribution: (params) => api.get('/api/v1/dashboard/country-distribution', { params }),
    getRecentActivities: (params) => api.get('/api/v1/dashboard/recent-activities', { params }),
    getSystemOverview: () => api.get('/api/v1/dashboard/system-overview')
};

export const webhookAPI = {
    getWebhooks: () => api.get('/api/v1/webhooks'),
    createWebhook: (data) => api.post('/api/v1/webhooks', data),
    updateWebhook: (id, data) => api.put(`/api/v1/webhooks/${id}`, data),
    deleteWebhook: (id) => api.delete(`/api/v1/webhooks/${id}`),
    toggleWebhook: (id) => api.post(`/api/v1/webhooks/${id}/toggle`),
    testWebhook: (id) => api.post(`/api/v1/webhooks/${id}/test`),
    triggerWebhook: (id, event, data) => api.post(`/api/v1/webhooks/${id}/trigger`, { event, data })
};

export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export default api;