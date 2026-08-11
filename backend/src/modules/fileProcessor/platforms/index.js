// backend/src/modules/fileProcessor/platforms/index.js
/**
 * 电商平台解析器模块
 * 各平台文件上传后的数据解析
 */

module.exports = {
    aliexpress: require('./aliexpress'),
    allegro: require('./allegro'),
    amazon: require('./amazon'),
    depop: require('./depop'),
    ebay: require('./ebay'),
    etsy: require('./etsy'),
    lazada: require('./lazada'),
    mercari: require('./mercari'),
    poshmark: require('./poshmark'),
    rakuten: require('./rakuten'),
    shein: require('./shein'),
    shopeeb: require('./shopeeb'),
    shopify: require('./shopify'),
    target: require('./target'),
    temu: require('./temu'),
    tiktok: require('./tiktok'),
    walmart: require('./walmart'),
    wish: require('./wish'),
    yahoo: require('./yahoo'),
    zalando: require('./zalando'),
    pva: require('./pva')
};