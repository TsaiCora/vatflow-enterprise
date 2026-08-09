// backend/src/config/redis.js
const Redis = require('ioredis');
require('dotenv').config();

/**
 * Redis 配置
 */
const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    cacheDb: parseInt(process.env.REDIS_CACHE_DB) || 1,
    queueDb: parseInt(process.env.REDIS_QUEUE_DB) || 2,
    keyPrefix: 'vatflow:',
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false
};

/**
 * 创建 Redis 实例
 */
let redisClient = null;
let cacheClient = null;
let queueClient = null;

function createRedisClient(db = 0) {
    return new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: db,
        keyPrefix: config.keyPrefix,
        retryStrategy: config.retryStrategy,
        maxRetriesPerRequest: config.maxRetriesPerRequest,
        enableReadyCheck: config.enableReadyCheck,
        lazyConnect: config.lazyConnect
    });
}

/**
 * 初始化 Redis 连接
 */
async function initRedis() {
    try {
        // 主 Redis 客户端
        redisClient = createRedisClient(config.db);
        await redisClient.ping();
        console.log('✅ Redis 主连接成功');

        // 缓存客户端
        cacheClient = createRedisClient(config.cacheDb);
        await cacheClient.ping();
        console.log('✅ Redis 缓存连接成功');

        // 队列客户端
        queueClient = createRedisClient(config.queueDb);
        await queueClient.ping();
        console.log('✅ Redis 队列连接成功');

        // 设置事件监听
        redisClient.on('error', (err) => {
            console.error('❌ Redis 错误:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('📡 Redis 已连接');
        });

        redisClient.on('close', () => {
            console.log('📡 Redis 连接已关闭');
        });

        return { redisClient, cacheClient, queueClient };

    } catch (error) {
        console.error('❌ Redis 连接失败:', error.message);
        throw error;
    }
}

/**
 * 获取 Redis 客户端
 */
function getRedisClient() {
    if (!redisClient) {
        throw new Error('Redis 未初始化');
    }
    return redisClient;
}

/**
 * 获取缓存 Redis 客户端
 */
function getCacheClient() {
    if (!cacheClient) {
        throw new Error('Redis 缓存未初始化');
    }
    return cacheClient;
}

/**
 * 获取队列 Redis 客户端
 */
function getQueueClient() {
    if (!queueClient) {
        throw new Error('Redis 队列未初始化');
    }
    return queueClient;
}

/**
 * 关闭 Redis 连接
 */
async function closeRedis() {
    const clients = [redisClient, cacheClient, queueClient];
    for (const client of clients) {
        if (client) {
            try {
                await client.quit();
            } catch (error) {
                console.error('❌ 关闭 Redis 连接失败:', error.message);
            }
        }
    }
    console.log('✅ Redis 连接已关闭');
}

module.exports = {
    config,
    initRedis,
    getRedisClient,
    getCacheClient,
    getQueueClient,
    closeRedis,
    redisClient,
    cacheClient,
    queueClient
};