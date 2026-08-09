// backend/src/middleware/errorHandler.js
const { logger } = require('../utils/logger');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
    // 记录错误
    logger.error('❌ 错误:', {
        message: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.email || 'anonymous'
    });

    // 确定状态码
    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || '服务器内部错误';
    let code = err.code || 'INTERNAL_ERROR';

    // 处理特定错误类型
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = '请求参数验证失败';
        if (err.details) {
            return res.status(400).json({
                success: false,
                error: message,
                code,
                details: err.details
            });
        }
    }

    if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        code = 'DB_VALIDATION_ERROR';
        message = '数据验证失败';
        const errors = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));
        return res.status(400).json({
            success: false,
            error: message,
            code,
            errors
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        code = 'DUPLICATE_ERROR';
        message = '数据已存在，请勿重复提交';
        const errors = err.errors.map(e => ({
            field: e.path,
            message: `${e.path} 已存在`
        }));
        return res.status(409).json({
            success: false,
            error: message,
            code,
            errors
        });
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'AUTH_ERROR';
        message = err.name === 'TokenExpiredError' ? '认证令牌已过期' : '无效的认证令牌';
    }

    if (err.name === 'MulterError') {
        statusCode = 400;
        code = 'UPLOAD_ERROR';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = '文件大小超过限制';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = '文件数量超过限制';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = '不支持的文件类型';
        } else {
            message = '文件上传失败';
        }
    }

    // 返回错误响应
    res.status(statusCode).json({
        success: false,
        error: message,
        code,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
}

/**
 * 自定义错误类
 */
class AppError extends Error {
    constructor(message, status = 500, code = 'APP_ERROR') {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.code = code;
        Error.captureStackTrace(this, AppError);
    }
}

class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(resource = '资源') {
        super(`${resource}不存在`, 404, 'NOT_FOUND');
    }
}

class UnauthorizedError extends AppError {
    constructor(message = '未认证，请先登录') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

class ForbiddenError extends AppError {
    constructor(message = '权限不足，无法执行此操作') {
        super(message, 403, 'FORBIDDEN');
    }
}

class ConflictError extends AppError {
    constructor(message = '数据冲突，请检查后重试') {
        super(message, 409, 'CONFLICT');
    }
}

class RateLimitError extends AppError {
    constructor(message = '请求过于频繁，请稍后再试') {
        super(message, 429, 'RATE_LIMIT');
    }
}

module.exports = {
    errorHandler,
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    RateLimitError
};