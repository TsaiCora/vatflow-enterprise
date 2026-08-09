// backend/src/core/tenantManager.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { sequelize, Tenant } = require('../models');

/**
 * 客户管理类
 */
class TenantManager {
    constructor() {
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5分钟
    }

    /**
     * 生成 API Key
     */
    generateApiKey(tenantId) {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(16).toString('hex');
        return `vat_${tenantId}_${timestamp}_${random}`;
    }

    /**
     * 生成客户ID
     */
    generateTenantId() {
        const prefix = 'client';
        const random = Math.random().toString(36).substring(2, 6);
        return `${prefix}_${random}`;
    }

    /**
     * 创建客户
     */
    async createTenant(data) {
        const {
            name,
            email,
            password,
            company,
            vatNumber,
            country,
            settings,
            taxConfig
        } = data;

        // 验证必填字段
        if (!name || !email || !password) {
            throw new Error('姓名、邮箱、密码为必填项');
        }

        // 检查邮箱是否已存在
        const existing = await Tenant.findOne({ where: { email } });
        if (existing) {
            throw new Error('邮箱已被注册');
        }

        // 生成客户ID
        const tenantId = data.tenantId || this.generateTenantId();

        // 加密密码
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 生成 API Key
        const apiKey = this.generateApiKey(tenantId);

        // 创建客户
        const tenant = await Tenant.create({
            tenantId,
            name,
            email,
            passwordHash,
            company: company || '',
            vatNumber: vatNumber || '',
            country: country || 'GB',
            role: 'user',
            status: 'pending',
            apiKey,
            settings: settings || {
                autoProcess: true,
                emailNotifications: true,
                defaultRate: 20,
                currency: 'EUR'
            },
            taxConfig: taxConfig || {
                ossEnabled: true,
                mtdEnabled: false,
                viesValidation: true,
                defaultPeriod: 'monthly'
            }
        });

        logger.info(`✅ 客户创建成功: ${tenantId} (${name})`);

        // 清除缓存
        this.cache.delete(tenantId);
        this.cache.delete(`email:${email}`);

        return tenant;
    }

    /**
     * 获取客户信息（带缓存）
     */
    async getTenant(tenantId, options = {}) {
        const { useCache = true } = options;

        // 检查缓存
        if (useCache && this.cache.has(tenantId)) {
            const cached = this.cache.get(tenantId);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                logger.debug(`缓存命中: ${tenantId}`);
                return cached.data;
            }
            this.cache.delete(tenantId);
        }

        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new Error(`客户 ${tenantId} 不存在`);
        }

        // 更新缓存
        if (useCache) {
            this.cache.set(tenantId, {
                data: tenant,
                timestamp: Date.now()
            });
        }

        return tenant;
    }

    /**
     * 通过邮箱获取客户
     */
    async getTenantByEmail(email) {
        const cacheKey = `email:${email}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        const tenant = await Tenant.findOne({ where: { email } });
        if (tenant) {
            this.cache.set(cacheKey, {
                data: tenant,
                timestamp: Date.now()
            });
        }

        return tenant;
    }

    /**
     * 通过 API Key 验证客户
     */
    async validateApiKey(apiKey) {
        const tenant = await Tenant.findOne({ where: { apiKey, status: 'active' } });
        return tenant;
    }

    /**
     * 获取所有客户列表
     */
    async getTenants(filters = {}) {
        const { status, country, search, page = 1, limit = 20 } = filters;

        const where = {};
        if (status) where.status = status;
        if (country) where.country = country;

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { company: { [Op.like]: `%${search}%` } },
                { tenantId: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const { rows, count } = await Tenant.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return {
            data: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * 更新客户信息
     */
    async updateTenant(tenantId, updates) {
        const tenant = await this.getTenant(tenantId, { useCache: false });

        // 不允许修改敏感字段
        const forbidden = ['tenantId', 'apiKey', 'createdAt', 'passwordHash'];
        for (const key of forbidden) {
            delete updates[key];
        }

        // 如果有密码，加密后保存
        if (updates.password) {
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
            updates.passwordHash = await bcrypt.hash(updates.password, saltRounds);
            delete updates.password;
        }

        // 更新设置
        if (updates.settings && typeof updates.settings === 'object') {
            tenant.settings = { ...tenant.settings, ...updates.settings };
            delete updates.settings;
        }

        // 更新税务配置
        if (updates.taxConfig && typeof updates.taxConfig === 'object') {
            tenant.taxConfig = { ...tenant.taxConfig, ...updates.taxConfig };
            delete updates.taxConfig;
        }

        await tenant.update(updates);

        // 清除缓存
        this.cache.delete(tenantId);
        this.cache.delete(`email:${tenant.email}`);

        logger.info(`✅ 客户更新成功: ${tenantId}`);

        return tenant;
    }

    /**
     * 删除客户（软删除）
     */
    async deleteTenant(tenantId) {
        const tenant = await this.getTenant(tenantId, { useCache: false });
        await tenant.destroy();

        // 清除缓存
        this.cache.delete(tenantId);
        this.cache.delete(`email:${tenant.email}`);

        logger.warn(`🗑️ 客户已删除: ${tenantId}`);

        return tenant;
    }

    /**
     * 切换客户状态
     */
    async toggleStatus(tenantId) {
        const tenant = await this.getTenant(tenantId, { useCache: false });
        const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
        await tenant.update({ status: newStatus });

        // 清除缓存
        this.cache.delete(tenantId);

        logger.info(`🔄 客户状态变更: ${tenantId} -> ${newStatus}`);

        return tenant;
    }

    /**
     * 获取客户统计信息
     */
    async getTenantStats(tenantId) {
        const tenant = await this.getTenant(tenantId);

        // 获取交易统计
        const transactionStats = await sequelize.query(`
            SELECT 
                COUNT(*) as totalTransactions,
                SUM(net_amount) as totalNet,
                SUM(vat_amount) as totalVAT,
                AVG(net_amount) as averageAmount,
                COUNT(DISTINCT country) as countries,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedCount,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedCount
            FROM transactions 
            WHERE tenant_id = ? AND deleted_at IS NULL
        `, {
            replacements: [tenantId],
            type: sequelize.QueryTypes.SELECT
        });

        // 获取申报统计
        const filingStats = await sequelize.query(`
            SELECT 
                COUNT(*) as totalFilings,
                SUM(total_vat) as totalVATFiled,
                COUNT(CASE WHEN status = 'filed' THEN 1 END) as filedCount,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draftCount
            FROM filings 
            WHERE tenant_id = ? AND deleted_at IS NULL
        `, {
            replacements: [tenantId],
            type: sequelize.QueryTypes.SELECT
        });

        return {
            tenant: {
                tenantId: tenant.tenantId,
                name: tenant.name,
                email: tenant.email,
                status: tenant.status,
                createdAt: tenant.createdAt
            },
            transactions: transactionStats[0] || {
                totalTransactions: 0,
                totalNet: 0,
                totalVAT: 0,
                averageAmount: 0,
                countries: 0,
                completedCount: 0,
                pendingCount: 0,
                failedCount: 0
            },
            filings: filingStats[0] || {
                totalFilings: 0,
                totalVATFiled: 0,
                filedCount: 0,
                draftCount: 0
            }
        };
    }

    /**
     * 验证客户密码
     */
    async validatePassword(tenantId, password) {
        const tenant = await this.getTenant(tenantId, { useCache: false });
        if (!tenant) return false;
        return await bcrypt.compare(password, tenant.passwordHash);
    }

    /**
     * 重置客户密码
     */
    async resetPassword(tenantId, newPassword) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        const tenant = await this.getTenant(tenantId, { useCache: false });
        await tenant.update({ passwordHash });

        // 清除缓存
        this.cache.delete(tenantId);

        logger.info(`🔑 密码已重置: ${tenantId}`);

        return tenant;
    }

    /**
     * 清除缓存
     */
    clearCache(tenantId = null) {
        if (tenantId) {
            this.cache.delete(tenantId);
            logger.debug(`缓存已清除: ${tenantId}`);
        } else {
            this.cache.clear();
            logger.debug('所有缓存已清除');
        }
    }

    /**
     * 获取缓存统计
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// 导出单例
module.exports = new TenantManager();