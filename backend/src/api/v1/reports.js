// backend/src/api/v1/reports.js
const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const reportService = require('../../services/reportService');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { validateQuery, validateBody, validateParams } = require('../middleware');
const { schemas } = require('../../middleware/validator');

/**
 * GET /api/v1/reports
 * 获取报告列表
 */
router.get('/',
    authenticate,
    requirePermission('report:list'),
    validateQuery(schemas.pagination),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { page, limit } = req.validatedQuery;
            const { status, country, period } = req.query;

            const result = await reportService.getReports(tenantId, {
                status,
                country,
                period,
                page,
                limit
            });

            res.json(result);
        } catch (error) {
            logger.error('获取报告列表失败:', error);
            res.status(500).json({
                success: false,
                error: '获取报告列表失败'
            });
        }
    }
);

/**
 * POST /api/v1/reports/generate
 * 生成报告
 */
router.post('/generate',
    authenticate,
    requirePermission('report:generate'),
    validateBody(schemas.generateReport),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const options = {
                ...req.validatedBody,
                email: req.user.email,
                name: req.user.name
            };

            const result = await reportService.generateReport(tenantId, options);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('生成报告失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '生成报告失败'
            });
        }
    }
);

/**
 * GET /api/v1/reports/:reportId
 * 获取报告详情
 */
router.get('/:reportId',
    authenticate,
    requirePermission('report:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const reportId = parseInt(req.params.reportId);

            const report = await reportService.getReport(tenantId, reportId);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('获取报告详情失败:', error);
            res.status(error.message.includes('不存在') ? 404 : 500).json({
                success: false,
                error: error.message || '获取报告详情失败'
            });
        }
    }
);

/**
 * GET /api/v1/reports/:reportId/preview
 * 获取报告预览
 */
router.get('/:reportId/preview',
    authenticate,
    requirePermission('report:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const reportId = parseInt(req.params.reportId);

            const preview = await reportService.getReportPreview(tenantId, reportId);

            res.json({
                success: true,
                data: preview
            });
        } catch (error) {
            logger.error('获取报告预览失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '获取报告预览失败'
            });
        }
    }
);

/**
 * PUT /api/v1/reports/:reportId/submit
 * 提交报告
 */
router.put('/:reportId/submit',
    authenticate,
    requirePermission('report:generate'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const reportId = parseInt(req.params.reportId);

            const report = await reportService.submitReport(tenantId, reportId, req.body);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('提交报告失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '提交报告失败'
            });
        }
    }
);

/**
 * DELETE /api/v1/reports/:reportId
 * 删除报告
 */
router.delete('/:reportId',
    authenticate,
    requirePermission('report:generate'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const reportId = parseInt(req.params.reportId);

            await reportService.deleteReport(tenantId, reportId);

            res.json({
                success: true,
                message: '报告已删除'
            });
        } catch (error) {
            logger.error('删除报告失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '删除报告失败'
            });
        }
    }
);

/**
 * GET /api/v1/reports/:reportId/download
 * 下载报告
 */
router.get('/:reportId/download',
    authenticate,
    requirePermission('report:download'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const reportId = parseInt(req.params.reportId);
            const { format } = req.query;

            const report = await reportService.getReport(tenantId, reportId);
            
            if (!report.reportData) {
                return res.status(404).json({
                    success: false,
                    error: '报告文件不存在'
                });
            }

            // 根据格式返回不同的文件
            // 这里简化处理，实际需要生成并返回文件
            res.json({
                success: true,
                message: '下载功能需要配置'
            });
        } catch (error) {
            logger.error('下载报告失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '下载报告失败'
            });
        }
    }
);

/**
 * POST /api/v1/reports/:reportId/share
 * 分享报告
 */
router.post('/:reportId/share',
    authenticate,
    requirePermission('report:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const reportId = parseInt(req.params.reportId);
            const { email, message, expiresIn } = req.body;

            // TODO: 实现报告分享逻辑
            logger.info(`分享报告: ${reportId} -> ${email}`);

            res.json({
                success: true,
                message: '报告已分享'
            });
        } catch (error) {
            logger.error('分享报告失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '分享报告失败'
            });
        }
    }
);

/**
 * POST /api/v1/reports/:reportId/email
 * 发送报告邮件
 */
router.post('/:reportId/email',
    authenticate,
    requirePermission('report:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const reportId = parseInt(req.params.reportId);
            const { to, cc, subject, message } = req.body;

            // TODO: 实现发送报告邮件逻辑
            logger.info(`发送报告邮件: ${reportId} -> ${to}`);

            res.json({
                success: true,
                message: '报告邮件已发送'
            });
        } catch (error) {
            logger.error('发送报告邮件失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '发送报告邮件失败'
            });
        }
    }
);

module.exports = router;