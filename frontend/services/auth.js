// frontend/src/services/auth.js
import apiClient from './api';

// 认证状态
const AUTH_STATE = {
    TOKEN_KEY: 'token',
    USER_KEY: 'user',
    REFRESH_TOKEN_KEY: 'refreshToken'
};

/**
 * 认证服务类
 */
class AuthService {
    constructor() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        this.refreshPromise = null;
        this._loadFromStorage();
    }

    /**
     * 从 localStorage 加载认证信息
     * @private
     */
    _loadFromStorage() {
        this.token = localStorage.getItem(AUTH_STATE.TOKEN_KEY);
        const userStr = localStorage.getItem(AUTH_STATE.USER_KEY);
        this.user = userStr ? JSON.parse(userStr) : null;
        this.isAuthenticated = !!this.token && !!this.user;
    }

    /**
     * 保存认证信息到 localStorage
     * @private
     */
    _saveToStorage(token, user, refreshToken) {
        if (token) {
            localStorage.setItem(AUTH_STATE.TOKEN_KEY, token);
        }
        if (user) {
            localStorage.setItem(AUTH_STATE.USER_KEY, JSON.stringify(user));
        }
        if (refreshToken) {
            localStorage.setItem(AUTH_STATE.REFRESH_TOKEN_KEY, refreshToken);
        }
        this.token = token;
        this.user = user;
        this.isAuthenticated = !!token && !!user;
    }

    /**
     * 清除认证信息
     * @private
     */
    _clearStorage() {
        localStorage.removeItem(AUTH_STATE.TOKEN_KEY);
        localStorage.removeItem(AUTH_STATE.USER_KEY);
        localStorage.removeItem(AUTH_STATE.REFRESH_TOKEN_KEY);
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        this.refreshPromise = null;
    }

    /**
     * 登录
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     * @returns {Promise<Object>} 用户信息和令牌
     */
    async login(email, password) {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { token, user, refreshToken } = response.data;
            
            this._saveToStorage(token, user, refreshToken);
            
            return { token, user };
        } catch (error) {
            this._clearStorage();
            throw error;
        }
    }

    /**
     * 登出
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            // 即使API失败也清除本地数据
            console.warn('Logout API error:', error);
        } finally {
            this._clearStorage();
        }
    }

    /**
     * 刷新令牌
     * @returns {Promise<string>} 新令牌
     */
    async refreshToken() {
        // 如果已经在刷新，复用同一个Promise
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = new Promise(async (resolve, reject) => {
            try {
                const refreshToken = localStorage.getItem(AUTH_STATE.REFRESH_TOKEN_KEY);
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await apiClient.post('/auth/refresh', { refreshToken });
                const { token } = response.data;
                
                this._saveToStorage(token, this.user, refreshToken);
                this.refreshPromise = null;
                resolve(token);
            } catch (error) {
                this._clearStorage();
                this.refreshPromise = null;
                reject(error);
            }
        });

        return this.refreshPromise;
    }

    /**
     * 获取当前用户信息
     * @returns {Promise<Object>} 用户信息
     */
    async getCurrentUser() {
        try {
            const response = await apiClient.get('/auth/me');
            const user = response.data;
            this.user = user;
            localStorage.setItem(AUTH_STATE.USER_KEY, JSON.stringify(user));
            return user;
        } catch (error) {
            if (error.status === 401) {
                this._clearStorage();
            }
            throw error;
        }
    }

    /**
     * 更新密码
     * @param {string} currentPassword - 当前密码
     * @param {string} newPassword - 新密码
     * @returns {Promise<void>}
     */
    async updatePassword(currentPassword, newPassword) {
        await apiClient.put('/auth/password', { currentPassword, newPassword });
    }

    /**
     * 重置密码（发送重置邮件）
     * @param {string} email - 邮箱
     * @returns {Promise<void>}
     */
    async resetPassword(email) {
        await apiClient.post('/auth/reset-password', { email });
    }

    /**
     * 验证重置令牌
     * @param {string} token - 重置令牌
     * @returns {Promise<boolean>}
     */
    async verifyResetToken(token) {
        const response = await apiClient.post('/auth/verify-reset-token', { token });
        return response.data.valid;
    }

    /**
     * 完成密码重置
     * @param {string} token - 重置令牌
     * @param {string} newPassword - 新密码
     * @returns {Promise<void>}
     */
    async completeReset(token, newPassword) {
        await apiClient.post('/auth/complete-reset', { token, newPassword });
    }

    /**
     * 检查是否有权限
     * @param {string} permission - 权限名称
     * @returns {boolean}
     */
    hasPermission(permission) {
        if (!this.user || !this.user.permissions) return false;
        return this.user.permissions.includes(permission) || 
               this.user.permissions.includes('*');
    }

    /**
     * 检查是否有角色
     * @param {string|Array} roles - 角色名称或数组
     * @returns {boolean}
     */
    hasRole(roles) {
        if (!this.user || !this.user.role) return false;
        const roleList = Array.isArray(roles) ? roles : [roles];
        return roleList.includes(this.user.role) || this.user.role === 'admin';
    }

    /**
     * 获取令牌
     * @returns {string|null}
     */
    getToken() {
        return this.token;
    }

    /**
     * 获取用户信息
     * @returns {Object|null}
     */
    getUser() {
        return this.user;
    }

    /**
     * 检查是否已认证
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * 更新用户信息（本地）
     * @param {Object} updates - 更新的字段
     */
    updateUser(updates) {
        this.user = { ...this.user, ...updates };
        localStorage.setItem(AUTH_STATE.USER_KEY, JSON.stringify(this.user));
    }
}

// 创建单例
const authService = new AuthService();

// 导出
export default authService;

// 导出常用方法
export const login = (email, password) => authService.login(email, password);
export const logout = () => authService.logout();
export const getCurrentUser = () => authService.getCurrentUser();
export const isAuthenticated = () => authService.isAuthenticated();
export const getToken = () => authService.getToken();
export const getUser = () => authService.getUser();
export const hasPermission = (permission) => authService.hasPermission(permission);
export const hasRole = (roles) => authService.hasRole(roles);
export const updatePassword = (current, newPwd) => authService.updatePassword(current, newPwd);
export const resetPassword = (email) => authService.resetPassword(email);
export const verifyResetToken = (token) => authService.verifyResetToken(token);
export const completeReset = (token, newPwd) => authService.completeReset(token, newPwd);
export const refreshToken = () => authService.refreshToken();