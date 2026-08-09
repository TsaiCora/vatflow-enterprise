// backend/src/utils/helpers.js
const fs = require('fs');
const path = require('path');

/**
 * 通用助手函数
 */
class Helpers {
    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 重试函数
     */
    async retry(fn, options = {}) {
        const {
            maxAttempts = 3,
            delay = 1000,
            backoff = 2,
            onRetry = null
        } = options;

        let lastError;
        let currentDelay = delay;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (attempt === maxAttempts) break;
                
                if (onRetry) {
                    onRetry(attempt, error);
                }
                
                await this.sleep(currentDelay);
                currentDelay *= backoff;
            }
        }

        throw lastError;
    }

    /**
     * 确保目录存在
     */
    ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        return dir;
    }

    /**
     * 获取文件大小
     */
    getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch {
            return 0;
        }
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    /**
     * 安全 JSON 解析
     */
    safeJSONParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch {
            return defaultValue;
        }
    }

    /**
     * 安全 JSON 字符串化
     */
    safeJSONStringify(obj, defaultValue = '{}') {
        try {
            return JSON.stringify(obj);
        } catch {
            return defaultValue;
        }
    }

    /**
     * 深拷贝对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        const cloned = {};
        for (const key of Object.keys(obj)) {
            cloned[key] = this.deepClone(obj[key]);
        }
        return cloned;
    }

    /**
     * 对象合并（深度）
     */
    deepMerge(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (target[key] && typeof target[key] === 'object') {
                    result[key] = this.deepMerge(target[key], source[key]);
                } else {
                    result[key] = this.deepClone(source[key]);
                }
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    /**
     * 对象路径获取
     */
    getPath(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[key];
        }
        return current !== undefined ? current : defaultValue;
    }

    /**
     * 对象路径设置
     */
    setPath(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
        return obj;
    }

    /**
     * 数组分块
     */
    chunkArray(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * 数组去重
     */
    uniqueArray(arr, key = null) {
        if (!key) {
            return [...new Set(arr)];
        }
        const seen = new Set();
        return arr.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }

    /**
     * 数组分组
     */
    groupArray(arr, key) {
        return arr.reduce((groups, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    }

    /**
     * 排序数组
     */
    sortArray(arr, key, order = 'asc') {
        const sorted = [...arr];
        sorted.sort((a, b) => {
            const aVal = typeof key === 'function' ? key(a) : a[key];
            const bVal = typeof key === 'function' ? key(b) : b[key];
            if (aVal === bVal) return 0;
            if (order === 'asc') {
                return aVal < bVal ? -1 : 1;
            } else {
                return aVal > bVal ? -1 : 1;
            }
        });
        return sorted;
    }

    /**
     * 获取对象键值（支持嵌套）
     */
    getNestedValue(obj, path) {
        return this.getPath(obj, path);
    }

    /**
     * 设置对象键值（支持嵌套）
     */
    setNestedValue(obj, path, value) {
        return this.setPath(obj, path, value);
    }

    /**
     * 是否为对象
     */
    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * 是否为空对象
     */
    isEmptyObject(obj) {
        return this.isObject(obj) && Object.keys(obj).length === 0;
    }

    /**
     * 是否为 Promise
     */
    isPromise(value) {
        return value && typeof value.then === 'function' && typeof value.catch === 'function';
    }

    /**
     * 获取当前时间戳
     */
    now() {
        return Date.now();
    }

    /**
     * 获取当前 ISO 时间
     */
    nowISO() {
        return new Date().toISOString();
    }

    /**
     * 检查是否在开发环境
     */
    isDev() {
        return process.env.NODE_ENV === 'development';
    }

    /**
     * 检查是否在生产环境
     */
    isProd() {
        return process.env.NODE_ENV === 'production';
    }

    /**
     * 检查是否在测试环境
     */
    isTest() {
        return process.env.NODE_ENV === 'test';
    }
}

module.exports = new Helpers();