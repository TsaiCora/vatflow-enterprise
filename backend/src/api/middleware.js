// backend/src/api/middleware.js
const { logger } = require('../utils/logger');
const { metrics } = require('../utils/metrics');

function requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        logger[logLevel](`${req.method} ${req.originalUrl}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            user: req.user?.email || 'anonymous',
            requestId: req.id
        });
        metrics.recordHttpRequest(req.method, req.route?.path || req.path, res.statusCode, duration / 1000);
    });

    next();
}

function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.query, { abortEarly: false });
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: '查询参数验证失败',
                    details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
                });
            }
            req.validatedQuery = value;
            next();
        } catch (error) {
            logger.error('查询验证错误:', error);
            res.status(500).json({ success: false, error: '查询验证服务异常' });
        }
    };
}

function validateBody(schema) {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.body, { abortEarly: false });
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: '请求体验证失败',
                    details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
                });
            }
            req.validatedBody = value;
            next();
        } catch (error) {
            logger.error('请求体验证错误:', error);
            res.status(500).json({ success: false, error: '请求体验证服务异常' });
        }
    };
}

function validateParams(schema) {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.params, { abortEarly: false });
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: '参数验证失败',
                    details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
                });
            }
            req.validatedParams = value;
            next();
        } catch (error) {
            logger.error('参数验证错误:', error);
            res.status(500).json({ success: false, error: '参数验证服务异常' });
        }
    };
}

function formatResponse(req, res, next) {
    const originalJson = res.json;
    res.json = function(data) {
        if (data && typeof data === 'object') {
            if (data.success !== undefined && data.data !== undefined) {
                return originalJson.call(this, data);
            }
        }
        return originalJson.call(this, {
            success: true,
            data: data,
            timestamp: new Date().toISOString(),
            requestId: req.id
        });
    };
    next();
}

module.exports = {
    requestLogger,
    validateQuery,
    validateBody,
    validateParams,
    formatResponse
};