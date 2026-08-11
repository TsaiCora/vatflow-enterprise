// frontend/src/modules/fileProcessor/platforms/index.js
/**
 * 电商平台解析器 - 前端
 * 各平台文件上传后的数据解析
 */

// 平台解析器映射
const platforms = {
    aliexpress: require('./aliexpress'),
    allegro: require('./allegro'),
    amazon: require('./amazon'),
    depop: require('./depop'),
    ebay: require('./ebay'),
    etsy: require('./etsy'),
    lazada: require('./lazada'),
    mercari: require('./mercari'),
    poshmark: require('./poshmark'),
    pva: require('./pva'),
    rakuten: require('./rakuten'),
    shein: require('./shein'),
    shopeep: require('./shopeep'),
    shopify: require('./shopify'),
    target: require('./target'),
    temu: require('./temu'),
    tiktok: require('./tiktok'),
    walmart: require('./walmart'),
    wish: require('./wish'),
    yahoo: require('./yahoo'),
    zalando: require('./zalando'),
};

/**
 * 获取平台解析器
 */
export const getPlatformParser = (platformName) => {
    const key = platformName.toLowerCase();
    return platforms[key] || null;
};

/**
 * 获取所有支持的平台列表
 */
export const getSupportedPlatforms = () => {
    return Object.keys(platforms);
};

export default platforms;