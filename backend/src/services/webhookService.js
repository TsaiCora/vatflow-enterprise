// backend/src/services/webhookService.js
const { logger } = require('../utils/logger');
const { Webhook } = require('../models');
const webhookManager = require('../modules/notification/webhookService');

/**
 * Webhook 服务类
 * 处理 Webhook 配置管理
 */
class WebhookService {
    /**
     * 获取 Webhook 列表
     */
    async getWebhooks(tenantId) {
        try {
            const webhooks = await Webhook.findAll({
                where: { tenantId },
                order: [['createdAt', 'DESC']]
            });

            return webhooks;
        } catch (error) {
            logger.error(`获取 Webhook 列表失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 创建 Webhook
     */
    async createWebhook(tenantId, data) {
        try {
            const { url, events, secret, active = true } = data;

            // 验证URL
            try {
                new URL(url);
            } catch {
                throw new Error('无效的URL地址');
            }

            const webhook = await Webhook.create({
                tenantId,
                url,
                secret: secret || null,
                events: events || [],
                active
            });

            // 清除缓存
            webhookManager.clearCache(tenantId);

            logger.info(`Webhook 创建成功: ${tenantId} -> ${webhook.id}`);
            return webhook;

        } catch (error) {
            logger.error(`创建 Webhook 失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 更新 Webhook
     */
    async updateWebhook(tenantId, webhookId, data) {
        try {
            const webhook = await Webhook.findOne({
                where: { id: webhookId, tenantId }
            });

            if (!webhook) {
                throw new Error('Webhook 不存在');
            }

            // 验证URL
            if (data.url) {
                try {
                    new URL(data.url);
                } catch {
                    throw new Error('无效的URL地址');
                }
            }

            await webhook.update(data);

            // 清除缓存
            webhookManager.clearCache(tenantId);

            logger.info(`Webhook 更新成功: ${tenantId} -> ${webhookId}`);
            return webhook;

        } catch (error) {
            logger.error(`更新 Webhook 失败 (${webhookId}):`, error.message);
            throw error;
        }
    }

    /**
     * 删除 Webhook
     */
    async deleteWebhook(tenantId, webhookId) {
        try {
            const webhook = await Webhook.findOne({
                where: { id: webhookId, tenantId }
            });

            if (!webhook) {
                throw new Error('Webhook 不存在');
            }

            await webhook.destroy();

            // 清除缓存
            webhookManager.clearCache(tenantId);

            logger.info(`Webhook 删除成功: ${tenantId} -> ${webhookId}`);
            return true;

        } catch (error) {
            logger.error(`删除 Webhook 失败 (${webhookId}):`, error.message);
            throw error;
        }
    }

    /**
     * 测试 Webhook
     */
    async testWebhook(tenantId, webhookId) {
        try {
            const webhook = await Webhook.findOne({
                where: { id: webhookId, tenantId }
            });

            if (!webhook) {
                throw new Error('Webhook 不存在');
            }

            const result = await webhookManager.testWebhook(webhookId);
            return result;

        } catch (error) {
            logger.error(`测试 Webhook 失败 (${webhookId}):`, error.message);
            throw error;
        }
    }

    /**
     * 切换 Webhook 状态
     */
    async toggleWebhook(tenantId, webhookId) {
        try {
            const webhook = await Webhook.findOne({
                where: { id: webhookId, tenantId }
            });

            if (!webhook) {
                throw new Error('Webhook 不存在');
            }

            await webhook.update({ active: !webhook.active });

            // 清除缓存
            webhookManager.clearCache(tenantId);

            logger.info(`Webhook 状态切换: ${tenantId} -> ${webhookId} -> ${webhook.active}`);
            return webhook;

        } catch (error) {
            logger.error(`切换 Webhook 状态失败 (${webhookId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取 Webhook 配置
     */
    async getWebhookConfig(tenantId, webhookId) {
        try {
            const webhook = await Webhook.findOne({
                where: { id: webhookId, tenantId }
            });

            if (!webhook) {
                throw new Error('Webhook 不存在');
            }

            return webhook;
        } catch (error) {
            logger.error(`获取 Webhook 配置失败 (${webhookId}):`, error.message);
            throw error;
        }
    }

    /**
     * 触发 Webhook（手动）
     */
    async triggerWebhook(tenantId, webhookId, event, data) {
        try {
            const webhook = await Webhook.findOne({
                where: { id: webhookId, tenantId, active: true }
            });

            if (!webhook) {
                throw new Error('Webhook 不存在或已停用');
            }

            const result = await webhookManager.trigger(tenantId, event, data, {
                webhookIds: [webhookId]
            });

            return result;

        } catch (error) {
            logger.error(`触发 Webhook 失败 (${webhookId}):`, error.message);
            throw error;
        }
    }
}

module.exports = new WebhookService();