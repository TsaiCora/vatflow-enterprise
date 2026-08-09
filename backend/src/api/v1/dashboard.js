// backend/src/api/v1/dashboard.js
const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const dashboardService = require('../../services/dashboardService');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');

/**
 * GET /api/v1/dashboard
 * 获取看板数据
 */
router.get('/',
    authenticate,
    requirePermission('dashboard:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            
            // 管理员可以查看全局看板
            const isAdmin = req.user.role === 'admin';
            const data = await dashboardService.getDashboardData(
                isAdmin ? null : tenantId
            );

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('获取看板数据失败:', error);
            res.status(500).json({
                success: false,
                error: '获取看板数据失败'
            });
        }
    }
);

/**
 * GET /api/v1/dashboard/vat-trend
 * 获取 VAT 趋势
 */
router.get('/vat-trend',
    authenticate,
    requirePermission('dashboard:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { period = 'month' } = req.query;

            const isAdmin = req.user.role === 'admin';
            const data = await dashboardService.getVATTrend(
                isAdmin ? null : tenantId,
                period
            );

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('获取 VAT 趋势失败:', error);
            res.status(500).json({
                success: false,
                error: '获取 VAT 趋势失败'
            });
        }
    }
);

/**
 * GET /api/v1/dashboard/country-distribution
 * 获取国家分布
 */
router.get('/country-distribution',
    authenticate,
    requirePermission('dashboard:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const isAdmin = req.user.role === 'admin';
            const data = await dashboardService.getCountryDistribution(
                isAdmin ? null : tenantId
            );

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('获取国家分布失败:', error);
            res.status(500).json({
                success: false,
                error: '获取国家分布失败'
            });
        }
    }
);

/**
 * GET /api/v1/dashboard/recent-activities
 * 获取最近活动
 */
router.get('/recent-activities',
    authenticate,
    requirePermission('dashboard:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { limit = 10 } = req.query;

            const isAdmin = req.user.role === 'admin';
            const data = await dashboardService.getRecentActivities(
                isAdmin ? null : tenantId,
                parseInt(limit)
            );

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('获取最近活动失败:', error);
            res.status(500).json({
                success: false,
                error: '获取最近活动失败'
            });
        }
    }
);

/**
 * GET /api/v1/dashboard/system-overview
 * 获取系统概览（管理员）
 */
router.get('/system-overview',
    authenticate,
    requirePermission('dashboard:view'),
    async (req, res) => {
        try {
            // 只有管理员可以查看系统概览
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: '权限不足'
                });
            }

            const data = await dashboardService.getSystemOverview();

            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('获取系统概览失败:', error);
            res.status(500).json({
                success: false,
                error: '获取系统概览失败'
            });
        }
    }
);

module.exports = router;