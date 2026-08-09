// backend/src/core/cacheManager.js
const { getCacheClient } = require('../config/redis');
const { logger } = require('../utils/logger');

/**
 * 缓存管理器
 */
class CacheManager {
    constructor() {
        this.client = null;
        this.defaultTTL = parseInt(process.env.CACHE_TTL) || 3600;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.initialized = false;
        this.init();
    }

    /**
     * 初始化缓存客户端
     */
    async init() {
        try {
            this.client = getCacheClient();
            this.initialized = true;
            logger.info('✅ 缓存管理器初始化成功');
        } catch (error) {
            logger.error('❌ 缓存管理器初始化失败:', error.message);
            // 不抛出异常，允许降级运行
        }
    }

    /**
     * 获取缓存
     */
    async get(key, strategy = 'default') {
        if (!this.initialized || !this.client) {
            return null;
        }

        try {
            const prefixedKey = this.getKey(key, strategy);
            const value = await this.client.get(prefixedKey);

            if (value) {
                this.cacheHits++;
                return JSON.parse(value);
            }

            this.cacheMisses++;
            return null;

        } catch (error) {
            logger.error(`缓存获取失败: ${key}`, error);
            return null;
        }
    }

    /**
     * 设置缓存
     */
    async set(key, value, strategy = 'default', ttl = null) {
        if (!this.initialized || !this.client) {
            return false;
        }

        try {
            const prefixedKey = this.getKey(key, strategy);
            const ttlValue = ttl || this.defaultTTL;

            await this.client.setex(
                prefixedKey,
                ttlValue,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {
            logger.error(`缓存设置失败: ${key}`, error);
            return false;
        }
    }

    /**
     * 删除缓存
     */
    async delete(key, strategy = 'default') {
        if (!this.initialized || !this.client) {
            return false;
        }

        try {
            const prefixedKey = this.getKey(key, strategy);
            await this.client.del(prefixedKey);
            return true;
        } catch (error) {
            logger.error(`缓存删除失败: ${key}`, error);
            return false;
        }
    }

    /**
     * 批量删除缓存
     */
    async deletePattern(pattern) {
        if (!this.initialized || !this.client) {
            return 0;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
                logger.info(`批量删除缓存: ${keys.length} 个`);
            }
            return keys.length;
        } catch (error) {
            logger.error(`批量删除缓存失败: ${pattern}`, error);
            return 0;
        }
    }

    /**
     * 获取或设置缓存
     */
    async remember(key, fn, strategy = 'default', ttl = null) {
        const cached = await this.get(key, strategy);
        if (cached !== null) {
            return cached;
        }

        const value = await fn();
        await this.set(key, value, strategy, ttl);
        return value;
    }

    /**
     * 获取缓存Key
     */
    getKey(key, strategy) {
        const prefixes = {
            tenant: 'tenant',
            rates: 'rates',
            platform: 'platform',
            report: 'report',
            dashboard: 'dashboard',
            default: 'default'
        };
        const prefix = prefixes[strategy] || 'default';
        return `${prefix}:${key}`;
    }

    /**
     * 清空所有缓存
     */
    async clear() {
        if (!this.initialized || !this.client) {
            return false;
        }

        try {
            await this.client.flushdb();
            this.cacheHits = 0;
            this.cacheMisses = 0;
            logger.info('🧹 缓存已全部清空');
            return true;
        } catch (error) {
            logger.error('清空缓存失败', error);
            return false;
        }
    }

    /**
     * 获取缓存统计
     */
    getStats() {
        const total = this.cacheHits + this.cacheMisses;
        return {
            hits: this.cacheHits,
            misses: this.cacheMisses,
            total: total,
            hitRate: total > 0 ? (this.cacheHits / total) * 100 : 0
        };
    }

    /**
     * 检查缓存是否可用
     */
    isAvailable() {
        return this.initialized && !!this.client;
    }

    /**
     * 关闭缓存连接
     */
    async close() {
        if (this.client) {
            try {
                await this.client.quit();
                logger.info('缓存连接已关闭');
            } catch (error) {
                logger.error('关闭缓存连接失败', error);
            }
        }
    }
}

// 导出单例
module.exports = new CacheManager();