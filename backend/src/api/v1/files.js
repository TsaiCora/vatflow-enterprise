// backend/src/api/v1/files.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../../utils/logger');
const fileService = require('../../services/fileService');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { validateQuery, validateParams } = require('../middleware');
const { schemas } = require('../../middleware/validator');

// 配置 multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tenantId = req.user.tenantId;
        const dir = fileService.getSubDir(tenantId, 'temp');
        fileService.ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}-${originalName}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.csv,.xlsx,.xls,.json,.txt,.zip').split(',');
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`不支持的文件类型: ${ext}`));
        }
    }
});

/**
 * POST /api/v1/files/upload
 * 上传文件
 */
router.post('/upload',
    authenticate,
    requirePermission('file:upload'),
    upload.array('files', 20),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const files = req.files;

            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '请选择要上传的文件'
                });
            }

            // 保存文件
            const savedFiles = await fileService.saveUploadedFiles(tenantId, files);

            // 处理文件
            const filePaths = savedFiles.map(f => f.filePath);
            const result = await fileService.processFiles(tenantId, filePaths, {
                email: req.user.email,
                name: req.user.name
            });

            res.json({
                success: true,
                data: {
                    files: savedFiles,
                    processing: result
                }
            });
        } catch (error) {
            logger.error('文件上传失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '文件上传失败'
            });
        }
    }
);

/**
 * GET /api/v1/files
 * 获取文件列表
 */
router.get('/',
    authenticate,
    requirePermission('file:list'),
    validateQuery(schemas.pagination),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { page, limit } = req.validatedQuery;
            const { status, platform, search } = req.query;

            const result = await fileService.getFiles(tenantId, {
                status,
                platform,
                search,
                page,
                limit
            });

            res.json(result);
        } catch (error) {
            logger.error('获取文件列表失败:', error);
            res.status(500).json({
                success: false,
                error: '获取文件列表失败'
            });
        }
    }
);

/**
 * GET /api/v1/files/status/:jobId
 * 获取处理状态
 */
router.get('/status/:jobId',
    authenticate,
    async (req, res) => {
        try {
            const { jobId } = req.params;
            const status = await fileService.getProcessingStatus(jobId);

            if (!status) {
                return res.status(404).json({
                    success: false,
                    error: '任务不存在'
                });
            }

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('获取处理状态失败:', error);
            res.status(500).json({
                success: false,
                error: '获取处理状态失败'
            });
        }
    }
);

/**
 * GET /api/v1/files/:fileId
 * 获取文件详情
 */
router.get('/:fileId',
    authenticate,
    requirePermission('file:view'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const fileId = parseInt(req.params.fileId);

            const file = await fileService.getFile(tenantId, fileId);

            res.json({
                success: true,
                data: file
            });
        } catch (error) {
            logger.error('获取文件详情失败:', error);
            res.status(error.message.includes('不存在') ? 404 : 500).json({
                success: false,
                error: error.message || '获取文件详情失败'
            });
        }
    }
);

/**
 * DELETE /api/v1/files/:fileId
 * 删除文件
 */
router.delete('/:fileId',
    authenticate,
    requirePermission('file:delete'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const fileId = parseInt(req.params.fileId);

            await fileService.deleteFile(tenantId, fileId);

            res.json({
                success: true,
                message: '文件已删除'
            });
        } catch (error) {
            logger.error('删除文件失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '删除文件失败'
            });
        }
    }
);

/**
 * POST /api/v1/files/:fileId/retry
 * 重试处理
 */
router.post('/:fileId/retry',
    authenticate,
    requirePermission('file:upload'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const fileId = parseInt(req.params.fileId);

            const result = await fileService.retryProcessing(tenantId, fileId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('重试处理失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '重试处理失败'
            });
        }
    }
);

/**
 * POST /api/v1/files/batch-delete
 * 批量删除文件
 */
router.post('/batch-delete',
    authenticate,
    requirePermission('file:delete'),
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const { fileIds } = req.body;

            if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '请指定要删除的文件ID'
                });
            }

            const result = await fileService.batchDeleteFiles(tenantId, fileIds);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('批量删除文件失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '批量删除文件失败'
            });
        }
    }
);

/**
 * GET /api/v1/files/stats
 * 获取文件统计
 */
router.get('/stats',
    authenticate,
    async (req, res) => {
        try {
            const tenantId = req.user.tenantId;
            const stats = await fileService.getFileStats(tenantId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('获取文件统计失败:', error);
            res.status(500).json({
                success: false,
                error: '获取文件统计失败'
            });
        }
    }
);

module.exports = router;