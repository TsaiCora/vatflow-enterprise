// backend/src/api/v1/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const tenantRoutes = require('./tenants');
const fileRoutes = require('./files');
const reportRoutes = require('./reports');
const transactionRoutes = require('./transactions');
const dashboardRoutes = require('./dashboard');
const settingsRoutes = require('./settings');
const webhookRoutes = require('./webhooks');

// 注册路由
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/files', fileRoutes);
router.use('/reports', reportRoutes);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/webhooks', webhookRoutes);

module.exports = router;