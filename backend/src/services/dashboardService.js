// backend/src/services/dashboardService.js
const { logger } = require('../utils/logger');
const { Tenant, Transaction, Filing } = require('../models');
const { Op } = require('sequelize');

/**
 * 看板服务类
 * 提供仪表盘数据
 */
class DashboardService {
    /**
     * 获取看板数据
     */
    async getDashboardData(tenantId = null) {
        try {
            const where = {};
            if (tenantId) where.tenantId = tenantId;

            // 1. 客户统计
            const tenantCount = await Tenant.count({
                where: { ...where, status: 'active' }
            });

            // 2. 交易统计（本月）
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const transactionStats = await Transaction.findAll({
                where: {
                    ...where,
                    orderDate: {
                        [Op.between]: [monthStart, monthEnd]
                    }
                },
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('net_amount')), 'totalNet'],
                    [sequelize.fn('SUM', sequelize.col('vat_amount')), 'totalVAT']
                ]
            });

            const stats = transactionStats[0] || {
                count: 0,
                totalNet: 0,
                totalVAT: 0
            };

            // 3. 处理成功率
            const processingStats = await Transaction.findAll({
                where: {
                    ...where,
                    status: { [Op.in]: ['completed', 'failed'] }
                },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['status']
            });

            const totalProcessed = processingStats.reduce((sum, s) => sum + s.dataValues.count, 0);
            const completedCount = processingStats.find(s => s.status === 'completed')?.dataValues?.count || 0;
            const successRate = totalProcessed > 0 ? (completedCount / totalProcessed) * 100 : 0;

            // 4. 月度趋势
            const monthlyTrend = await this.getMonthlyTrend(tenantId);

            // 5. 国家分布
            const countryDistribution = await this.getCountryDistribution(tenantId);

            // 6. 最近活动
            const recentActivities = await this.getRecentActivities(tenantId);

            return {
                totalTenants: tenantCount,
                monthlyTransactions: stats.count || 0,
                totalVAT: stats.totalVAT || 0,
                successRate: Math.round(successRate * 10) / 10,
                monthlyTrend,
                countryDistribution,
                recentActivities
            };
        } catch (error) {
            logger.error('获取看板数据失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取月度趋势
     */
    async getMonthlyTrend(tenantId, months = 12) {
        try {
            const where = {};
            if (tenantId) where.tenantId = tenantId;

            const trends = await Transaction.findAll({
                where: {
                    ...where,
                    orderDate: {
                        [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - months))
                    }
                },
                attributes: [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), '%Y-%m'), 'month'],
                    [sequelize.fn('SUM', sequelize.col('net_amount')), 'netAmount'],
                    [sequelize.fn('SUM', sequelize.col('vat_amount')), 'vatAmount']
                ],
                group: [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), '%Y-%m')],
                order: [[sequelize.literal('month'), 'ASC']]
            });

            return trends;
        } catch (error) {
            logger.error('获取月度趋势失败:', error.message);
            return [];
        }
    }

    /**
     * 获取国家分布
     */
    async getCountryDistribution(tenantId) {
        try {
            const where = {};
            if (tenantId) where.tenantId = tenantId;

            const distribution = await Transaction.findAll({
                where: {
                    ...where,
                    country: { [Op.ne]: null }
                },
                attributes: [
                    'country',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('net_amount')), 'totalNet'],
                    [sequelize.fn('SUM', sequelize.col('vat_amount')), 'totalVAT']
                ],
                group: ['country'],
                order: [[sequelize.literal('count'), 'DESC']],
                limit: 10
            });

            return distribution;
        } catch (error) {
            logger.error('获取国家分布失败:', error.message);
            return [];
        }
    }

    /**
     * 获取最近活动
     */
    async getRecentActivities(tenantId, limit = 10) {
        try {
            const where = {};
            if (tenantId) where.tenantId = tenantId;

            // 最近的文件处理记录
            const recentFiles = await ProcessingHistory.findAll({
                where,
                order: [['processedAt', 'DESC']],
                limit: 5,
                attributes: ['id', 'fileName', 'status', 'processedAt', 'tenantId']
            });

            // 最近的申报记录
            const recentFilings = await Filing.findAll({
                where,
                order: [['createdAt', 'DESC']],
                limit: 5,
                attributes: ['id', 'period', 'status', 'totalVat', 'createdAt', 'tenantId']
            });

            // 合并活动
            const activities = [];

            for (const file of recentFiles) {
                activities.push({
                    id: `file-${file.id}`,
                    type: 'file',
                    tenantId: file.tenantId,
                    action: `文件 ${file.fileName} ${file.status === 'completed' ? '处理完成' : file.status === 'failed' ? '处理失败' : '处理中'}`,
                    status: file.status,
                    timestamp: file.processedAt
                });
            }

            for (const filing of recentFilings) {
                activities.push({
                    id: `filing-${filing.id}`,
                    type: 'filing',
                    tenantId: filing.tenantId,
                    action: `申报报告生成 (${filing.period})`,
                    status: filing.status,
                    amount: filing.totalVat,
                    timestamp: filing.createdAt
                });
            }

            // 按时间排序
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return activities.slice(0, limit);

        } catch (error) {
            logger.error('获取最近活动失败:', error.message);
            return [];
        }
    }

    /**
     * 获取VAT趋势
     */
    async getVATTrend(tenantId, period = 'month') {
        try {
            const where = {};
            if (tenantId) where.tenantId = tenantId;

            let dateFormat;
            let groupField;

            switch (period) {
                case 'year':
                    dateFormat = '%Y';
                    groupField = 'year';
                    break;
                case 'quarter':
                    dateFormat = '%Y-%m';
                    groupField = 'quarter';
                    break;
                default:
                    dateFormat = '%Y-%m';
                    groupField = 'month';
            }

            const trends = await Transaction.findAll({
                where: {
                    ...where,
                    orderDate: {
                        [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 24))
                    }
                },
                attributes: [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), dateFormat), groupField],
                    [sequelize.fn('SUM', sequelize.col('net_amount')), 'netAmount'],
                    [sequelize.fn('SUM', sequelize.col('vat_amount')), 'vatAmount'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), dateFormat)],
                order: [[sequelize.literal(groupField), 'ASC']]
            });

            return trends;
        } catch (error) {
            logger.error('获取VAT趋势失败:', error.message);
            return [];
        }
    }

    /**
     * 获取系统概览（管理员）
     */
    async getSystemOverview() {
        try {
            const [tenantCount, transactionCount, filingCount, processingStats] = await Promise.all([
                Tenant.count({ where: { status: 'active' } }),
                Transaction.count(),
                Filing.count(),
                Transaction.findAll({
                    attributes: [
                        'status',
                        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                    ],
                    group: ['status']
                })
            ]);

            return {
                totalTenants: tenantCount,
                totalTransactions: transactionCount,
                totalFilings: filingCount,
                processingStats
            };
        } catch (error) {
            logger.error('获取系统概览失败:', error.message);
            throw error;
        }
    }
}

module.exports = new DashboardService();