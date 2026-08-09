// backend/src/modules/notification/webhookService.js
const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');
const { Webhook } = require('../../models');
const { webhook: webhookConfig } = require('../../config');

/**
 * Webhook 服务类
 * 支持：发送Webhook事件、签名验证、重试机制
 */
class WebhookService {
    constructor() {
        this.enabled = webhookConfig?.enabled !== false;
        this.timeout = webhookConfig?.timeout || 30000;
        this.maxRetries = webhookConfig?.maxRetries || 3;
        this.retryDelay = webhookConfig?.retryDelay || 5000;
        this.activeWebhooks = new Map(); // 缓存
        this.cacheTTL = 5 * 60 * 1000; // 5分钟
    }

    /**
     * 触发 Webhook 事件
     */
    async trigger(tenantId, event, payload, options = {}) {
        if (!this.enabled) {
            logger.debug('Webhook 服务已禁用');
            return { success: false, reason: 'disabled' };
        }

        try {
            // 获取租户的活跃 Webhook
            const webhooks = await this.getActiveWebhooks(tenantId);

            if (webhooks.length === 0) {
                logger.debug(`租户 ${tenantId} 没有配置 Webhook`);
                return { success: true, triggered: 0 };
            }

            // 筛选匹配事件的 Webhook
            const matchedWebhooks = webhooks.filter(w => w.shouldTrigger(event));

            if (matchedWebhooks.length === 0) {
                logger.debug(`没有匹配事件 ${event} 的 Webhook`);
                return { success: true, triggered: 0 };
            }

            // 构建 Webhook 负载
            const webhookPayload = {
                id: this.generateId(),
                event,
                timestamp: new Date().toISOString(),
                tenantId,
                data: payload
            };

            // 并行触发
            const promises = matchedWebhooks.map(async (webhook) => {
                try {
                    return await this.sendWebhook(webhook, webhookPayload, options);
                } catch (error) {
                    logger.error(`Webhook 触发失败 (${webhook.id}):`, error.message);
                    return {
                        webhookId: webhook.id,
                        success: false,
                        error: error.message
                    };
                }
            });

            const results = await Promise.all(promises);

            const summary = {
                total: results.length,
                success: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            };

            logger.info(`Webhook 触发完成: ${summary.success}/${summary.total}`, {
                tenantId,
                event,
                summary
            });

            return { success: true, results, summary };

        } catch (error) {
            logger.error(`Webhook 触发失败 (${tenantId}, ${event}):`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发送单个 Webhook
     */
    async sendWebhook(webhook, payload, options = {}) {
        const { retries = 0, timeout = this.timeout } = options;

        try {
            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Id': String(webhook.id),
                'X-Webhook-Event': payload.event,
                'X-Webhook-Timestamp': payload.timestamp,
                'User-Agent': 'VATFlow-Webhook/3.0'
            };

            // 如果配置了密钥，添加签名
            if (webhook.secret) {
                const signature = this.generateSignature(webhook.secret, payload);
                headers['X-Webhook-Signature'] = signature;
            }

            const response = await axios.post(webhook.url, payload, {
                headers,
                timeout,
                validateStatus: (status) => status < 500
            });

            // 更新 Webhook 状态
            await webhook.update({
                lastTriggeredAt: new Date(),
                lastStatus: response.status
            });

            // 如果状态码 >= 400 且未超过重试次数，重试
            if (response.status >= 400 && retries < this.maxRetries) {
                logger.warn(`Webhook 返回错误状态 ${response.status}，重试中...`);
                await this.delay(this.retryDelay);
                return this.sendWebhook(webhook, payload, {
                    ...options,
                    retries: retries + 1
                });
            }

            return {
                webhookId: webhook.id,
                success: response.status < 400,
                status: response.status,
                data: response.data
            };

        } catch (error) {
            // 网络错误重试
            if (retries < this.maxRetries) {
                logger.warn(`Webhook 请求失败，重试中... (${retries + 1}/${this.maxRetries})`);
                await this.delay(this.retryDelay * (retries + 1));
                return this.sendWebhook(webhook, payload, {
                    ...options,
                    retries: retries + 1
                });
            }

            // 更新失败状态
            await webhook.update({
                lastTriggeredAt: new Date(),
                lastStatus: error.response?.status || 500
            });

            throw error;
        }
    }

    /**
     * 获取活跃的 Webhook（带缓存）
     */
    async getActiveWebhooks(tenantId) {
        const cacheKey = `webhooks:${tenantId}`;
        const cached = this.activeWebhooks.get(cacheKey);

        // 检查缓存
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        // 从数据库获取
        const webhooks = await Webhook.findAll({
            where: {
                tenantId,
                active: true
            }
        });

        // 更新缓存
        this.activeWebhooks.set(cacheKey, {
            data: webhooks,
            timestamp: Date.now()
        });

        return webhooks;
    }

    /**
     * 生成 Webhook 签名
     */
    generateSignature(secret, payload) {
        const sortedPayload = JSON.stringify(payload, Object.keys(payload).sort());
        return crypto
            .createHmac('sha256', secret)
            .update(sortedPayload)
            .digest('hex');
    }

    /**
     * 验证 Webhook 签名
     */
    verifySignature(secret, payload, signature) {
        const expected = this.generateSignature(secret, payload);
        return crypto.timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(signature)
        );
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `whk_${timestamp}_${random}`;
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 清除缓存
     */
    clearCache(tenantId = null) {
        if (tenantId) {
            this.activeWebhooks.delete(`webhooks:${tenantId}`);
            logger.debug(`Webhook 缓存已清除: ${tenantId}`);
        } else {
            this.activeWebhooks.clear();
            logger.debug('所有 Webhook 缓存已清除');
        }
    }

    /**
     * 获取 Webhook 服务状态
     */
    getStatus() {
        return {
            enabled: this.enabled,
            timeout: this.timeout,
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay,
            cacheSize: this.activeWebhooks.size
        };
    }

    /**
     * 测试 Webhook
     */
    async testWebhook(webhookId) {
        try {
            const webhook = await Webhook.findByPk(webhookId);
            if (!webhook) {
                throw new Error('Webhook 不存在');
            }

            const testPayload = {
                id: this.generateId(),
                event: 'test',
                timestamp: new Date().toISOString(),
                tenantId: webhook.tenantId,
                data: {
                    test: true,
                    message: 'Webhook 测试请求'
                }
            };

            const result = await this.sendWebhook(webhook, testPayload, {
                retries: 0,
                timeout: 10000
            });

            return {
                success: true,
                result
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 导出单例
module.exports = new WebhookService();