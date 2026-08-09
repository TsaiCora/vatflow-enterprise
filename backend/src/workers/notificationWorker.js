// backend/src/workers/notificationWorker.js
const { logger } = require('../utils/logger');
const queueManager = require('../core/queueManager');
const emailService = require('../modules/notification/emailService');
const webhookService = require('../modules/notification/webhookService');
const { metrics } = require('../utils/metrics');

/**
 * 通知 Worker
 * 处理邮件和 Webhook 通知任务
 */
class NotificationWorker {
    constructor() {
        this.isRunning = false;
        this.concurrentLimit = 3;
        this.queueName = 'notification';
    }

    /**
     * 启动 Worker
     */
    async start() {
        if (this.isRunning) {
            logger.warn('⚠️ NotificationWorker 已在运行中');
            return;
        }

        logger.info('🚀 启动通知 Worker...');
        this.isRunning = true;

        await queueManager.ensureInitialized();

        // 注册处理器
        queueManager.queues.notification.process(
            this.concurrentLimit,
            async (job) => {
                return await this.processJob(job);
            }
        );

        logger.info(`✅ 通知 Worker 启动成功 (并发数: ${this.concurrentLimit})`);
    }

    /**
     * 处理单个任务
     */
    async processJob(job) {
        const { tenantId, type, data } = job.data;

        try {
            logger.debug(`📨 处理通知任务: ${type}`, { tenantId, jobId: job.id });

            let result;

            switch (type) {
                case 'email':
                    result = await this.processEmail(job.data);
                    break;
                case 'webhook':
                    result = await this.processWebhook(job.data);
                    break;
                case 'both':
                    result = await this.processBoth(job.data);
                    break;
                default:
                    throw new Error(`不支持的通知类型: ${type}`);
            }

            logger.debug(`✅ 通知任务完成: ${type}`, { tenantId, jobId: job.id });

            return result;

        } catch (error) {
            logger.error(`❌ 通知任务失败: ${type}`, {
                tenantId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 处理邮件
     */
    async processEmail(data) {
        const { to, subject, html, text, template, templateData, attachments } = data;

        try {
            let result;

            if (template && templateData) {
                // 使用模板
                result = await emailService.sendTemplate(to, template, templateData, {
                    subject,
                    attachments
                });
            } else {
                // 直接发送
                result = await emailService.send({
                    to,
                    subject,
                    html,
                    text,
                    attachments
                });
            }

            if (!result.success) {
                throw new Error(result.error || '邮件发送失败');
            }

            return result;

        } catch (error) {
            logger.error('邮件发送失败:', error.message);
            throw error;
        }
    }

    /**
     * 处理 Webhook
     */
    async processWebhook(data) {
        const { tenantId, event, payload, webhookIds } = data;

        try {
            const result = await webhookService.trigger(tenantId, event, payload, {
                webhookIds
            });

            if (!result.success) {
                throw new Error(result.error || 'Webhook 触发失败');
            }

            return result;

        } catch (error) {
            logger.error('Webhook 触发失败:', error.message);
            throw error;
        }
    }

    /**
     * 同时处理邮件和 Webhook
     */
    async processBoth(data) {
        const { emailData, webhookData } = data;

        const results = {
            email: null,
            webhook: null
        };

        // 并行执行
        await Promise.all([
            (async () => {
                if (emailData) {
                    try {
                        results.email = await this.processEmail(emailData);
                    } catch (error) {
                        results.email = { success: false, error: error.message };
                    }
                }
            })(),
            (async () => {
                if (webhookData) {
                    try {
                        results.webhook = await this.processWebhook(webhookData);
                    } catch (error) {
                        results.webhook = { success: false, error: error.message };
                    }
                }
            })()
        ]);

        return results;
    }

    /**
     * 停止 Worker
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        logger.info('🛑 停止通知 Worker...');
        this.isRunning = false;

        try {
            await queueManager.queues.notification.close();
            logger.info('✅ 通知 Worker 已停止');
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
module.exports = new NotificationWorker();