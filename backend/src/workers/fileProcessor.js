// backend/src/workers/fileProcessor.js
const { logger } = require('../utils/logger');
const { metrics } = require('../utils/metrics');
const queueManager = require('../core/queueManager');
const tenantContext = require('../core/tenantContext');
const fileProcessor = require('../modules/fileProcessor');
const dataAggregator = require('../modules/dataProcessor/aggregator');
const taxCalculator = require('../modules/dataProcessor/calculator');
const outputGenerator = require('../modules/dataProcessor/outputGenerator');
const notificationService = require('../modules/notification');
const { ProcessingHistory, Transaction, Filing } = require('../models');
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * 文件处理 Worker
 * 处理文件上传后的异步处理任务
 */
class FileProcessorWorker {
    constructor() {
        this.isRunning = false;
        this.concurrentLimit = parseInt(process.env.WORKER_CONCURRENCY) || 5;
        this.queueName = 'fileProcessing';
    }

    /**
     * 启动 Worker
     */
    async start() {
        if (this.isRunning) {
            logger.warn('⚠️ FileProcessorWorker 已在运行中');
            return;
        }

        logger.info('🚀 启动文件处理 Worker...');
        this.isRunning = true;

        // 确保队列已初始化
        await queueManager.ensureInitialized();

        // 注册处理器
        queueManager.queues.fileProcessing.process(
            this.concurrentLimit,
            async (job) => {
                return await this.processJob(job);
            }
        );

        // 监听事件
        queueManager.queues.fileProcessing.on('completed', (job, result) => {
            logger.info(`✅ 任务完成: ${job.id}`, {
                tenantId: job.data.tenantId,
                filePath: job.data.filePath
            });
        });

        queueManager.queues.fileProcessing.on('failed', (job, error) => {
            logger.error(`❌ 任务失败: ${job.id}`, {
                tenantId: job.data.tenantId,
                filePath: job.data.filePath,
                error: error.message
            });
        });

        logger.info(`✅ 文件处理 Worker 启动成功 (并发数: ${this.concurrentLimit})`);
    }

    /**
     * 处理单个任务
     */
    async processJob(job) {
        const startTime = Date.now();
        const { tenantId, filePath, retry = false } = job.data;

        try {
            // 设置租户上下文
            tenantContext.setContext(tenantId);

            logger.info(`📄 开始处理文件: ${filePath}`, { tenantId, jobId: job.id });

            // 更新进度
            await job.progress(10);

            // 1. 验证文件是否存在
            if (!fs.existsSync(filePath)) {
                throw new Error(`文件不存在: ${filePath}`);
            }

            // 2. 处理文件
            const result = await fileProcessor.process(filePath);
            await job.progress(50);

            // 3. 保存交易数据
            const savedCount = await this.saveTransactions(tenantId, result.mappedData);
            await job.progress(70);

            // 4. 聚合数据
            const aggregated = dataAggregator.aggregate(result.mappedData);
            await job.progress(80);

            // 5. 计算税额
            const taxedData = taxCalculator.calculate(aggregated.groups);
            await job.progress(90);

            // 6. 更新处理历史
            await this.updateHistory(tenantId, filePath, {
                status: 'success',
                transactionsCount: savedCount,
                platform: result.platform
            });

            // 7. 发送通知
            await notificationService.notifyFileProcessed(tenantId, {
                email: job.data.email,
                name: job.data.name || '用户',
                filename: path.basename(filePath),
                platform: result.platform,
                transactionCount: savedCount,
                totalVAT: aggregated.summary?.totalVAT || 0,
                countries: Object.keys(aggregated.summary?.countries || {}).join(', ')
            });

            // 8. 更新指标
            metrics.recordFileProcessed(result.platform, tenantId);
            metrics.recordTransactionProcessed(tenantId, 'all');

            const duration = (Date.now() - startTime) / 1000;
            logger.info(`✅ 文件处理完成: ${filePath}`, {
                tenantId,
                duration: `${duration}s`,
                transactions: savedCount,
                platform: result.platform
            });

            await job.progress(100);

            return {
                success: true,
                platform: result.platform,
                transactions: savedCount,
                duration,
                summary: aggregated.summary
            };

        } catch (error) {
            logger.error(`❌ 文件处理失败: ${filePath}`, {
                tenantId,
                error: error.message,
                stack: error.stack
            });

            // 更新处理历史为失败
            await this.updateHistory(tenantId, filePath, {
                status: 'failed',
                errorMessage: error.message
            });

            // 发送失败通知
            await notificationService.notifyFileFailed(tenantId, {
                email: job.data.email,
                name: job.data.name || '用户',
                filename: path.basename(filePath),
                error: error.message
            });

            // 更新指标
            metrics.recordError('file_processing', 'worker');

            throw error;
        }
    }

    /**
     * 保存交易数据
     */
    async saveTransactions(tenantId, transactions) {
        if (!transactions || transactions.length === 0) {
            logger.warn(`没有交易数据可保存: ${tenantId}`);
            return 0;
        }

        const batchSize = 1000;
        let savedCount = 0;

        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            
            try {
                const created = await Transaction.bulkCreate(
                    batch.map(tx => ({
                        tenantId,
                        orderId: tx.order_id || tx.orderId || `ORD-${Date.now()}-${i}`,
                        orderDate: tx.order_date || tx.orderDate || new Date(),
                        country: tx.country,
                        vatNumber: tx.vat_number || tx.vatNumber,
                        netAmount: tx.net_amount || tx.netAmount || 0,
                        vatAmount: tx.vat_amount || tx.vatAmount || 0,
                        grossAmount: tx.gross_amount || tx.grossAmount || (tx.amount || 0),
                        taxRate: tx.tax_rate || tx.taxRate || 0.20,
                        customerEmail: tx.customer_email || tx.customerEmail,
                        customerName: tx.customer_name || tx.customerName,
                        productSku: tx.product_sku || tx.productSku,
                        quantity: tx.quantity || 1,
                        period: tx.period || this.getPeriod(tx.order_date || tx.orderDate),
                        platform: tx._platform || 'unknown',
                        status: 'completed',
                        rawData: tx._raw || {}
                    })),
                    {
                        ignoreDuplicates: true,
                        updateOnDuplicate: ['netAmount', 'vatAmount', 'grossAmount', 'status']
                    }
                );
                savedCount += created.length;
            } catch (error) {
                logger.error(`批量保存交易失败:`, error.message);
                throw error;
            }
        }

        logger.info(`💾 已保存 ${savedCount} 条交易记录`);
        return savedCount;
    }

    /**
     * 更新处理历史
     */
    async updateHistory(tenantId, filePath, data) {
        try {
            const [history] = await ProcessingHistory.findOrCreate({
                where: { tenantId, filePath },
                defaults: {
                    tenantId,
                    filePath,
                    fileName: path.basename(filePath),
                    status: 'pending'
                }
            });

            await history.update({
                status: data.status,
                transactionsCount: data.transactionsCount || history.transactionsCount,
                platform: data.platform || history.platform,
                errorMessage: data.errorMessage || null,
                totalVat: data.totalVat || history.totalVat
            });

            return history;
        } catch (error) {
            logger.error(`更新处理历史失败:`, error.message);
        }
    }

    /**
     * 获取期间
     */
    getPeriod(dateStr) {
        if (!dateStr) {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
        } catch (e) {}

        const match = String(dateStr).match(/(\d{4})[-/](\d{2})/);
        if (match) {
            return `${match[1]}-${match[2]}`;
        }

        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    /**
     * 停止 Worker
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        logger.info('🛑 停止文件处理 Worker...');
        this.isRunning = false;

        try {
            await queueManager.queues.fileProcessing.close();
            logger.info('✅ 文件处理 Worker 已停止');
        } catch (error) {
            logger.error('停止 Worker 失败:', error.message);
        }
    }

    /**
     * 获取 Worker 状态
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            queueName: this.queueName,
            concurrentLimit: this.concurrentLimit
        };
    }
}

// 导出单例
module.exports = new FileProcessorWorker();