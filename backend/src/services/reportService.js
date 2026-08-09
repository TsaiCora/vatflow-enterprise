// backend/src/services/reportService.js
const { logger } = require('../utils/logger');
const { Filing, Transaction } = require('../models');
const dataAggregator = require('../modules/dataProcessor/aggregator');
const taxCalculator = require('../modules/dataProcessor/calculator');
const outputGenerator = require('../modules/dataProcessor/outputGenerator');
const notificationService = require('../modules/notification');
const { Op } = require('sequelize');

/**
 * 报告服务类
 * 处理报告生成、管理等业务逻辑
 */
class ReportService {
    /**
     * 生成报告
     */
    async generateReport(tenantId, options = {}) {
        const {
            period,
            country,
            format = 'xlsx',
            includeCharts = true,
            includeSummary = true,
            includeDetails = true
        } = options;

        try {
            // 1. 获取交易数据
            const where = { tenantId };
            if (period) where.period = period;
            if (country) where.country = country;

            const transactions = await Transaction.findAll({
                where,
                order: [['orderDate', 'ASC']]
            });

            if (transactions.length === 0) {
                throw new Error('没有可用的交易数据');
            }

            // 2. 聚合数据
            const aggregated = dataAggregator.aggregate(transactions, {
                includeDetails: true,
                includeSummary: true
            });

            // 3. 计算税额
            const calculated = taxCalculator.calculate(aggregated.groups);

            // 4. 生成报告文件
            const reportData = {
                groups: calculated,
                summary: aggregated.summary,
                meta: {
                    tenantId,
                    period,
                    country,
                    generatedAt: new Date().toISOString(),
                    totalTransactions: transactions.length
                }
            };

            const result = outputGenerator.generate(reportData, {
                format,
                includeCharts,
                includeSummary,
                includeDetails
            });

            // 5. 保存申报记录
            const filing = await this.saveFiling(tenantId, {
                period: period || reportData.groups[0]?.period || 'unknown',
                country: country || 'ALL',
                totalNet: aggregated.summary?.totalNet || 0,
                totalVat: aggregated.summary?.totalVAT || 0,
                totalGross: aggregated.summary?.totalGross || 0,
                transactionCount: transactions.length,
                reportData: reportData,
                filePath: result.files[0]
            });

            // 6. 发送通知
            await notificationService.notifyReportReady(tenantId, {
                email: options.email,
                name: options.name || '用户',
                period: period || '当前期间',
                country: country || '全部',
                transactionCount: transactions.length,
                totalVAT: aggregated.summary?.totalVAT || 0
            });

            logger.info(`报告生成成功: ${tenantId}`, {
                period,
                country,
                files: result.files
            });

            return {
                success: true,
                filing,
                files: result.files,
                formats: result.formats,
                summary: aggregated.summary
            };

        } catch (error) {
            logger.error(`生成报告失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 保存申报记录
     */
    async saveFiling(tenantId, data) {
        try {
            const [filing, created] = await Filing.upsert({
                tenantId,
                period: data.period,
                country: data.country,
                totalNet: data.totalNet || 0,
                totalVat: data.totalVat || 0,
                totalGross: data.totalGross || 0,
                transactionCount: data.transactionCount || 0,
                status: 'draft',
                reportData: data.reportData
            });

            return filing;
        } catch (error) {
            logger.error(`保存申报记录失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取报告列表
     */
    async getReports(tenantId, filters = {}) {
        try {
            const { status, country, period, page = 1, limit = 20 } = filters;

            const where = { tenantId };
            if (status && status !== 'all') where.status = status;
            if (country && country !== 'all') where.country = country;
            if (period) where.period = period;

            const offset = (page - 1) * limit;

            const { rows, count } = await Filing.findAndCountAll({
                where,
                limit,
                offset,
                order: [['createdAt', 'DESC']]
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
            logger.error(`获取报告列表失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取报告详情
     */
    async getReport(tenantId, reportId) {
        try {
            const report = await Filing.findOne({
                where: { id: reportId, tenantId }
            });

            if (!report) {
                throw new Error('报告不存在');
            }

            return report;
        } catch (error) {
            logger.error(`获取报告详情失败 (${reportId}):`, error.message);
            throw error;
        }
    }

    /**
     * 删除报告
     */
    async deleteReport(tenantId, reportId) {
        try {
            const report = await this.getReport(tenantId, reportId);
            await report.destroy();

            logger.info(`报告删除成功: ${tenantId} -> ${reportId}`);
            return true;
        } catch (error) {
            logger.error(`删除报告失败 (${reportId}):`, error.message);
            throw error;
        }
    }

    /**
     * 提交报告
     */
    async submitReport(tenantId, reportId, options = {}) {
        try {
            const report = await this.getReport(tenantId, reportId);

            if (report.status === 'filed') {
                throw new Error('报告已提交，不能重复提交');
            }

            // 验证报告数据
            if (report.totalVat <= 0) {
                throw new Error('VAT税额为0，无法提交');
            }

            // 更新状态
            await report.update({
                status: 'submitted',
                submissionId: `SUB-${Date.now()}-${report.id}`
            });

            logger.info(`报告提交成功: ${tenantId} -> ${reportId}`);
            return report;

        } catch (error) {
            logger.error(`提交报告失败 (${reportId}):`, error.message);
            throw error;
        }
    }

    /**
     * 完成申报（标记为已申报）
     */
    async completeFiling(tenantId, reportId, data = {}) {
        try {
            const report = await this.getReport(tenantId, reportId);

            await report.update({
                status: 'filed',
                filedAt: new Date(),
                reportData: {
                    ...report.reportData,
                    ...data
                }
            });

            logger.info(`申报完成: ${tenantId} -> ${reportId}`);
            return report;

        } catch (error) {
            logger.error(`完成申报失败 (${reportId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取报告预览数据
     */
    async getReportPreview(tenantId, reportId) {
        try {
            const report = await this.getReport(tenantId, reportId);
            
            if (!report.reportData) {
                throw new Error('报告数据不存在');
            }

            return report.reportData;
        } catch (error) {
            logger.error(`获取报告预览失败 (${reportId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取报告统计
     */
    async getReportStats(tenantId) {
        try {
            const stats = await Filing.findAll({
                where: { tenantId },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('total_vat')), 'totalVAT']
                ],
                group: ['status']
            });

            return stats;
        } catch (error) {
            logger.error(`获取报告统计失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 批量生成报告
     */
    async batchGenerate(tenantId, periods, options = {}) {
        const results = {
            success: [],
            failed: []
        };

        for (const period of periods) {
            try {
                const result = await this.generateReport(tenantId, {
                    ...options,
                    period
                });
                results.success.push({
                    period,
                    ...result
                });
            } catch (error) {
                results.failed.push({
                    period,
                    error: error.message
                });
            }
        }

        return results;
    }
}

module.exports = new ReportService();