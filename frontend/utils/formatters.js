// frontend/src/utils/formatters.js

/**
 * 格式化货币
 * @param {number} value - 金额
 * @param {string} currency - 货币代码 (EUR, GBP, USD)
 * @param {string} locale - 地区代码
 * @returns {string} 格式化后的货币字符串
 */
export const formatCurrency = (value, currency = 'EUR', locale = 'en-EU') => {
    if (value === null || value === undefined || isNaN(value)) {
        return '€0.00';
    }
    
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    } catch {
        // 降级处理
        const symbols = { EUR: '€', GBP: '£', USD: '$' };
        const symbol = symbols[currency] || '€';
        return `${symbol}${Number(value).toFixed(2)}`;
    }
};

/**
 * 格式化数字
 * @param {number} value - 数字
 * @param {number} decimals - 小数位数
 * @param {string} locale - 地区代码
 * @returns {string} 格式化后的数字字符串
 */
export const formatNumber = (value, decimals = 0, locale = 'en-EU') => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }
    
    try {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    } catch {
        return Number(value).toFixed(decimals);
    }
};

/**
 * 格式化百分比
 * @param {number} value - 百分比值 (0-100)
 * @param {number} decimals - 小数位数
 * @param {string} locale - 地区代码
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercent = (value, decimals = 1, locale = 'en-EU') => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }
    
    try {
        return new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value / 100);
    } catch {
        return `${Number(value).toFixed(decimals)}%`;
    }
};

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} format - 格式 (date, datetime, time, relative)
 * @param {string} locale - 地区代码
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, format = 'date', locale = 'zh-CN') => {
    if (!date) return '-';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    try {
        const options = {
            date: { year: 'numeric', month: '2-digit', day: '2-digit' },
            datetime: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
            time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
            full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
        };

        if (format === 'relative') {
            return formatRelativeTime(d);
        }

        return new Intl.DateTimeFormat(locale, options[format] || options.date).format(d);
    } catch {
        return d.toLocaleDateString();
    }
};

/**
 * 格式化相对时间
 * @param {Date} date - 日期
 * @param {string} locale - 地区代码
 * @returns {string} 相对时间字符串
 */
export const formatRelativeTime = (date, locale = 'zh-CN') => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    if (months < 12) return `${months}个月前`;
    return `${years}年前`;
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 B';
    if (!bytes || isNaN(bytes)) return '-';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    
    return `${value.toFixed(decimals)} ${sizes[i]}`;
};

/**
 * 格式化电话号码
 * @param {string} phone - 电话号码
 * @param {string} countryCode - 国家代码
 * @returns {string} 格式化后的电话号码
 */
export const formatPhone = (phone, countryCode = 'CN') => {
    if (!phone) return '-';
    
    const cleaned = phone.replace(/\D/g, '');
    const countryCodes = {
        CN: '+86',
        GB: '+44',
        US: '+1',
        FR: '+33',
        DE: '+49'
    };
    
    const prefix = countryCodes[countryCode] || '';
    return `${prefix} ${cleaned}`;
};

/**
 * 格式化地址
 * @param {Object} address - 地址对象
 * @returns {string} 格式化后的地址
 */
export const formatAddress = (address) => {
    if (!address) return '-';
    
    const parts = [
        address.street,
        address.city,
        address.state,
        address.postalCode,
        address.country
    ].filter(Boolean);
    
    return parts.join(', ');
};

/**
 * 截断文本
 * @param {string} text - 原始文本
 * @param {number} length - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, length = 50, suffix = '...') => {
    if (!text) return '-';
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
};

/**
 * 格式化VAT号码
 * @param {string} vatNumber - VAT号码
 * @returns {string} 格式化后的VAT号码
 */
export const formatVAT = (vatNumber) => {
    if (!vatNumber) return '-';
    return vatNumber.toUpperCase().replace(/\s/g, '');
};

/**
 * 格式化时间戳
 * @param {number} timestamp - 时间戳（毫秒）
 * @param {string} format - 格式
 * @returns {string} 格式化后的时间
 */
export const formatTimestamp = (timestamp, format = 'datetime') => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '-';
    return formatDate(date, format);
};

/**
 * 格式化订单号
 * @param {string} orderId - 订单号
 * @param {string} prefix - 前缀
 * @returns {string} 格式化后的订单号
 */
export const formatOrderId = (orderId, prefix = 'ORD') => {
    if (!orderId) return '-';
    return `${prefix}-${String(orderId).padStart(6, '0')}`;
};

/**
 * 格式化税号
 * @param {string} taxId - 税号
 * @param {string} country - 国家代码
 * @returns {string} 格式化后的税号
 */
export const formatTaxId = (taxId, country) => {
    if (!taxId) return '-';
    const cleaned = taxId.replace(/[^A-Z0-9]/g, '').toUpperCase();
    return cleaned;
};

/**
 * 格式化时长
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长
 */
export const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
};

/**
 * 格式化率（如税率）
 * @param {number} rate - 比率 (0-1)
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的比率
 */
export const formatRate = (rate, decimals = 1) => {
    if (rate === null || rate === undefined || isNaN(rate)) {
        return '0%';
    }
    return `${(rate * 100).toFixed(decimals)}%`;
};

/**
 * 格式化JSON
 * @param {Object} obj - JSON对象
 * @param {number} space - 缩进空格数
 * @returns {string} 格式化后的JSON字符串
 */
export const formatJSON = (obj, space = 2) => {
    try {
        return JSON.stringify(obj, null, space);
    } catch {
        return 'Invalid JSON';
    }
};

/**
 * 格式化列表
 * @param {Array} items - 列表项
 * @param {string} separator - 分隔符
 * @param {string} lastSeparator - 最后一项分隔符
 * @returns {string} 格式化后的列表
 */
export const formatList = (items, separator = ', ', lastSeparator = ' & ') => {
    if (!items || items.length === 0) return '';
    if (items.length === 1) return String(items[0]);
    if (items.length === 2) return items.join(lastSeparator);
    
    const last = items.pop();
    return items.join(separator) + lastSeparator + last;
};

// 导出常用格式化函数
export default {
    formatCurrency,
    formatNumber,
    formatPercent,
    formatDate,
    formatRelativeTime,
    formatFileSize,
    formatPhone,
    formatAddress,
    truncateText,
    formatVAT,
    formatTimestamp,
    formatOrderId,
    formatTaxId,
    formatDuration,
    formatRate,
    formatJSON,
    formatList
};