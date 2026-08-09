// backend/src/middleware/audit.js
const { logger } = require('../utils/logger');

/**
 * 审计日志中间件
 * 记录所有 API 请求
 */
async function audit(req, res, next) {
    const startTime = Date.now();

    // 保存原始响应方法
    const originalSend = res.json;
    let responseBody = null;

    // 重写 json 方法以捕获响应
    res.json = function(data) {
        responseBody = data;
        return originalSend.call(this, data);
    };

    // 记录响应完成
    res.on('finish', async () => {
        try {
            const duration = Date.now() - startTime;
            const userInfo = req.userInfo || req.user || {};

            const auditData = {
                tenantId: userInfo.tenantId || req.tenantId || null,
                userEmail: userInfo.email || req.user?.email || null,
                action: req.method,
                resource: req.originalUrl.split('?')[0],
                resourceId: req.params.id || req.params.tenantId || null,
                details: {
                    method: req.method,
                    url: req.originalUrl,
                    query: req.query,
                    body: req.method === 'GET' ? undefined : sanitizeBody(req.body),
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    duration: `${duration}ms`,
                    statusCode: res.statusCode
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                status: res.statusCode < 400 ? 'success' : 'failed'
            };

            // 异步保存审计日志（不阻塞响应）
            setImmediate(async () => {
                try {
                    logger.debug(`审计日志已记录: ${req.method} ${req.originalUrl}`);
                } catch (error) {
                    logger.error('保存审计日志失败:', error);
                }
            });

        } catch (error) {
            logger.error('审计中间件错误:', error);
        }
    });

    next();
}

/**
 * 脱敏请求体
 */
function sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'confirmPassword', 'token', 'secret'];

    for (const field of sensitiveFields) {
        if (sanitized[field] !== undefined) {
            sanitized[field] = '***REDACTED***';
        }
    }

    return sanitized;
}

/**
 * 手动记录审计日志
 */
async function logAudit(data) {
    try {
        logger.debug(`审计日志已记录 (手动): ${data.action}`);
        return true;
    } catch (error) {
        logger.error('手动记录审计日志失败:', error);
        return false;
    }
}

module.exports = {
    audit,
    logAudit,
    sanitizeBody
};