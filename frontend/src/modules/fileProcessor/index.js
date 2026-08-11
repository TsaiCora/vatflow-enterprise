// frontend/src/modules/fileProcessor/index.js
/**
 * 文件处理器 - 前端
 * 统一导出所有解析器和税务计算
 */

import platforms from './platforms';
import tax from './tax';
import certificates from './certificates';

// 导出各模块
export { platforms, tax, certificates };

// 导出工具函数
export const getPlatformParser = (platformName) => {
    const key = platformName.toLowerCase();
    return platforms[key] || null;
};

export const getTaxCalculator = (countryCode) => {
    const key = countryCode.toUpperCase();
    return tax[key] || null;
};

export const getCertificateHandler = (type) => {
    const key = type.toLowerCase();
    return certificates[key] || null;
};

export const getSupportedPlatforms = () => Object.keys(platforms);
export const getSupportedCountries = () => Object.keys(tax);

// 默认导出
export default {
    platforms,
    tax,
    certificates,
    getPlatformParser,
    getTaxCalculator,
    getCertificateHandler,
    getSupportedPlatforms,
    getSupportedCountries,
};