// backend/src/services/transactionService.js
const { logger } = require('../utils/logger');
const { Transaction } = require('../models');
const { Op } = require('sequelize');

/**
 * 交易服务类
 * 处理交易数据的查询、管理等业务逻辑
 */
class TransactionService {
    /**
     * 获取交易列表
     */
    async getTransactions(tenantId, filters = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                country,
                status,
                platform,
                search,
                startDate,
                endDate
            } = filters;

            const where = { tenantId };

            if (country && country !== 'all') where.country = country;
            if (status && status !== 'all') where.status = status;
            if (platform && platform !== 'all') where.platform = platform;

            if (search) {
                where[Op.or] = [
                    { orderId: { [Op.like]: `%${search}%` } },
                    { vatNumber: { [Op.like]: `%${search}%` } },
                    { customerEmail: { [Op.like]: `%${search}%` } }
                ];
            }

            if (startDate || endDate) {
                where.orderDate = {};
                if (startDate) where.orderDate[Op.gte] = startDate;
                if (endDate) where.orderDate[Op.lte] = endDate;
            }

            const offset = (page - 1) * limit;

            const { rows, count } = await Transaction.findAndCountAll({
                where,
                limit,
                offset,
                order: [['orderDate', 'DESC']]
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
            logger.error(`获取交易列表失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取交易详情
     */
    async getTransaction(tenantId, transactionId) {
        try {
            const transaction = await Transaction.findOne({
                where: { id: transactionId, tenantId }
            });

            if (!transaction) {
                throw new Error('交易不存在');
            }

            return transaction;
        } catch (error) {
            logger.error(`获取交易详情失败 (${transactionId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取交易统计
     */
    async getTransactionStats(tenantId, filters = {}) {
        try {
            const { period, country } = filters;

            const where = { tenantId };
            if (period) where.period = period;
            if (country) where.country = country;

            const stats = await Transaction.findAll({
                where,
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                    [sequelize.fn('SUM', sequelize.col('net_amount')), 'totalNet'],
                    [sequelize.fn('SUM', sequelize.col('vat_amount')), 'totalVAT'],
                    [sequelize.fn('SUM', sequelize.col('gross_amount')), 'totalGross'],
                    [sequelize.fn('AVG', sequelize.col('net_amount')), 'averageNet']
                ]
            });

            const result = stats[0] || {
                total: 0,
                totalNet: 0,
                totalVAT: 0,
                totalGross: 0,
                averageNet: 0
            };

            // 获取国家分布
            const countryStats = await Transaction.findAll({
                where,
                attributes: [
                    'country',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('net_amount')), 'totalNet'],
                    [sequelize.fn('SUM', sequelize.col('vat_amount')), 'totalVAT']
                ],
                group: ['country'],
                order: [[sequelize.literal('count'), 'DESC']]
            });

            // 获取状态分布
            const statusStats = await Transaction.findAll({
                where,
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['status']
            });

            return {
                ...result,
                countryDistribution: countryStats,
                statusDistribution: statusStats
            };
        } catch (error) {
            logger.error(`获取交易统计失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 批量导入交易
     */
    async importTransactions(tenantId, transactions) {
        const results = {
            success: [],
            failed: []
        };

        const batchSize = 100;
        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            
            try {
                const created = await Transaction.bulkCreate(
                    batch.map(tx => ({
                        ...tx,
                        tenantId,
                        status: tx.status || 'pending'
                    })),
                    {
                        ignoreDuplicates: true,
                        updateOnDuplicate: ['netAmount', 'vatAmount', 'grossAmount', 'status']
                    }
                );
                results.success.push(...created);
            } catch (error) {
                logger.error(`批量导入交易失败:`, error.message);
                results.failed.push({
                    batch: i,
                    error: error.message
                });
            }
        }

        logger.info(`交易导入完成: ${results.success.length} 成功, ${results.failed.length} 失败`);
        return results;
    }

    /**
     * 更新交易状态
     */
    async updateTransactionStatus(tenantId, transactionId, status) {
        try {
            const transaction = await this.getTransaction(tenantId, transactionId);
            await transaction.update({ status });
            return transaction;
        } catch (error) {
            logger.error(`更新交易状态失败 (${transactionId}):`, error.message);
            throw error;
        }
    }

    /**
     * 批量更新交易状态
     */
    async batchUpdateStatus(tenantId, transactionIds, status) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of transactionIds) {
            try {
                const transaction = await this.updateTransactionStatus(tenantId, id, status);
                results.success.push(id);
            } catch (error) {
                results.failed.push({
                    id,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 删除交易
     */
    async deleteTransaction(tenantId, transactionId) {
        try {
            const transaction = await this.getTransaction(tenantId, transactionId);
            await transaction.destroy();
            return true;
        } catch (error) {
            logger.error(`删除交易失败 (${transactionId}):`, error.message);
            throw error;
        }
    }

    /**
     * 批量删除交易
     */
    async batchDeleteTransactions(tenantId, transactionIds) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of transactionIds) {
            try {
                await this.deleteTransaction(tenantId, id);
                results.success.push(id);
            } catch (error) {
                results.failed.push({
                    id,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 获取期间列表
     */
    async getPeriods(tenantId) {
        try {
            const periods = await Transaction.findAll({
                where: { tenantId },
                attributes: [
                    'period',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['period'],
                order: [['period', 'DESC']]
            });

            return periods;
        } catch (error) {
            logger.error(`获取期间列表失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 导出交易数据
     */
    async exportTransactions(tenantId, filters = {}) {
        const { data } = await this.getTransactions(tenantId, {
            ...filters,
            limit: 10000
        });

        return data;
    }
}

module.exports = new TransactionService();