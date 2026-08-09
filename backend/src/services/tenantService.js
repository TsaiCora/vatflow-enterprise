// backend/src/services/tenantService.js
const { logger } = require('../utils/logger');
const tenantManager = require('../core/tenantManager');
const { Tenant, Transaction, Filing } = require('../models');
const { Op } = require('sequelize');

/**
 * 客户服务类
 * 处理客户相关的业务逻辑
 */
class TenantService {
    /**
     * 创建客户
     */
    async createTenant(data) {
        try {
            const tenant = await tenantManager.createTenant(data);
            logger.info(`客户创建成功: ${tenant.tenantId}`);
            return tenant;
        } catch (error) {
            logger.error('创建客户失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取客户列表
     */
    async getTenants(filters = {}) {
        try {
            const { status, country, search, page = 1, limit = 20 } = filters;

            const where = {};
            if (status && status !== 'all') where.status = status;
            if (country && country !== 'all') where.country = country;

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
                order: [['createdAt', 'DESC']],
                attributes: { exclude: ['passwordHash', 'apiKey'] }
            });

            return {
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('获取客户列表失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取客户详情
     */
    async getTenant(tenantId) {
        try {
            const tenant = await tenantManager.getTenant(tenantId);
            return tenant;
        } catch (error) {
            logger.error(`获取客户失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 更新客户
     */
    async updateTenant(tenantId, data) {
        try {
            const tenant = await tenantManager.updateTenant(tenantId, data);
            logger.info(`客户更新成功: ${tenantId}`);
            return tenant;
        } catch (error) {
            logger.error(`更新客户失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 删除客户
     */
    async deleteTenant(tenantId) {
        try {
            const tenant = await tenantManager.deleteTenant(tenantId);
            logger.info(`客户删除成功: ${tenantId}`);
            return tenant;
        } catch (error) {
            logger.error(`删除客户失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 切换客户状态
     */
    async toggleStatus(tenantId) {
        try {
            const tenant = await tenantManager.toggleStatus(tenantId);
            logger.info(`客户状态切换成功: ${tenantId} -> ${tenant.status}`);
            return tenant;
        } catch (error) {
            logger.error(`切换客户状态失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取客户统计
     */
    async getTenantStats(tenantId) {
        try {
            const stats = await tenantManager.getTenantStats(tenantId);
            return stats;
        } catch (error) {
            logger.error(`获取客户统计失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 验证客户密码
     */
    async validatePassword(tenantId, password) {
        try {
            return await tenantManager.validatePassword(tenantId, password);
        } catch (error) {
            logger.error(`验证密码失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 重置客户密码
     */
    async resetPassword(tenantId, newPassword) {
        try {
            const tenant = await tenantManager.resetPassword(tenantId, newPassword);
            logger.info(`密码重置成功: ${tenantId}`);
            return tenant;
        } catch (error) {
            logger.error(`重置密码失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 验证 API Key
     */
    async validateApiKey(apiKey) {
        try {
            return await tenantManager.validateApiKey(apiKey);
        } catch (error) {
            logger.error('验证 API Key 失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取客户交易汇总
     */
    async getTenantTransactionSummary(tenantId, period = null) {
        try {
            const where = { tenantId };
            if (period) {
                where.period = period;
            }

            const summary = await Transaction.findAll({
                where,
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
                    [sequelize.fn('SUM', sequelize.col('net_amount')), 'totalNet'],
                    [sequelize.fn('SUM', sequelize.col('vat_amount')), 'totalVAT'],
                    [sequelize.fn('SUM', sequelize.col('gross_amount')), 'totalGross']
                ]
            });

            return summary[0] || {
                totalTransactions: 0,
                totalNet: 0,
                totalVAT: 0,
                totalGross: 0
            };
        } catch (error) {
            logger.error(`获取客户交易汇总失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取客户申报汇总
     */
    async getTenantFilingSummary(tenantId) {
        try {
            const summary = await Filing.findAll({
                where: { tenantId },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('total_vat')), 'totalVAT']
                ],
                group: ['status']
            });

            return summary;
        } catch (error) {
            logger.error(`获取客户申报汇总失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 批量导入客户
     */
    async importTenants(records) {
        const results = {
            success: [],
            failed: []
        };

        for (const record of records) {
            try {
                const tenant = await this.createTenant(record);
                results.success.push(tenant);
            } catch (error) {
                results.failed.push({
                    record,
                    error: error.message
                });
            }
        }

        logger.info(`客户导入完成: ${results.success.length} 成功, ${results.failed.length} 失败`);
        return results;
    }

    /**
     * 导出客户数据
     */
    async exportTenants(filters = {}) {
        const { data } = await this.getTenants({ ...filters, limit: 1000 });
        return data;
    }
}

module.exports = new TenantService();