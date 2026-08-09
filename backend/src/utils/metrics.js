// backend/src/utils/metrics.js
const prometheus = require('prom-client');

/**
 * 监控指标类
 */
class Metrics {
    constructor() {
        this.registry = new prometheus.Registry();
        this.initialized = false;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.init();
    }

    /**
     * 初始化指标
     */
    init() {
        if (this.initialized) return;

        // 启用默认指标
        prometheus.collectDefaultMetrics({
            register: this.registry,
            prefix: 'vatflow_'
        });

        // HTTP 请求计数器
        this.httpRequests = new prometheus.Counter({
            name: 'http_requests_total',
            help: 'Total HTTP requests',
            labelNames: ['method', 'route', 'status'],
            registers: [this.registry]
        });

        // HTTP 请求延迟
        this.httpDuration = new prometheus.Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'route'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registers: [this.registry]
        });

        // 文件处理计数
        this.filesProcessed = new prometheus.Counter({
            name: 'files_processed_total',
            help: 'Total files processed',
            labelNames: ['platform', 'tenant'],
            registers: [this.registry]
        });

        // 交易处理计数
        this.transactionsProcessed = new prometheus.Counter({
            name: 'transactions_processed_total',
            help: 'Total transactions processed',
            labelNames: ['tenant', 'country'],
            registers: [this.registry]
        });

        // VAT总额
        this.vatTotal = new prometheus.Gauge({
            name: 'vat_total_amount',
            help: 'Total VAT amount',
            labelNames: ['tenant', 'period'],
            registers: [this.registry]
        });

        // 队列大小
        this.queueSize = new prometheus.Gauge({
            name: 'queue_size',
            help: 'Queue size by status',
            labelNames: ['queue', 'status'],
            registers: [this.registry]
        });

        // 活跃客户数
        this.activeTenants = new prometheus.Gauge({
            name: 'active_tenants',
            help: 'Number of active tenants',
            registers: [this.registry]
        });

        // 缓存命中率
        this.cacheHitRate = new prometheus.Gauge({
            name: 'cache_hit_rate',
            help: 'Cache hit rate',
            registers: [this.registry]
        });

        // 错误计数
        this.errors = new prometheus.Counter({
            name: 'errors_total',
            help: 'Total errors',
            labelNames: ['type', 'source'],
            registers: [this.registry]
        });

        // 数据库连接数
        this.dbConnections = new prometheus.Gauge({
            name: 'db_connections',
            help: 'Database connections',
            labels: ['pool'],
            registers: [this.registry]
        });

        // Redis连接数
        this.redisConnections = new prometheus.Gauge({
            name: 'redis_connections',
            help: 'Redis connections',
            labels: ['client'],
            registers: [this.registry]
        });

        this.initialized = true;
    }

    /**
     * 记录 HTTP 请求
     */
    recordHttpRequest(method, route, status, duration) {
        this.httpRequests.inc({ method, route, status });
        this.httpDuration.observe({ method, route }, duration);
    }

    /**
     * 记录文件处理
     */
    recordFileProcessed(platform, tenant) {
        this.filesProcessed.inc({ platform, tenant });
    }

    /**
     * 记录交易处理
     */
    recordTransactionProcessed(tenant, country) {
        this.transactionsProcessed.inc({ tenant, country });
    }

    /**
     * 设置VAT总额
     */
    setVATTotal(tenant, period, amount) {
        this.vatTotal.set({ tenant, period }, amount);
    }

    /**
     * 设置队列大小
     */
    setQueueSize(queue, status, size) {
        this.queueSize.set({ queue, status }, size);
    }

    /**
     * 设置活跃客户数
     */
    setActiveTenants(count) {
        this.activeTenants.set(count);
    }

    /**
     * 缓存命中
     */
    cacheHit() {
        this.cacheHits++;
        this.updateCacheHitRate();
    }

    /**
     * 缓存未命中
     */
    cacheMiss() {
        this.cacheMisses++;
        this.updateCacheHitRate();
    }

    /**
     * 更新缓存命中率
     */
    updateCacheHitRate() {
        const total = this.cacheHits + this.cacheMisses;
        const rate = total > 0 ? (this.cacheHits / total) * 100 : 0;
        this.cacheHitRate.set(rate);
    }

    /**
     * 记录错误
     */
    recordError(type, source) {
        this.errors.inc({ type, source });
    }

    /**
     * 获取所有指标
     */
    async getMetrics() {
        return await this.registry.metrics();
    }

    /**
     * 获取指标统计
     */
    getStats() {
        return {
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            cacheHitRate: this.cacheHits + this.cacheMisses > 0 
                ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100 
                : 0
        };
    }

    /**
     * 重置指标
     */
    reset() {
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.registry.clear();
        this.init();
    }
}

module.exports = new Metrics();