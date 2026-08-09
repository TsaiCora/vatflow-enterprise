// backend/src/core/queueManager.js
const Bull = require('bull');
const { getQueueClient } = require('../config/redis');
const { logger } = require('../utils/logger');

/**
 * 任务队列管理器
 */
class QueueManager {
    constructor() {
        this.queues = {};
        this.isInitialized = false;
        this.initialized = this.init();
    }

    /**
     * 初始化队列
     */
    async init() {
        try {
            const redisClient = getQueueClient();

            // 文件处理队列
            this.queues.fileProcessing = new Bull('file-processing', {
                createClient: () => redisClient,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000
                    },
                    timeout: 300000, // 5分钟
                    removeOnComplete: 100,
                    removeOnFail: 200
                }
            });

            // 通知队列
            this.queues.notification = new Bull('notification', {
                createClient: () => redisClient,
                defaultJobOptions: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    },
                    timeout: 60000,
                    removeOnComplete: 500,
                    removeOnFail: 500
                }
            });

            // 报告生成队列
            this.queues.reportGeneration = new Bull('report-generation', {
                createClient: () => redisClient,
                defaultJobOptions: {
                    attempts: 2,
                    backoff: 3000,
                    timeout: 120000,
                    removeOnComplete: 50
                }
            });

            // 清理队列
            this.queues.cleanup = new Bull('cleanup', {
                createClient: () => redisClient,
                defaultJobOptions: {
                    attempts: 1,
                    repeat: {
                        cron: '0 2 * * *' // 每天凌晨2点
                    }
                }
            });

            this.setupEventHandlers();
            this.setupMetrics();

            this.isInitialized = true;
            logger.info('✅ 任务队列初始化成功');

            return this;

        } catch (error) {
            logger.error('❌ 任务队列初始化失败:', error.message);
            throw error;
        }
    }

    /**
     * 设置队列事件处理器
     */
    setupEventHandlers() {
        for (const [name, queue] of Object.entries(this.queues)) {
            queue.on('completed', (job, result) => {
                logger.info(`✅ 任务完成: ${name}`, {
                    jobId: job.id,
                    tenantId: job.data.tenantId,
                    duration: job.finishedOn - job.processedOn
                });
            });

            queue.on('failed', (job, error) => {
                logger.error(`❌ 任务失败: ${name}`, {
                    jobId: job.id,
                    tenantId: job.data.tenantId,
                    attempts: job.attemptsMade,
                    error: error.message
                });

                // 达到最大重试次数时发送告警
                if (job.attemptsMade >= 3) {
                    this.sendAlert(name, job, error);
                }
            });

            queue.on('stalled', (job) => {
                logger.warn(`⚠️ 任务卡住: ${name}`, {
                    jobId: job.id,
                    tenantId: job.data.tenantId
                });
            });

            queue.on('progress', (job, progress) => {
                logger.debug(`📊 任务进度: ${name}`, {
                    jobId: job.id,
                    progress
                });
            });
        }
    }

    /**
     * 设置监控指标
     */
    setupMetrics() {
        setInterval(async () => {
            for (const [name, queue] of Object.entries(this.queues)) {
                try {
                    const counts = await queue.getJobCounts();
                    // 记录指标（可接入 Prometheus）
                    logger.debug(`📊 队列统计: ${name}`, counts);
                } catch (error) {
                    // 忽略错误
                }
            }
        }, 30000);
    }

    /**
     * 添加文件处理任务
     */
    async addFileProcessingJob(tenantId, filePath, options = {}) {
        await this.ensureInitialized();

        const job = await this.queues.fileProcessing.add(
            {
                tenantId,
                filePath,
                ...options
            },
            {
                priority: options.priority || 1,
                jobId: `${tenantId}-${Date.now()}`,
                ...options.jobOptions
            }
        );

        logger.info(`📋 文件处理任务已入队`, {
            jobId: job.id,
            tenantId,
            filePath
        });

        return job;
    }

    /**
     * 添加批量处理任务
     */
    async addBatchProcessingJob(tenantId, files, options = {}) {
        await this.ensureInitialized();

        const job = await this.queues.fileProcessing.add(
            {
                type: 'batch',
                tenantId,
                files,
                ...options
            },
            {
                priority: options.priority || 1,
                ...options.jobOptions
            }
        );

        logger.info(`📋 批量处理任务已入队`, {
            jobId: job.id,
            tenantId,
            fileCount: files.length
        });

        return job;
    }

    /**
     * 添加通知任务
     */
    async addNotificationJob(tenantId, type, data) {
        await this.ensureInitialized();

        const job = await this.queues.notification.add({
            tenantId,
            type,
            data,
            timestamp: Date.now()
        });

        return job;
    }

    /**
     * 获取任务状态
     */
    async getJobStatus(queueName, jobId) {
        await this.ensureInitialized();

        const queue = this.queues[queueName];
        if (!queue) {
            throw new Error(`队列 ${queueName} 不存在`);
        }

        const job = await queue.getJob(jobId);
        if (!job) {
            return null;
        }

        const state = await job.getState();
        const progress = job.progress();
        const result = job.returnvalue;

        return {
            jobId: job.id,
            state,
            progress,
            result,
            attempts: job.attemptsMade,
            timestamp: job.timestamp,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            data: job.data
        };
    }

    /**
     * 获取队列状态
     */
    async getQueueStatus(queueName) {
        await this.ensureInitialized();

        const queue = this.queues[queueName];
        if (!queue) {
            throw new Error(`队列 ${queueName} 不存在`);
        }

        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount()
        ]);

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed
        };
    }

    /**
     * 暂停队列
     */
    async pauseQueue(queueName) {
        await this.ensureInitialized();

        const queue = this.queues[queueName];
        if (!queue) {
            throw new Error(`队列 ${queueName} 不存在`);
        }
        await queue.pause();
        logger.info(`⏸️ 队列已暂停: ${queueName}`);
    }

    /**
     * 恢复队列
     */
    async resumeQueue(queueName) {
        await this.ensureInitialized();

        const queue = this.queues[queueName];
        if (!queue) {
            throw new Error(`队列 ${queueName} 不存在`);
        }
        await queue.resume();
        logger.info(`▶️ 队列已恢复: ${queueName}`);
    }

    /**
     * 清理已完成的任务
     */
    async cleanCompleted(queueName, age = 86400000) {
        await this.ensureInitialized();

        const queue = this.queues[queueName];
        if (!queue) {
            throw new Error(`队列 ${queueName} 不存在`);
        }

        const cleaned = await queue.clean(age, 'completed');
        logger.info(`🧹 清理完成: ${queueName}`, {
            cleanedCount: cleaned.length
        });

        return cleaned;
    }

    /**
     * 发送告警
     */
    async sendAlert(queueName, job, error) {
        logger.error(`🚨 告警: ${queueName} 队列任务失败`, {
            jobId: job.id,
            tenantId: job.data.tenantId,
            error: error.message
        });

        // TODO: 接入钉钉、Slack、企业微信等
    }

    /**
     * 确保队列已初始化
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.init();
        }
    }

    /**
     * 关闭所有队列
     */
    async close() {
        for (const [name, queue] of Object.entries(this.queues)) {
            try {
                await queue.close();
                logger.info(`队列已关闭: ${name}`);
            } catch (error) {
                logger.error(`关闭队列失败: ${name}`, error);
            }
        }
    }
}

// 导出单例
module.exports = new QueueManager();