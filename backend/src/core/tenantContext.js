// backend/src/core/tenantContext.js
const { AsyncLocalStorage } = require('async_hooks');
const { logger } = require('../utils/logger');
const tenantManager = require('./tenantManager');

/**
 * 租户上下文管理
 * 使用 AsyncLocalStorage 实现请求级别的租户隔离
 */
class TenantContext {
    constructor() {
        this.asyncLocalStorage = new AsyncLocalStorage();
        this.currentTenant = null;
    }

    /**
     * 设置当前租户上下文
     */
    setContext(tenantId) {
        const tenant = tenantManager.getTenant(tenantId);
        const context = {
            tenantId,
            tenant,
            startTime: Date.now(),
            correlationId: this.generateCorrelationId()
        };

        this.asyncLocalStorage.enterWith(context);
        this.currentTenant = tenant;

        logger.debug(`租户上下文已设置: ${tenantId} (${tenant.name})`);

        return context;
    }

    /**
     * 获取当前租户上下文
     */
    getContext() {
        const context = this.asyncLocalStorage.getStore();
        if (!context) {
            // 如果没有上下文，尝试获取当前租户
            if (this.currentTenant) {
                return {
                    tenantId: this.currentTenant.tenantId,
                    tenant: this.currentTenant,
                    startTime: Date.now()
                };
            }
            throw new Error('租户上下文未设置');
        }
        return context;
    }

    /**
     * 获取当前租户ID
     */
    getTenantId() {
        try {
            const context = this.getContext();
            return context.tenantId;
        } catch {
            return null;
        }
    }

    /**
     * 获取当前租户对象
     */
    getTenant() {
        try {
            const context = this.getContext();
            return context.tenant;
        } catch {
            return null;
        }
    }

    /**
     * 获取当前用户（从租户信息中）
     */
    getCurrentUser() {
        const tenant = this.getTenant();
        if (!tenant) return null;
        return {
            tenantId: tenant.tenantId,
            name: tenant.name,
            email: tenant.email,
            role: tenant.role,
            company: tenant.company
        };
    }

    /**
     * 生成关联ID
     */
    generateCorrelationId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `corr_${timestamp}_${random}`;
    }

    /**
     * 在租户上下文中执行函数
     */
    async runInContext(tenantId, fn) {
        const context = this.setContext(tenantId);
        return this.asyncLocalStorage.run(context, fn);
    }

    /**
     * 在租户上下文中执行函数（同步）
     */
    runInContextSync(tenantId, fn) {
        const context = this.setContext(tenantId);
        return this.asyncLocalStorage.run(context, fn);
    }

    /**
     * 验证租户权限
     */
    validatePermission(tenantId, requiredPermission) {
        const tenant = tenantManager.getTenant(tenantId);
        if (!tenant) {
            throw new Error('租户不存在');
        }
        if (tenant.status !== 'active') {
            throw new Error('租户已停用');
        }
        // 检查权限（可根据需求扩展）
        if (requiredPermission && tenant.role === 'user' && requiredPermission === 'admin') {
            throw new Error('权限不足');
        }
        return true;
    }

    /**
     * 检查是否已设置租户上下文
     */
    hasContext() {
        try {
            this.getContext();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取请求信息
     */
    getRequestInfo() {
        const context = this.getContext();
        return {
            tenantId: context.tenantId,
            tenant: context.tenant,
            correlationId: context.correlationId,
            startTime: context.startTime,
            duration: Date.now() - context.startTime
        };
    }

    /**
     * 清理上下文
     */
    clearContext() {
        this.currentTenant = null;
        // AsyncLocalStorage 会在请求结束后自动清理
    }
}

// 导出单例
module.exports = new TenantContext();