// backend/src/middleware/compression.js
const compression = require('compression');
const { logger } = require('../utils/logger');

/**
 * 自定义压缩中间件
 * 扩展默认压缩功能，增加日志和自定义过滤
 */
function customCompression() {
    return compression({
        // 压缩级别
        level: 6,

        // 阈值 (byte)
        threshold: 1024,

        // 只压缩特定类型
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }

            // 默认压缩
            return compression.filter(req, res);
        },

        // 压缩后回调
        callback: (err, result) => {
            if (err) {
                logger.error('压缩错误:', err);
            }
        }
    });
}

/**
 * 静态资源压缩中间件
 */
function staticCompression() {
    return compression({
        level: 9,
        threshold: 512,
        filter: (req, res) => {
            const type = res.getHeader('Content-Type') || '';
            const staticTypes = [
                'text/css',
                'text/javascript',
                'application/javascript',
                'application/json',
                'image/svg+xml',
                'font/',
                'application/font-'
            ];
            return staticTypes.some(t => type.includes(t));
        }
    });
}

module.exports = {
    customCompression,
    staticCompression,
    default: customCompression
};