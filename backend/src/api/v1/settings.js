// backend/src/api/v1/settings.js
const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { validateBody } = require('../middleware');
const { schemas } = require('../../middleware/validator');
const cacheManager = require('../../core/cacheManager');

// 系统设置存储（实际项目中应存储在数据库中）
let systemSettings = {
    // 通用设置
    companyName: 'VATFlow',
    companyEmail: 'admin@vatflow.com',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    
    // 税务设置
    defaultRate: 20,
    currency: 'EUR',
    ossEnabled: true,
    mtdEnabled: false,
    viesValidation: true,
    defaultPeriod: 'monthly',
    
    // 通知设置
    emailNotifications: true,
    notifyOnSuccess: true,
    notifyOnError: true,
    weeklyReport: true,
    monthlyReport: true,
    
    // 安全设置
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    ipWhitelist: ''
};

/**
 * GET /api/v1/settings
 * 获取系统设置
 */
router.get('/',
    authenticate,
    async (req, res) => {
        try {
            // 普通用户只能查看部分设置
            const isAdmin = req.user.role === 'admin';
            const settings = { ...systemSettings };
            
            if (!isAdmin) {
                // 隐藏敏感设置
                delete settings.ipWhitelist;
                delete settings.maxLoginAttempts;
            }

            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            logger.error('获取系统设置失败:', error);
            res.status(500).json({
                success: false,
                error: '获取系统设置失败'
            });
        }
    }
);

/**
 * PUT /api/v1/settings
 * 更新系统设置
 */
router.put('/',
    authenticate,
    requireRole('admin'),
    validateBody(schemas.updateSettings),
    async (req, res) => {
        try {
            const updates = req.validatedBody;
            
            // 更新设置
            systemSettings = {
                ...systemSettings,
                ...updates
            };

            logger.info('系统设置已更新', {
                user: req.user.email,
                updates: Object.keys(updates)
            });

            res.json({
                success: true,
                data: systemSettings
            });
        } catch (error) {
            logger.error('更新系统设置失败:', error);
            res.status(500).json({
                success: false,
                error: '更新系统设置失败'
            });
        }
    }
);

/**
 * GET /api/v1/settings/tax
 * 获取税务设置
 */
router.get('/tax',
    authenticate,
    async (req, res) => {
        try {
            const taxSettings = {
                defaultRate: systemSettings.defaultRate,
                currency: systemSettings.currency,
                ossEnabled: systemSettings.ossEnabled,
                mtdEnabled: systemSettings.mtdEnabled,
                viesValidation: systemSettings.viesValidation,
                defaultPeriod: systemSettings.defaultPeriod
            };

            res.json({
                success: true,
                data: taxSettings
            });
        } catch (error) {
            logger.error('获取税务设置失败:', error);
            res.status(500).json({
                success: false,
                error: '获取税务设置失败'
            });
        }
    }
);

/**
 * PUT /api/v1/settings/tax
 * 更新税务设置
 */
router.put('/tax',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
        try {
            const { defaultRate, currency, ossEnabled, mtdEnabled, viesValidation, defaultPeriod } = req.body;

            if (defaultRate !== undefined) systemSettings.defaultRate = defaultRate;
            if (currency !== undefined) systemSettings.currency = currency;
            if (ossEnabled !== undefined) systemSettings.ossEnabled = ossEnabled;
            if (mtdEnabled !== undefined) systemSettings.mtdEnabled = mtdEnabled;
            if (viesValidation !== undefined) systemSettings.viesValidation = viesValidation;
            if (defaultPeriod !== undefined) systemSettings.defaultPeriod = defaultPeriod;

            logger.info('税务设置已更新', { user: req.user.email });

            res.json({
                success: true,
                data: {
                    defaultRate: systemSettings.defaultRate,
                    currency: systemSettings.currency,
                    ossEnabled: systemSettings.ossEnabled,
                    mtdEnabled: systemSettings.mtdEnabled,
                    viesValidation: systemSettings.viesValidation,
                    defaultPeriod: systemSettings.defaultPeriod
                }
            });
        } catch (error) {
            logger.error('更新税务设置失败:', error);
            res.status(500).json({
                success: false,
                error: '更新税务设置失败'
            });
        }
    }
);

/**
 * GET /api/v1/settings/notifications
 * 获取通知设置
 */
router.get('/notifications',
    authenticate,
    async (req, res) => {
        try {
            const notificationSettings = {
                emailNotifications: systemSettings.emailNotifications,
                notifyOnSuccess: systemSettings.notifyOnSuccess,
                notifyOnError: systemSettings.notifyOnError,
                weeklyReport: systemSettings.weeklyReport,
                monthlyReport: systemSettings.monthlyReport
            };

            res.json({
                success: true,
                data: notificationSettings
            });
        } catch (error) {
            logger.error('获取通知设置失败:', error);
            res.status(500).json({
                success: false,
                error: '获取通知设置失败'
            });
        }
    }
);

/**
 * PUT /api/v1/settings/notifications
 * 更新通知设置
 */
router.put('/notifications',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
        try {
            const { emailNotifications, notifyOnSuccess, notifyOnError, weeklyReport, monthlyReport } = req.body;

            if (emailNotifications !== undefined) systemSettings.emailNotifications = emailNotifications;
            if (notifyOnSuccess !== undefined) systemSettings.notifyOnSuccess = notifyOnSuccess;
            if (notifyOnError !== undefined) systemSettings.notifyOnError = notifyOnError;
            if (weeklyReport !== undefined) systemSettings.weeklyReport = weeklyReport;
            if (monthlyReport !== undefined) systemSettings.monthlyReport = monthlyReport;

            logger.info('通知设置已更新', { user: req.user.email });

            res.json({
                success: true,
                data: {
                    emailNotifications: systemSettings.emailNotifications,
                    notifyOnSuccess: systemSettings.notifyOnSuccess,
                    notifyOnError: systemSettings.notifyOnError,
                    weeklyReport: systemSettings.weeklyReport,
                    monthlyReport: systemSettings.monthlyReport
                }
            });
        } catch (error) {
            logger.error('更新通知设置失败:', error);
            res.status(500).json({
                success: false,
                error: '更新通知设置失败'
            });
        }
    }
);

/**
 * POST /api/v1/settings/clear-cache
 * 清除缓存
 */
router.post('/clear-cache',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
        try {
            await cacheManager.clear();
            
            logger.info('缓存已清除', { user: req.user.email });

            res.json({
                success: true,
                message: '缓存已清除'
            });
        } catch (error) {
            logger.error('清除缓存失败:', error);
            res.status(500).json({
                success: false,
                error: '清除缓存失败'
            });
        }
    }
);

module.exports = router;