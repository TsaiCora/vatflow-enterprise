// backend/src/api/v1/tenants.js
const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const tenantService = require('../../services/tenantService');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { requirePermission } = require('../../middleware/rbac');
const { validateQuery, validateBody, validateParams } = require('../middleware');
const { schemas } = require('../../middleware/validator');

/**
 * GET /api/v1/tenants
 * 获取客户列表 (管理员)
 */
router.get('/',
    authenticate,
    requireRole('admin'),
    validateQuery(schemas.pagination),
    async (req, res) => {
        try {
            const { page, limit } = req.validatedQuery || { page: 1, limit: 20 };
            const { status, country, search } = req.query;

            const result = await tenantService.getTenants({
                status,
                country,
                search,
                page,
                limit
            });

            res.json(result);
        } catch (error) {
            logger.error('获取客户列表失败:', error);
            res.status(500).json({
                success: false,
                error: '获取客户列表失败'
            });
        }
    }
);

/**
 * POST /api/v1/tenants
 * 创建客户
 */
router.post('/',
    authenticate,
    requireRole('admin'),
    validateBody(schemas.createTenant),
    async (req, res) => {
        try {
            const tenant = await tenantService.createTenant(req.validatedBody);

            const data = tenant.toJSON();
            delete data.passwordHash;
            delete data.apiKey;

            res.status(201).json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('创建客户失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '创建客户失败'
            });
        }
    }
);

/**
 * GET /api/v1/tenants/:tenantId
 * 获取客户详情
 */
router.get('/:tenantId',
    authenticate,
    validateParams(schemas.tenantIdParam),
    async (req, res) => {
        try {
            const { tenantId } = req.validatedParams;

            if (req.user.role !== 'admin' && req.user.tenantId !== tenantId) {
                return res.status(403).json({
                    success: false,
                    error: '无权查看此客户数据'
                });
            }

            const tenant = await tenantService.getTenant(tenantId);

            const data = tenant.toJSON();
            delete data.passwordHash;
            delete data.apiKey;

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('获取客户详情失败:', error);
            res.status(error.message.includes('不存在') ? 404 : 500).json({
                success: false,
                error: error.message || '获取客户详情失败'
            });
        }
    }
);

/**
 * PUT /api/v1/tenants/:tenantId
 * 更新客户
 */
router.put('/:tenantId',
    authenticate,
    validateParams(schemas.tenantIdParam),
    validateBody(schemas.updateTenant),
    async (req, res) => {
        try {
            const { tenantId } = req.validatedParams;

            if (req.user.role !== 'admin' && req.user.tenantId !== tenantId) {
                return res.status(403).json({
                    success: false,
                    error: '无权修改此客户数据'
                });
            }

            const tenant = await tenantService.updateTenant(tenantId, req.validatedBody);

            const data = tenant.toJSON();
            delete data.passwordHash;
            delete data.apiKey;

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('更新客户失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '更新客户失败'
            });
        }
    }
);

/**
 * DELETE /api/v1/tenants/:tenantId
 * 删除客户
 */
router.delete('/:tenantId',
    authenticate,
    requireRole('admin'),
    validateParams(schemas.tenantIdParam),
    async (req, res) => {
        try {
            const { tenantId } = req.validatedParams;
            await tenantService.deleteTenant(tenantId);

            res.json({
                success: true,
                message: '客户已删除'
            });
        } catch (error) {
            logger.error('删除客户失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '删除客户失败'
            });
        }
    }
);

/**
 * POST /api/v1/tenants/:tenantId/toggle
 * 切换客户状态
 */
router.post('/:tenantId/toggle',
    authenticate,
    requireRole('admin'),
    validateParams(schemas.tenantIdParam),
    async (req, res) => {
        try {
            const { tenantId } = req.validatedParams;
            const tenant = await tenantService.toggleStatus(tenantId);

            res.json({
                success: true,
                data: {
                    tenantId: tenant.tenantId,
                    status: tenant.status
                }
            });
        } catch (error) {
            logger.error('切换客户状态失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '切换客户状态失败'
            });
        }
    }
);

/**
 * GET /api/v1/tenants/:tenantId/stats
 * 获取客户统计
 */
router.get('/:tenantId/stats',
    authenticate,
    validateParams(schemas.tenantIdParam),
    async (req, res) => {
        try {
            const { tenantId } = req.validatedParams;

            if (req.user.role !== 'admin' && req.user.tenantId !== tenantId) {
                return res.status(403).json({
                    success: false,
                    error: '无权查看此客户数据'
                });
            }

            const stats = await tenantService.getTenantStats(tenantId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('获取客户统计失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '获取客户统计失败'
            });
        }
    }
);

module.exports = router;