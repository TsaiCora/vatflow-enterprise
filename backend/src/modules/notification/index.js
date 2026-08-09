// backend/src/modules/notification/index.js
const emailService = require('./emailService');
const webhookService = require('./webhookService');
const { logger } = require('../../utils/logger');

/**
 * 通知服务
 * 统一发送通知（邮件 + Webhook）
 */
class NotificationService {
    constructor() {
        this.email = emailService;
        this.webhook = webhookService;
        this.enabled = true;
    }

    /**
     * 发送通知
     * 同时发送邮件和Webhook
     */
    async notify(tenantId, event, data, options = {}) {
        const results = {
            email: null,
            webhook: null
        };

        // 发送邮件
        if (options.sendEmail !== false) {
            try {
                results.email = await this.email.sendTemplate(
                    data.email || options.email,
                    options.template || event,
                    {
                        name: data.name || '用户',
                        ...data
                    },
                    options.emailOptions || {}
                );
            } catch (error) {
                logger.error('邮件通知失败:', error.message);
                results.email = { success: false, error: error.message };
            }
        }

        // 发送 Webhook
        if (options.sendWebhook !== false) {
            try {
                results.webhook = await this.webhook.trigger(
                    tenantId,
                    event,
                    data,
                    options.webhookOptions || {}
                );
            } catch (error) {
                logger.error('Webhook 通知失败:', error.message);
                results.webhook = { success: false, error: error.message };
            }
        }

        return results;
    }

    /**
     * 文件处理完成通知
     */
    async notifyFileProcessed(tenantId, data) {
        return this.notify(tenantId, 'file.processed', data, {
            template: 'fileProcessed',
            sendEmail: true,
            sendWebhook: true,
            emailOptions: {
                subject: `文件处理完成 - ${data.filename}`
            }
        });
    }

    /**
     * 文件处理失败通知
     */
    async notifyFileFailed(tenantId, data) {
        return this.notify(tenantId, 'file.failed', data, {
            template: 'processingFailed',
            sendEmail: true,
            sendWebhook: true,
            emailOptions: {
                subject: `文件处理失败 - ${data.filename}`
            }
        });
    }

    /**
     * 报告生成完成通知
     */
    async notifyReportReady(tenantId, data) {
        return this.notify(tenantId, 'report.ready', data, {
            template: 'reportReady',
            sendEmail: true,
            sendWebhook: true,
            emailOptions: {
                subject: `VAT申报报告已生成 - ${data.period}`
            }
        });
    }

    /**
     * 欢迎通知
     */
    async notifyWelcome(tenantId, data) {
        return this.notify(tenantId, 'user.welcome', data, {
            template: 'welcome',
            sendEmail: true,
            sendWebhook: false,
            emailOptions: {
                subject: '欢迎加入 VATFlow'
            }
        });
    }

    /**
     * 密码重置通知
     */
    async notifyPasswordReset(tenantId, data) {
        return this.notify(tenantId, 'auth.password_reset', data, {
            template: 'passwordReset',
            sendEmail: true,
            sendWebhook: false,
            emailOptions: {
                subject: '密码重置请求'
            }
        });
    }

    /**
     * 系统通知
     */
    async notifySystem(tenantId, data) {
        return this.notify(tenantId, 'system.notification', data, {
            template: 'systemNotification',
            sendEmail: true,
            sendWebhook: true,
            emailOptions: {
                subject: `系统通知 - ${data.title}`
            }
        });
    }

    /**
     * 获取服务状态
     */
    getStatus() {
        return {
            enabled: this.enabled,
            email: this.email.getStatus ? this.email.getStatus() : { configured: !!this.email.transporter },
            webhook: this.webhook.getStatus ? this.webhook.getStatus() : { enabled: true }
        };
    }
}

// 导出单例
module.exports = new NotificationService();