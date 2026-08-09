// backend/src/config/index.js
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 导入配置
const database = require('./database');
const redis = require('./redis');
const countryRates = require('./country-rates.json');
const platforms = require('./platforms.json');
const tenants = require('./tenants.json');

/**
 * 应用配置
 */
const app = {
    name: process.env.APP_NAME || 'VATFlow',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.APP_PORT) || 3000,
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost']
};

/**
 * JWT 配置
 */
const jwt = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
};

/**
 * 文件上传配置
 */
const upload = {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['.csv', '.xlsx', '.xls', '.json', '.txt', '.zip'],
    maxFiles: 20
};

/**
 * 日志配置
 */
const logging = {
    level: process.env.LOG_LEVEL || 'info',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
    maxSize: process.env.LOG_MAX_SIZE || '20m'
};

/**
 * 限流配置
 */
const rateLimit = {
    global: parseInt(process.env.RATE_LIMIT_GLOBAL) || 1000,
    tenant: parseInt(process.env.RATE_LIMIT_TENANT) || 100,
    upload: parseInt(process.env.RATE_LIMIT_UPLOAD) || 10,
    report: parseInt(process.env.RATE_LIMIT_REPORT) || 20
};

/**
 * 缓存配置
 */
const cache = {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL) || 3600
};

/**
 * Worker 配置
 */
const worker = {
    enabled: process.env.WORKER_ENABLED !== 'false',
    concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5,
    maxRetry: parseInt(process.env.WORKER_MAX_RETRY) || 3,
    retryDelay: parseInt(process.env.WORKER_RETRY_DELAY) || 5000,
    processInterval: parseInt(process.env.WORKER_PROCESS_INTERVAL) || 1000
};

/**
 * 邮件配置
 */
const email = {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || `VATFlow系统 <${process.env.SMTP_USER}>`
};

/**
 * 外部API配置
 */
const external = {
    vatflow: {
        apiKey: process.env.VATFLOW_API_KEY,
        baseUrl: process.env.VATFLOW_API_URL || 'https://vatflow.p.rapidapi.com'
    },
    hmrc: {
        baseUrl: process.env.HMRC_MTD_API_URL || 'https://api.service.hmrc.gov.uk',
        clientId: process.env.HMRC_MTD_CLIENT_ID,
        clientSecret: process.env.HMRC_MTD_CLIENT_SECRET
    }
};

/**
 * 备份配置
 */
const backup = {
    dir: process.env.BACKUP_DIR || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    emailOnSuccess: process.env.EMAIL_ON_BACKUP === 'true'
};

module.exports = {
    app,
    database,
    redis,
    jwt,
    upload,
    logging,
    rateLimit,
    cache,
    worker,
    email,
    external,
    backup,
    countryRates,
    platforms,
    tenants
};