// backend/src/workers/cleanupWorker.js
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const queueManager = require('../core/queueManager');
const cacheManager = require('../core/cacheManager');
const { Transaction, ProcessingHistory } = require('../models');
const { Op } = require('sequelize');

/**
 * 清理 Worker
 * 定期清理过期数据和临时文件
 */
class CleanupWorker {
    constructor() {
        this.isRunning = false;
        this.queueName = 'cleanup';
        this.config = {
            tempFileAge: 24 * 60 * 60 * 1000, // 24小时
            logFileAge: 30 * 24 * 60 * 60 * 1000, // 30天
            transactionRetention: 365 * 24 * 60 * 60 * 1000, // 365天
            batchSize: 1000
        };
    }

    /**
     * 启动 Worker
     */
    async start() {
        if (this.isRunning) {
            logger.warn('⚠️ CleanupWorker 已在运行中');
            return;
        }

        logger.info('🚀 启动清理 Worker...');
        this.isRunning = true;

        await queueManager.ensureInitialized();

        // 注册处理器
        queueManager.queues.cleanup.process(async (job) => {
            return await this.processJob(job);
        });

        logger.info('✅ 清理 Worker 启动成功');
    }

    /**
     * 处理清理任务
     */
    async processJob(job) {
        logger.info('🧹 开始清理任务...');

        const results = {
            tempFiles: 0,
            logs: 0,
            transactions: 0,
            processingHistory: 0,
            cache: 0
        };

        try {
            // 1. 清理临时文件
            results.tempFiles = await this.cleanTempFiles();

            // 2. 清理过期日志
            results.logs = await this.cleanLogs();

            // 3. 清理过期交易数据
            results.transactions = await this.cleanTransactions();

            // 4. 清理处理历史
            results.processingHistory = await this.cleanProcessingHistory();

            // 5. 清理缓存
            results.cache = await this.cleanCache();

            logger.info('✅ 清理任务完成', results);

            return {
                success: true,
                results
            };

        } catch (error) {
            logger.error('❌ 清理任务失败:', error.message);
            throw error;
        }
    }

    /**
     * 清理临时文件
     */
    async cleanTempFiles() {
        const tempDir = './data/temp/';
        let cleaned = 0;

        if (!fs.existsSync(tempDir)) {
            return 0;
        }

        try {
            const files = fs.readdirSync(tempDir);
            const now = Date.now();

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (now - stats.mtimeMs > this.config.tempFileAge) {
                        fs.unlinkSync(filePath);
                        cleaned++;
                        logger.debug(`删除临时文件: ${file}`);
                    }
                } catch (error) {
                    logger.error(`删除临时文件失败: ${file}`, error);
                }
            }

            logger.info(`🧹 清理了 ${cleaned} 个临时文件`);
            return cleaned;

        } catch (error) {
            logger.error('清理临时文件失败:', error.message);
            return cleaned;
        }
    }

    /**
     * 清理过期日志
     */
    async cleanLogs() {
        const logDir = './logs/';
        let cleaned = 0;

        if (!fs.existsSync(logDir)) {
            return 0;
        }

        try {
            const files = fs.readdirSync(logDir);
            const now = Date.now();

            for (const file of files) {
                const filePath = path.join(logDir, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (now - stats.mtimeMs > this.config.logFileAge) {
                        fs.unlinkSync(filePath);
                        cleaned++;
                        logger.debug(`删除日志文件: ${file}`);
                    }
                } catch (error) {
                    logger.error(`删除日志文件失败: ${file}`, error);
                }
            }

            logger.info(`🧹 清理了 ${cleaned} 个日志文件`);
            return cleaned;

        } catch (error) {
            logger.error('清理日志失败:', error.message);
            return cleaned;
        }
    }

    /**
     * 清理过期交易数据
     */
    async cleanTransactions() {
        try {
            const cutoffDate = new Date(Date.now() - this.config.transactionRetention);

            const count = await Transaction.destroy({
                where: {
                    createdAt: {
                        [Op.lt]: cutoffDate
                    },
                    status: 'completed'
                },
                limit: this.config.batchSize
            });

            logger.info(`🧹 清理了 ${count} 条过期交易记录`);
            return count;

        } catch (error) {
            logger.error('清理交易数据失败:', error.message);
            return 0;
        }
    }

    /**
     * 清理处理历史
     */
    async cleanProcessingHistory() {
        try {
            const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90天

            const count = await ProcessingHistory.destroy({
                where: {
                    processedAt: {
                        [Op.lt]: cutoffDate
                    },
                    status: {
                        [Op.in]: ['success', 'failed']
                    }
                },
                limit: this.config.batchSize
            });

            logger.info(`🧹 清理了 ${count} 条处理历史记录`);
            return count;

        } catch (error) {
            logger.error('清理处理历史失败:', error.message);
            return 0;
        }
    }

    /**
     * 清理缓存
     */
    async cleanCache() {
        try {
            // 清理所有缓存
            await cacheManager.clear();
            logger.info('🧹 缓存已清理');
            return 1;
        } catch (error) {
            logger.error('清理缓存失败:', error.message);
            return 0;
        }
    }

    /**
     * 停止 Worker
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        logger.info('🛑 停止清理 Worker...');
        this.isRunning = false;

        try {
            await queueManager.queues.cleanup.close();
            logger.info('✅ 清理 Worker 已停止');
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
            config: this.config
        };
    }

    /**
     * 手动执行清理
     */
    async runManual() {
        logger.info('🧹 手动执行清理...');
        return await this.processJob({ id: 'manual' });
    }
}

// 导出单例
module.exports = new CleanupWorker();