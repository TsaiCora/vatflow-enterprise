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

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ===== 响应拦截器 - 优化版 =====
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response) {
            // 401 未授权 - 不要立即跳转，让调用方处理
            if (error.response.status === 401) {
                const currentPath = window.location.pathname;
                // 只有在登录页之外才清除 token
                if (currentPath !== '/login') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // 不自动跳转，返回错误让调用方处理
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

// ===== 认证 API =====
export const authAPI = {
    login: (email, password) => api.post('/api/v1/auth/login', { email, password }),
    logout: () => api.post('/api/v1/auth/logout'),
    getCurrentUser: () => api.get('/api/v1/auth/me'),
    updatePassword: (currentPassword, newPassword) => 
        api.put('/api/v1/auth/password', { currentPassword, newPassword }),
    resetPassword: (email) => api.post('/api/v1/auth/reset-password', { email })
};

// ===== 租户 API =====
export const tenantAPI = {
    getTenants: (params) => api.get('/api/v1/tenants', { params }),
    getTenant: (tenantId) => api.get(`/api/v1/tenants/${tenantId}`),
    createTenant: (data) => api.post('/api/v1/tenants', data),
    updateTenant: (tenantId, data) => api.put(`/api/v1/tenants/${tenantId}`, data),
    deleteTenant: (tenantId) => api.delete(`/api/v1/tenants/${tenantId}`),
    toggleStatus: (tenantId) => api.post(`/api/v1/tenants/${tenantId}/toggle`),
    getStats: (tenantId) => api.get(`/api/v1/tenants/${tenantId}/stats`)
};

// ===== 国家 API =====
export const countryAPI = {
    getCountries: () => api.get('/api/v1/countries'),
};

// ===== 平台 API =====
export const platformAPI = {
    getPlatforms: () => api.get('/api/v1/platforms'),
    getTenantPlatforms: (tenantId) => api.get(`/api/v1/tenants/${tenantId}/platforms`),
    bindPlatform: (tenantId, data) => api.post(`/api/v1/tenants/${tenantId}/platforms`, data),
};

// ===== 税务 API =====
export const taxAPI = {
    getTaxPlatforms: () => api.get('/api/v1/tax/platforms'),
    getEcommercePlatforms: () => api.get('/api/v1/tax/ecommerce-platforms'),
    validate: (data) => api.post('/api/v1/tax/validate', data),
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

// ===== 文件 API =====
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

// ===== 报告 API =====
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

// ===== 交易 API =====
export const transactionAPI = {
    getTransactions: (params) => api.get('/api/v1/transactions', { params }),
    getTransaction: (id) => api.get(`/api/v1/transactions/${id}`),
    getStats: (params) => api.get('/api/v1/transactions/stats', { params }),
    updateStatus: (id, status) => api.put(`/api/v1/transactions/${id}/status`, { status }),
    batchUpdate: (ids, status) => api.post('/api/v1/transactions/batch-update', { transactionIds: ids, status }),
    deleteTransaction: (id) => api.delete(`/api/v1/transactions/${id}`),
    batchDelete: (ids) => api.post('/api/v1/transactions/batch-delete', { transactionIds: ids }),
    export: (params) => api.get('/api/v1/transactions/export', {
        params,
        responseType: 'blob'
    }),
    getPeriods: () => api.get('/api/v1/transactions/periods')
};

// ===== 设置 API =====
export const settingsAPI = {
    getSettings: () => api.get('/api/v1/settings'),
    updateSettings: (data) => api.put('/api/v1/settings', data),
    getTaxSettings: () => api.get('/api/v1/settings/tax'),
    updateTaxSettings: (data) => api.put('/api/v1/settings/tax', data),
    getNotificationSettings: () => api.get('/api/v1/settings/notifications'),
    updateNotificationSettings: (data) => api.put('/api/v1/settings/notifications', data),
    clearCache: () => api.post('/api/v1/settings/clear-cache')
};

// ===== 看板 API =====
export const dashboardAPI = {
    getDashboard: () => api.get('/api/v1/dashboard'),
    getVATTrend: (params) => api.get('/api/v1/dashboard/vat-trend', { params }),
    getCountryDistribution: (params) => api.get('/api/v1/dashboard/country-distribution', { params }),
    getRecentActivities: (params) => api.get('/api/v1/dashboard/recent-activities', { params }),
    getSystemOverview: () => api.get('/api/v1/dashboard/system-overview')
};

// ===== Webhook API =====
export const webhookAPI = {
    getWebhooks: () => api.get('/api/v1/webhooks'),
    createWebhook: (data) => api.post('/api/v1/webhooks', data),
    updateWebhook: (id, data) => api.put(`/api/v1/webhooks/${id}`, data),
    deleteWebhook: (id) => api.delete(`/api/v1/webhooks/${id}`),
    toggleWebhook: (id) => api.post(`/api/v1/webhooks/${id}/toggle`),
    testWebhook: (id) => api.post(`/api/v1/webhooks/${id}/test`),
    triggerWebhook: (id, event, data) => api.post(`/api/v1/webhooks/${id}/trigger`, { event, data })
};

// ===== 工具函数 =====
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