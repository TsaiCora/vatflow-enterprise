// backend/src/core/rateLimiter.js
const { getCacheClient } = require('../config/redis');
const { logger } = require('../utils/logger');

/**
 * 限流器
 */
class RateLimiter {
    constructor() {
        this.client = null;
        this.initialized = false;
        this.init();

        // 限流配置
        this.limits = {
            global: {
                window: 60000,
                max: parseInt(process.env.RATE_LIMIT_GLOBAL) || 1000
            },
            tenant: {
                window: 60000,
                max: parseInt(process.env.RATE_LIMIT_TENANT) || 100
            },
            upload: {
                window: 60000,
                max: parseInt(process.env.RATE_LIMIT_UPLOAD) || 10
            },
            report: {
                window: 60000,
                max: parseInt(process.env.RATE_LIMIT_REPORT) || 20
            },
            auth: {
                window: 60000,
                max: 10
            }
        };
    }

    /**
     * 初始化
     */
    async init() {
        try {
            this.client = getCacheClient();
            this.initialized = true;
        } catch (error) {
            logger.error('❌ 限流器初始化失败:', error.message);
        }
    }

    /**
     * 检查是否允许请求
     */
    async checkLimit(key, type = 'global') {
        if (!this.initialized || !this.client) {
            return {
                allowed: true,
                current: 1,
                max: 1,
                remaining: 0,
                resetTime: 0,
                window: 60000
            };
        }

        const limit = this.limits[type];
        if (!limit) {
            throw new Error(`未知的限流类型: ${type}`);
        }

        const redisKey = `rate:${type}:${key}`;
        const current = await this.client.incr(redisKey);

        if (current === 1) {
            await this.client.expire(redisKey, limit.window / 1000);
        }

        const allowed = current <= limit.max;
        const remaining = Math.max(0, limit.max - current);
        const resetTime = await this.client.ttl(redisKey);

        return {
            allowed,
            current,
            max: limit.max,
            remaining,
            resetTime,
            window: limit.window
        };
    }

    /**
     * 中间件：API限流
     */
    middleware(type = 'global') {
        return async (req, res, next) => {
            const key = req.tenant?.tenantId || req.ip || 'anonymous';

            try {
                const result = await this.checkLimit(key, type);

                res.setHeader('X-RateLimit-Limit', result.max);
                res.setHeader('X-RateLimit-Remaining', result.remaining);
                res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + result.resetTime));

                if (!result.allowed) {
                    return res.status(429).json({
                        success: false,
                        error: '请求过于频繁，请稍后再试',
                        retryAfter: result.resetTime
                    });
                }

                next();
            } catch (error) {
                logger.error('限流检查失败:', error);
                next();
            }
        };
    }

    /**
     * 重置限流
     */
    async resetLimit(key, type = 'global') {
        if (!this.initialized || !this.client) {
            return false;
        }

        try {
            const redisKey = `rate:${type}:${key}`;
            await this.client.del(redisKey);
            logger.info(`限流已重置: ${type}:${key}`);
            return true;
        } catch (error) {
            logger.error(`重置限流失败: ${type}:${key}`, error);
            return false;
        }
    }

    /**
     * 获取限流统计
     */
    async getStats(key, type = 'global') {
        if (!this.initialized || !this.client) {
            return null;
        }

        try {
            const redisKey = `rate:${type}:${key}`;
            const current = await this.client.get(redisKey);
            const ttl = await this.client.ttl(redisKey);
            const limit = this.limits[type];

            return {
                key,
                type,
                current: parseInt(current) || 0,
                max: limit?.max || 0,
                remaining: Math.max(0, (limit?.max || 0) - (parseInt(current) || 0)),
                resetTime: ttl,
                window: limit?.window || 60000
            };
        } catch (error) {
            logger.error(`获取限流统计失败: ${type}:${key}`, error);
            return null;
        }
    }

    /**
     * 获取所有限流配置
     */
    getLimits() {
        return this.limits;
    }
}

// 导出单例
module.exports = new RateLimiter();