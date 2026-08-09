// backend/src/services/fileService.js
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const fileProcessor = require('../modules/fileProcessor');
const { ProcessingHistory } = require('../models');
const queueManager = require('../core/queueManager');
const notificationService = require('../modules/notification');
const { v4: uuidv4 } = require('uuid');

/**
 * 文件服务类
 * 处理文件上传、处理、管理等业务逻辑
 */
class FileService {
    constructor() {
        this.baseDir = './data/tenants/';
        this.allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.csv,.xlsx,.xls,.json,.txt,.zip').split(',');
        this.maxSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024;
    }

    /**
     * 获取租户文件目录
     */
    getTenantDir(tenantId) {
        return path.join(this.baseDir, tenantId);
    }

    /**
     * 获取租户子目录
     */
    getSubDir(tenantId, subDir) {
        return path.join(this.getTenantDir(tenantId), subDir);
    }

    /**
     * 确保目录存在
     */
    ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * 保存上传的文件
     */
    async saveUploadedFiles(tenantId, files) {
        const results = [];

        for (const file of files) {
            try {
                const tenantDir = this.getSubDir(tenantId, 'incoming');
                this.ensureDir(tenantDir);

                const timestamp = Date.now();
                const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filename = `${timestamp}-${originalName}`;
                const filePath = path.join(tenantDir, filename);

                // 移动文件
                fs.renameSync(file.path, filePath);

                results.push({
                    originalName: file.originalname,
                    filename,
                    filePath,
                    size: file.size,
                    mimetype: file.mimetype
                });

                // 记录处理历史
                await ProcessingHistory.create({
                    tenantId,
                    fileName: file.originalname,
                    filePath,
                    fileSize: file.size,
                    status: 'pending'
                });

                logger.info(`文件保存成功: ${tenantId} -> ${filename}`);

            } catch (error) {
                logger.error(`保存文件失败 (${tenantId}):`, error.message);
                // 清理临时文件
                try { fs.unlinkSync(file.path); } catch (e) {}
                throw error;
            }
        }

        return results;
    }

    /**
     * 处理文件
     */
    async processFile(tenantId, filePath, options = {}) {
        try {
            // 验证文件
            await this.validateFile(filePath);

            // 加入处理队列
            const job = await queueManager.addFileProcessingJob(tenantId, filePath, options);

            // 更新处理历史
            await ProcessingHistory.update(
                { jobId: job.id, status: 'processing' },
                { where: { filePath } }
            );

            return {
                jobId: job.id,
                status: 'queued'
            };

        } catch (error) {
            logger.error(`处理文件失败 (${tenantId}):`, error.message);
            
            // 更新状态为失败
            await ProcessingHistory.update(
                { status: 'failed', errorMessage: error.message },
                { where: { filePath } }
            );

            throw error;
        }
    }

    /**
     * 批量处理文件
     */
    async processFiles(tenantId, filePaths, options = {}) {
        const results = [];

        for (const filePath of filePaths) {
            try {
                const result = await this.processFile(tenantId, filePath, options);
                results.push({
                    filePath,
                    success: true,
                    ...result
                });
            } catch (error) {
                results.push({
                    filePath,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 获取文件处理状态
     */
    async getProcessingStatus(jobId) {
        try {
            const status = await queueManager.getJobStatus('fileProcessing', jobId);
            return status;
        } catch (error) {
            logger.error(`获取处理状态失败 (${jobId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取文件列表
     */
    async getFiles(tenantId, filters = {}) {
        try {
            const { status, platform, search, page = 1, limit = 20 } = filters;

            const where = { tenantId };
            if (status && status !== 'all') where.status = status;
            if (platform && platform !== 'all') where.platform = platform;

            if (search) {
                where.fileName = { [Op.like]: `%${search}%` };
            }

            const offset = (page - 1) * limit;

            const { rows, count } = await ProcessingHistory.findAndCountAll({
                where,
                limit,
                offset,
                order: [['processedAt', 'DESC']]
            });

            return {
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error(`获取文件列表失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取文件详情
     */
    async getFile(tenantId, fileId) {
        try {
            const file = await ProcessingHistory.findOne({
                where: { id: fileId, tenantId }
            });

            if (!file) {
                throw new Error('文件不存在');
            }

            return file;
        } catch (error) {
            logger.error(`获取文件详情失败 (${fileId}):`, error.message);
            throw error;
        }
    }

    /**
     * 删除文件
     */
    async deleteFile(tenantId, fileId) {
        try {
            const file = await this.getFile(tenantId, fileId);

            // 删除物理文件
            if (fs.existsSync(file.filePath)) {
                fs.unlinkSync(file.filePath);
            }

            // 删除记录
            await file.destroy();

            logger.info(`文件删除成功: ${tenantId} -> ${file.fileName}`);
            return true;

        } catch (error) {
            logger.error(`删除文件失败 (${fileId}):`, error.message);
            throw error;
        }
    }

    /**
     * 批量删除文件
     */
    async batchDeleteFiles(tenantId, fileIds) {
        const results = {
            success: [],
            failed: []
        };

        for (const fileId of fileIds) {
            try {
                await this.deleteFile(tenantId, fileId);
                results.success.push(fileId);
            } catch (error) {
                results.failed.push({
                    fileId,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 重试处理
     */
    async retryProcessing(tenantId, fileId) {
        try {
            const file = await this.getFile(tenantId, fileId);
            
            if (!fs.existsSync(file.filePath)) {
                throw new Error('源文件不存在');
            }

            // 重新加入队列
            const job = await queueManager.addFileProcessingJob(tenantId, file.filePath, {
                retry: true
            });

            await file.update({
                jobId: job.id,
                status: 'processing',
                errorMessage: null
            });

            return {
                fileId,
                jobId: job.id,
                status: 'queued'
            };

        } catch (error) {
            logger.error(`重试处理失败 (${fileId}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取文件统计
     */
    async getFileStats(tenantId) {
        try {
            const stats = await ProcessingHistory.findAll({
                where: { tenantId },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('file_size')), 'totalSize']
                ],
                group: ['status']
            });

            const total = stats.reduce((sum, s) => sum + s.dataValues.count, 0);
            const totalSize = stats.reduce((sum, s) => sum + (s.dataValues.totalSize || 0), 0);

            return {
                total,
                totalSize,
                details: stats
            };
        } catch (error) {
            logger.error(`获取文件统计失败 (${tenantId}):`, error.message);
            throw error;
        }
    }

    /**
     * 验证文件
     */
    async validateFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();

        // 检查文件类型
        if (!this.allowedTypes.includes(ext)) {
            throw new Error(`不支持的文件类型: ${ext}`);
        }

        // 检查文件大小
        const stats = fs.statSync(filePath);
        if (stats.size > this.maxSize) {
            throw new Error(`文件大小超过限制 (${this.maxSize / 1024 / 1024}MB)`);
        }

        // 检查文件是否为空
        if (stats.size === 0) {
            throw new Error('文件为空');
        }

        return true;
    }

    /**
     * 清理临时文件
     */
    async cleanTempFiles(age = 86400000) { // 默认1天
        const dirs = ['incoming', 'temp'];
        let cleaned = 0;

        for (const dir of dirs) {
            // 实际实现需要遍历所有租户目录
            // 这里简化处理
            logger.info(`清理临时文件: ${dir}`);
        }

        return cleaned;
    }
}

module.exports = new FileService();