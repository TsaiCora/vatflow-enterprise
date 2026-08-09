// backend/src/api/v1/transactions.js
const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const transactionService = require('../../services/transactionService');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { validateQuery, validateParams } = require('../middleware');
const { schemas } = require('../../middleware/validator');

/**
 * GET /api/v1/transactions
 * 获取交易列表
 */
router.get('/',
    authenticate,
    requirePermission('transaction:list'),
    validateQuery(schemas.pagination),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { page, limit } = req.validatedQuery;
            const { country, status, platform, search, startDate, endDate } = req.query;

            const result = await transactionService.getTransactions(tenantId, {
                page,
                limit,
                country,
                status,
                platform,
                search,
                startDate,
                endDate
            });

            res.json(result);
        } catch (error) {
            logger.error('获取交易列表失败:', error);
            res.status(500).json({
                success: false,
                error: '获取交易列表失败'
            });
        }
    }
);

/**
 * GET /api/v1/transactions/stats
 * 获取交易统计
 */
router.get('/stats',
    authenticate,
    requirePermission('transaction:list'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { period, country } = req.query;

            const stats = await transactionService.getTransactionStats(tenantId, {
                period,
                country
            });

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('获取交易统计失败:', error);
            res.status(500).json({
                success: false,
                error: '获取交易统计失败'
            });
        }
    }
);

/**
 * GET /api/v1/transactions/:transactionId
 * 获取交易详情
 */
router.get('/:transactionId',
    authenticate,
    requirePermission('transaction:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const transactionId = parseInt(req.params.transactionId);

            const transaction = await transactionService.getTransaction(tenantId, transactionId);

            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            logger.error('获取交易详情失败:', error);
            res.status(error.message.includes('不存在') ? 404 : 500).json({
                success: false,
                error: error.message || '获取交易详情失败'
            });
        }
    }
);

/**
 * PUT /api/v1/transactions/:transactionId/status
 * 更新交易状态
 */
router.put('/:transactionId/status',
    authenticate,
    requirePermission('transaction:list'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const transactionId = parseInt(req.params.transactionId);
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: '请指定状态'
                });
            }

            const transaction = await transactionService.updateTransactionStatus(
                tenantId,
                transactionId,
                status
            );

            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            logger.error('更新交易状态失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '更新交易状态失败'
            });
        }
    }
);

/**
 * POST /api/v1/transactions/batch-update
 * 批量更新交易状态
 */
router.post('/batch-update',
    authenticate,
    requirePermission('transaction:list'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { transactionIds, status } = req.body;

            if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '请指定交易ID列表'
                });
            }

            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: '请指定状态'
                });
            }

            const result = await transactionService.batchUpdateStatus(
                tenantId,
                transactionIds,
                status
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('批量更新交易状态失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '批量更新交易状态失败'
            });
        }
    }
);

/**
 * DELETE /api/v1/transactions/:transactionId
 * 删除交易
 */
router.delete('/:transactionId',
    authenticate,
    requirePermission('transaction:list'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const transactionId = parseInt(req.params.transactionId);

            await transactionService.deleteTransaction(tenantId, transactionId);

            res.json({
                success: true,
                message: '交易已删除'
            });
        } catch (error) {
            logger.error('删除交易失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '删除交易失败'
            });
        }
    }
);

/**
 * POST /api/v1/transactions/batch-delete
 * 批量删除交易
 */
router.post('/batch-delete',
    authenticate,
    requirePermission('transaction:list'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { transactionIds } = req.body;

            if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '请指定交易ID列表'
                });
            }

            const result = await transactionService.batchDeleteTransactions(tenantId, transactionIds);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('批量删除交易失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '批量删除交易失败'
            });
        }
    }
);

/**
 * GET /api/v1/transactions/export
 * 导出交易数据
 */
router.get('/export',
    authenticate,
    requirePermission('transaction:list'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { country, status, platform, search, startDate, endDate } = req.query;

            const data = await transactionService.exportTransactions(tenantId, {
                country,
                status,
                platform,
                search,
                startDate,
                endDate
            });

            // 生成 CSV
            const headers = ['orderId', 'country', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount', 'taxRate', 'orderDate', 'status'];
            const rows = data.map(tx => [
                tx.orderId,
                tx.country,
                tx.vatNumber || '',
                tx.netAmount || 0,
                tx.vatAmount || 0,
                tx.grossAmount || 0,
                tx.taxRate || 0,
                tx.orderDate || '',
                tx.status || ''
            ]);

            const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
            res.send('\uFEFF' + csv);

        } catch (error) {
            logger.error('导出交易失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '导出交易失败'
            });
        }
    }
);

/**
 * GET /api/v1/transactions/periods
 * 获取期间列表
 */
router.get('/periods',
    authenticate,
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const periods = await transactionService.getPeriods(tenantId);

            res.json({
                success: true,
                data: periods
            });
        } catch (error) {
            logger.error('获取期间列表失败:', error);
            res.status(500).json({
                success: false,
                error: '获取期间列表失败'
            });
        }
    }
);

module.exports = router;