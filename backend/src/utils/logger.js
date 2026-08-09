// backend/src/utils/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 日志级别
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// 日志级别颜色
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
};

winston.addColors(colors);

// 日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({
        fillExcept: ['timestamp', 'level', 'message']
    }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, metadata, ...rest }) => {
        const meta = { ...metadata, ...rest };
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}] ${message}${metaStr}`;
    })
);

// 控制台格式（开发环境）
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, metadata, ...rest }) => {
        const meta = { ...metadata, ...rest };
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}] ${message}${metaStr}`;
    })
);

// 创建 Logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format: logFormat,
    transports: [
        // 所有日志
        new DailyRotateFile({
            filename: path.join('logs', 'application-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: process.env.LOG_MAX_SIZE || '20m',
            maxFiles: `${process.env.LOG_RETENTION_DAYS || 30}d`,
            format: logFormat
        }),
        // 错误日志
        new DailyRotateFile({
            filename: path.join('logs', 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: process.env.LOG_MAX_SIZE || '20m',
            maxFiles: `${process.env.LOG_RETENTION_DAYS || 30}d`,
            level: 'error',
            format: logFormat
        }),
        // 控制台（开发环境）
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
        })
    ],
    // 异常处理
    exceptionHandlers: [
        new DailyRotateFile({
            filename: path.join('logs', 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            format: logFormat
        }),
        new winston.transports.Console({
            format: consoleFormat
        })
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            filename: path.join('logs', 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            format: logFormat
        }),
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});

/**
 * 创建带上下文的日志器
 */
function createLogger(context) {
    return {
        error: (message, meta = {}) => logger.error(message, { ...meta, context }),
        warn: (message, meta = {}) => logger.warn(message, { ...meta, context }),
        info: (message, meta = {}) => logger.info(message, { ...meta, context }),
        http: (message, meta = {}) => logger.http(message, { ...meta, context }),
        debug: (message, meta = {}) => logger.debug(message, { ...meta, context }),
        log: (level, message, meta = {}) => logger.log(level, message, { ...meta, context })
    };
}

/**
 * 获取日志统计
 */
function getLogStats() {
    // 实际实现需要读取日志文件
    return {
        levels: levels,
        currentLevel: logger.level,
        transports: logger.transports.map(t => ({
            name: t.name,
            level: t.level
        }))
    };
}

module.exports = {
    logger,
    createLogger,
    getLogStats
};