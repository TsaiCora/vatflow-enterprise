// frontend/src/services/api.js
import axios from 'axios';

// 创建 axios 实例
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api/v1',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // 处理401未认证
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // 可以触发重定向到登录页
            window.location.href = '/login';
        }
        
        // 统一错误格式
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           '请求失败，请稍后重试';
        
        return Promise.reject({
            status: error.response?.status,
            message: errorMessage,
            data: error.response?.data
        });
    }
);

// ============= 认证 API =============
export const authAPI = {
    // 登录
    login: (email, password) => 
        apiClient.post('/auth/login', { email, password }),
    
    // 登出
    logout: () => 
        apiClient.post('/auth/logout'),
    
    // 刷新令牌
    refreshToken: (refreshToken) => 
        apiClient.post('/auth/refresh', { refreshToken }),
    
    // 获取当前用户信息
    getCurrentUser: () => 
        apiClient.get('/auth/me'),
    
    // 更新密码
    updatePassword: (currentPassword, newPassword) => 
        apiClient.put('/auth/password', { currentPassword, newPassword }),
    
    // 重置密码（发送重置邮件）
    resetPassword: (email) => 
        apiClient.post('/auth/reset-password', { email }),
    
    // 验证重置令牌
    verifyResetToken: (token) => 
        apiClient.post('/auth/verify-reset-token', { token }),
    
    // 完成密码重置
    completeReset: (token, newPassword) => 
        apiClient.post('/auth/complete-reset', { token, newPassword })
};

// ============= 客户 API =============
export const tenantAPI = {
    // 获取客户列表
    getTenants: (params = {}) => 
        apiClient.get('/tenants', { params }),
    
    // 获取单个客户
    getTenant: (tenantId) => 
        apiClient.get(`/tenants/${tenantId}`),
    
    // 创建客户
    createTenant: (data) => 
        apiClient.post('/tenants', data),
    
    // 更新客户
    updateTenant: (tenantId, data) => 
        apiClient.put(`/tenants/${tenantId}`, data),
    
    // 删除客户
    deleteTenant: (tenantId) => 
        apiClient.delete(`/tenants/${tenantId}`),
    
    // 获取客户统计
    getTenantStats: (tenantId) => 
        apiClient.get(`/tenants/${tenantId}/stats`),
    
    // 批量导入客户
    importTenants: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/tenants/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    
    // 导出客户
    exportTenants: (params = {}) => 
        apiClient.get('/tenants/export', { 
            params,
            responseType: 'blob' 
        })
};

// ============= 文件 API =============
export const fileAPI = {
    // 获取文件列表
    getFiles: (params = {}) => 
        apiClient.get('/files', { params }),
    
    // 上传文件
    uploadFiles: (files, onProgress) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        return apiClient.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percent);
                }
            }
        });
    },
    
    // 获取处理状态
    getProcessingStatus: (jobId) => 
        apiClient.get(`/files/status/${jobId}`),
    
    // 下载文件
    downloadFile: (fileId) => 
        apiClient.get(`/files/download/${fileId}`, {
            responseType: 'blob'
        }),
    
    // 删除文件
    deleteFile: (fileId) => 
        apiClient.delete(`/files/${fileId}`),
    
    // 批量删除文件
    batchDeleteFiles: (fileIds) => 
        apiClient.post('/files/batch-delete', { fileIds }),
    
    // 重试处理
    retryProcessing: (fileId) => 
        apiClient.post(`/files/${fileId}/retry`),
    
    // 获取文件统计
    getFileStats: () => 
        apiClient.get('/files/stats')
};

// ============= 报告 API =============
export const reportAPI = {
    // 获取报告列表
    getReports: (params = {}) => 
        apiClient.get('/reports', { params }),
    
    // 获取单个报告
    getReport: (reportId) => 
        apiClient.get(`/reports/${reportId}`),
    
    // 生成报告
    generateReport: (data) => 
        apiClient.post('/reports/generate', data),
    
    // 下载报告
    downloadReport: (reportId, format = 'xlsx') => 
        apiClient.get(`/reports/${reportId}/download`, {
            params: { format },
            responseType: 'blob'
        }),
    
    // 删除报告
    deleteReport: (reportId) => 
        apiClient.delete(`/reports/${reportId}`),
    
    // 分享报告
    shareReport: (reportId, data) => 
        apiClient.post(`/reports/${reportId}/share`, data),
    
    // 发送报告邮件
    emailReport: (reportId, data) => 
        apiClient.post(`/reports/${reportId}/email`, data),
    
    // 获取报告预览数据
    previewReport: (reportId) => 
        apiClient.get(`/reports/${reportId}/preview`)
};

// ============= 交易 API =============
export const transactionAPI = {
    // 获取交易列表
    getTransactions: (params = {}) => 
        apiClient.get('/transactions', { params }),
    
    // 获取单个交易
    getTransaction: (transactionId) => 
        apiClient.get(`/transactions/${transactionId}`),
    
    // 获取交易统计
    getTransactionStats: (params = {}) => 
        apiClient.get('/transactions/stats', { params }),
    
    // 导出交易
    exportTransactions: (params = {}) => 
        apiClient.get('/transactions/export', {
            params,
            responseType: 'blob'
        })
};

// ============= 看板 API =============
export const dashboardAPI = {
    // 获取看板数据
    getDashboardData: () => 
        apiClient.get('/dashboard'),
    
    // 获取VAT趋势
    getVATTrend: (params = {}) => 
        apiClient.get('/dashboard/vat-trend', { params }),
    
    // 获取国家分布
    getCountryDistribution: (params = {}) => 
        apiClient.get('/dashboard/country-distribution', { params }),
    
    // 获取最近活动
    getRecentActivities: (params = {}) => 
        apiClient.get('/dashboard/recent-activities', { params })
};

// ============= Webhook API =============
export const webhookAPI = {
    // 获取Webhook列表
    getWebhooks: () => 
        apiClient.get('/webhooks'),
    
    // 创建Webhook
    createWebhook: (data) => 
        apiClient.post('/webhooks', data),
    
    // 更新Webhook
    updateWebhook: (webhookId, data) => 
        apiClient.put(`/webhooks/${webhookId}`, data),
    
    // 删除Webhook
    deleteWebhook: (webhookId) => 
        apiClient.delete(`/webhooks/${webhookId}`),
    
    // 测试Webhook
    testWebhook: (webhookId) => 
        apiClient.post(`/webhooks/${webhookId}/test`)
};

// ============= 设置 API =============
export const settingsAPI = {
    // 获取系统设置
    getSettings: () => 
        apiClient.get('/settings'),
    
    // 更新系统设置
    updateSettings: (data) => 
        apiClient.put('/settings', data),
    
    // 获取税务设置
    getTaxSettings: () => 
        apiClient.get('/settings/tax'),
    
    // 更新税务设置
    updateTaxSettings: (data) => 
        apiClient.put('/settings/tax', data),
    
    // 获取通知设置
    getNotificationSettings: () => 
        apiClient.get('/settings/notifications'),
    
    // 更新通知设置
    updateNotificationSettings: (data) => 
        apiClient.put('/settings/notifications', data)
};

// ============= 工具函数 =============

/**
 * 下载文件（从Blob）
 * @param {Blob} blob - 文件Blob
 * @param {string} filename - 文件名
 */
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

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @returns {string} 错误信息
 */
export const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.data?.error) return error.data.error;
    if (error.data?.message) return error.data.message;
    return '操作失败，请稍后重试';
};

// 默认导出
export default apiClient;