// backend/src/api/v1/webhooks.js
const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const webhookService = require('../../services/webhookService');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { validateBody, validateParams } = require('../middleware');
const { schemas } = require('../../middleware/validator');

/**
 * GET /api/v1/webhooks
 * 获取 Webhook 列表
 */
router.get('/',
    authenticate,
    requirePermission('webhook:list'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const webhooks = await webhookService.getWebhooks(tenantId);

            res.json({
                success: true,
                data: webhooks
            });
        } catch (error) {
            logger.error('获取 Webhook 列表失败:', error);
            res.status(500).json({
                success: false,
                error: '获取 Webhook 列表失败'
            });
        }
    }
);

/**
 * POST /api/v1/webhooks
 * 创建 Webhook
 */
router.post('/',
    authenticate,
    requirePermission('webhook:create'),
    validateBody(schemas.createWebhook),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const webhook = await webhookService.createWebhook(tenantId, req.validatedBody);

            res.status(201).json({
                success: true,
                data: webhook
            });
        } catch (error) {
            logger.error('创建 Webhook 失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '创建 Webhook 失败'
            });
        }
    }
);

/**
 * GET /api/v1/webhooks/:webhookId
 * 获取 Webhook 详情
 */
router.get('/:webhookId',
    authenticate,
    requirePermission('webhook:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const webhookId = parseInt(req.params.webhookId);

            const webhook = await webhookService.getWebhookConfig(tenantId, webhookId);

            res.json({
                success: true,
                data: webhook
            });
        } catch (error) {
            logger.error('获取 Webhook 详情失败:', error);
            res.status(error.message.includes('不存在') ? 404 : 500).json({
                success: false,
                error: error.message || '获取 Webhook 详情失败'
            });
        }
    }
);

/**
 * PUT /api/v1/webhooks/:webhookId
 * 更新 Webhook
 */
router.put('/:webhookId',
    authenticate,
    requirePermission('webhook:update'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const webhookId = parseInt(req.params.webhookId);
            const updates = req.body;

            const webhook = await webhookService.updateWebhook(tenantId, webhookId, updates);

            res.json({
                success: true,
                data: webhook
            });
        } catch (error) {
            logger.error('更新 Webhook 失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '更新 Webhook 失败'
            });
        }
    }
);

/**
 * DELETE /api/v1/webhooks/:webhookId
 * 删除 Webhook
 */
router.delete('/:webhookId',
    authenticate,
    requirePermission('webhook:delete'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const webhookId = parseInt(req.params.webhookId);

            await webhookService.deleteWebhook(tenantId, webhookId);

            res.json({
                success: true,
                message: 'Webhook 已删除'
            });
        } catch (error) {
            logger.error('删除 Webhook 失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '删除 Webhook 失败'
            });
        }
    }
);

/**
 * POST /api/v1/webhooks/:webhookId/toggle
 * 切换 Webhook 状态
 */
router.post('/:webhookId/toggle',
    authenticate,
    requirePermission('webhook:update'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const webhookId = parseInt(req.params.webhookId);

            const webhook = await webhookService.toggleWebhook(tenantId, webhookId);

            res.json({
                success: true,
                data: {
                    id: webhook.id,
                    active: webhook.active
                }
            });
        } catch (error) {
            logger.error('切换 Webhook 状态失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '切换 Webhook 状态失败'
            });
        }
    }
);

/**
 * POST /api/v1/webhooks/:webhookId/test
 * 测试 Webhook
 */
router.post('/:webhookId/test',
    authenticate,
    requirePermission('webhook:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const webhookId = parseInt(req.params.webhookId);

            const result = await webhookService.testWebhook(tenantId, webhookId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('测试 Webhook 失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '测试 Webhook 失败'
            });
        }
    }
);

/**
 * POST /api/v1/webhooks/:webhookId/trigger
 * 手动触发 Webhook
 */
router.post('/:webhookId/trigger',
    authenticate,
    requirePermission('webhook:create'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const webhookId = parseInt(req.params.webhookId);
            const { event, data } = req.body;

            if (!event) {
                return res.status(400).json({
                    success: false,
                    error: '请指定事件类型'
                });
            }

            const result = await webhookService.triggerWebhook(
                tenantId,
                webhookId,
                event,
                data || {}
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('触发 Webhook 失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '触发 Webhook 失败'
            });
        }
    }
);

module.exports = router;