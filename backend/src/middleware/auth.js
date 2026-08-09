// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const tenantManager = require('../core/tenantManager');

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization token
 */
async function authenticate(req, res, next) {
    try {
        // 获取 Authorization 头
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: '未提供认证令牌'
            });
        }

        // 解析 Bearer token
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                error: '认证令牌格式错误，请使用 Bearer 格式'
            });
        }

        const token = parts[1];

        // 验证 token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: '认证令牌已过期，请重新登录'
                });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: '无效的认证令牌'
                });
            }
            throw error;
        }

        // 获取租户信息
        const tenant = await tenantManager.getTenant(decoded.tenantId);
        if (!tenant) {
            return res.status(401).json({
                success: false,
                error: '用户不存在'
            });
        }

        // 检查租户状态
        if (tenant.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: '账号已被停用，请联系管理员'
            });
        }

        // 将用户信息挂载到请求对象
        req.user = {
            tenantId: tenant.tenantId,
            name: tenant.name,
            email: tenant.email,
            role: tenant.role,
            company: tenant.company,
            country: tenant.country
        };
        req.tenant = tenant;

        // 记录审计日志
        req.userInfo = {
            tenantId: tenant.tenantId,
            email: tenant.email,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };

        next();

    } catch (error) {
        logger.error('认证中间件错误:', error);
        return res.status(500).json({
            success: false,
            error: '认证服务异常，请稍后重试'
        });
    }
}

/**
 * 可选认证中间件
 * 如果提供了 token 则验证，否则继续
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next();
        }

        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            const token = parts[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const tenant = await tenantManager.getTenant(decoded.tenantId);
            if (tenant && tenant.status === 'active') {
                req.user = {
                    tenantId: tenant.tenantId,
                    name: tenant.name,
                    email: tenant.email,
                    role: tenant.role
                };
                req.tenant = tenant;
            }
        }

        next();

    } catch (error) {
        // 可选认证失败不阻断请求
        next();
    }
}

/**
 * API Key 认证中间件
 * 用于内部服务调用
 */
async function apiKeyAuth(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: '未提供 API Key'
            });
        }

        const tenant = await tenantManager.validateApiKey(apiKey);
        if (!tenant) {
            return res.status(401).json({
                success: false,
                error: '无效的 API Key'
            });
        }

        req.user = {
            tenantId: tenant.tenantId,
            name: tenant.name,
            email: tenant.email,
            role: tenant.role
        };
        req.tenant = tenant;

        next();

    } catch (error) {
        logger.error('API Key 认证错误:', error);
        return res.status(500).json({
            success: false,
            error: '认证服务异常，请稍后重试'
        });
    }
}

/**
 * 生成 JWT Token
 */
function generateToken(tenantId, email, role) {
    return jwt.sign(
        { tenantId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

/**
 * 生成刷新 Token
 */
function generateRefreshToken(tenantId, email, role) {
    return jwt.sign(
        { tenantId, email, role, refresh: true },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
}

/**
 * 验证刷新 Token
 */
async function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.refresh) {
            throw new Error('无效的刷新令牌');
        }
        const tenant = await tenantManager.getTenant(decoded.tenantId);
        if (!tenant || tenant.status !== 'active') {
            throw new Error('用户不存在或已停用');
        }
        return {
            tenantId: tenant.tenantId,
            email: tenant.email,
            role: tenant.role
        };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    authenticate,
    optionalAuth,
    apiKeyAuth,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken
};