// backend/src/modules/fileProcessor/parsers/index.js

// ===== 电商平台解析器 =====
const amazon = require('./amazon');
const ebay = require('./ebay');
const shopify = require('./shopify');
const wish = require('./wish');
const aliexpress = require('./aliexpress');
const allegro = require('./allegro');
const etsy = require('./etsy');
const zalando = require('./zalando');
const depop = require('./depop');
const lazada = require('./lazada');
const mercari = require('./mercari');
const poshmark = require('./poshmark');
const rakuten = require('./rakuten');
const shein = require('./shein');
const shopee = require('./shopee');
const target = require('./target');
const temu = require('./temu');
const tiktok = require('./tiktok');
const walmart = require('./walmart');
const yahoo = require('./yahoo');

// ===== 英国税务文件 =====
const C79Parser = require('./c79');
const C88Parser = require('./c88');
const PVAParser = require('./pva');

// ===== 欧洲税务文件 =====
const DeTaxParser = require('./de_tax');
const FrTaxParser = require('./fr_tax');
const ItTaxParser = require('./it_tax');
const EsTaxParser = require('./es_tax');
const NlTaxParser = require('./nl_tax');
const BeTaxParser = require('./be_tax');
const PlTaxParser = require('./pl_tax');
const SeTaxParser = require('./se_tax');

// ===== 亚洲税务文件 =====
const JpTaxParser = require('./jp_tax');
const SgTaxParser = require('./sg_tax');

// ===== 美洲税务文件 =====
const UsTaxParser = require('./us_tax');
const CaTaxParser = require('./ca_tax');

// ===== 大洋洲税务文件 =====
const AuTaxParser = require('./au_tax');

// ===== 解析器注册表 =====
const parsers = {
    // 电商平台
    amazon,
    ebay,
    shopify,
    wish,
    aliexpress,
    allegro,
    etsy,
    zalando,
    depop,
    lazada,
    mercari,
    poshmark,
    rakuten,
    shein,
    shopee,
    target,
    temu,
    tiktok,
    walmart,
    yahoo,
    // 英国税务
    c79: C79Parser,
    c88: C88Parser,
    pva: PVAParser,
    // 欧洲税务
    de_tax: DeTaxParser,
    fr_tax: FrTaxParser,
    it_tax: ItTaxParser,
    es_tax: EsTaxParser,
    nl_tax: NlTaxParser,
    be_tax: BeTaxParser,
    pl_tax: PlTaxParser,
    se_tax: SeTaxParser,
    // 亚洲税务
    jp_tax: JpTaxParser,
    sg_tax: SgTaxParser,
    // 美洲税务
    us_tax: UsTaxParser,
    ca_tax: CaTaxParser,
    // 大洋洲税务
    au_tax: AuTaxParser
};

/**
 * 获取平台显示名称
 */
function getPlatformDisplayName(platform) {
    const names = {
        // 电商平台
        amazon: 'Amazon',
        ebay: 'eBay',
        shopify: 'Shopify',
        wish: 'Wish',
        aliexpress: 'AliExpress',
        allegro: 'Allegro',
        etsy: 'Etsy',
        zalando: 'Zalando',
        depop: 'Depop',
        lazada: 'Lazada',
        mercari: 'Mercari',
        poshmark: 'Poshmark',
        rakuten: 'Rakuten',
        shein: 'SHEIN',
        shopee: 'Shopee',
        target: 'Target',
        temu: 'Temu',
        tiktok: 'TikTok Shop',
        walmart: 'Walmart',
        yahoo: 'Yahoo Japan',
        // 英国税务
        c79: 'C79 进口增值税证书 (英国)',
        c88: 'C88 海关清关单 (英国)',
        pva: 'PVA 递延清关 (英国)',
        // 欧洲税务
        de_tax: '进口增值税证明 (德国)',
        fr_tax: '进口增值税证明 (法国)',
        it_tax: '进口增值税证明 (意大利)',
        es_tax: '进口增值税证明 (西班牙)',
        nl_tax: '进口增值税证明 (荷兰)',
        be_tax: '进口增值税证明 (比利时)',
        pl_tax: '进口增值税证明 (波兰)',
        se_tax: '进口增值税证明 (瑞典)',
        // 亚洲税务
        jp_tax: '消费税证明 (日本)',
        sg_tax: 'GST 申报 (新加坡)',
        // 美洲税务
        us_tax: '销售税申报 (美国)',
        ca_tax: 'GST/HST 申报 (加拿大)',
        // 大洋洲税务
        au_tax: 'GST 申报 (澳大利亚)'
    };
    return names[platform.toLowerCase()] || platform;
}

/**
 * 获取解析器
 */
function getParser(platform) {
    const Parser = parsers[platform.toLowerCase()];
    if (!Parser) {
        throw new Error(`不支持的平台: ${platform}`);
    }
    return new Parser();
}

/**
 * 获取所有支持的平台列表
 */
function getSupportedPlatforms() {
    return Object.keys(parsers);
}

/**
 * 获取所有税务平台列表
 */
function getTaxPlatforms() {
    const taxPlatforms = [
        'c79', 'c88', 'pva',
        'de_tax', 'fr_tax', 'it_tax', 'es_tax', 'nl_tax', 'be_tax', 'pl_tax', 'se_tax',
        'jp_tax', 'sg_tax',
        'us_tax', 'ca_tax',
        'au_tax'
    ];
    return taxPlatforms;
}

/**
 * 获取所有电商平台列表
 */
function getEcommercePlatforms() {
    const ecommerce = [
        'amazon', 'ebay', 'shopify', 'wish', 'aliexpress', 'allegro',
        'etsy', 'zalando', 'depop', 'lazada', 'mercari', 'poshmark',
        'rakuten', 'shein', 'shopee', 'target', 'temu', 'tiktok',
        'walmart', 'yahoo'
    ];
    return ecommerce;
}

module.exports = {
    parsers,
    getParser,
    getSupportedPlatforms,
    getTaxPlatforms,
    getEcommercePlatforms,
    getPlatformDisplayName,
    // 导出所有解析器供直接访问
    amazon,
    ebay,
    shopify,
    wish,
    aliexpress,
    allegro,
    etsy,
    zalando,
    depop,
    lazada,
    mercari,
    poshmark,
    rakuten,
    shein,
    shopee,
    target,
    temu,
    tiktok,
    walmart,
    yahoo,
    c79: C79Parser,
    c88: C88Parser,
    pva: PVAParser,
    de_tax: DeTaxParser,
    fr_tax: FrTaxParser,
    it_tax: ItTaxParser,
    es_tax: EsTaxParser,
    nl_tax: NlTaxParser,
    be_tax: BeTaxParser,
    pl_tax: PlTaxParser,
    se_tax: SeTaxParser,
    jp_tax: JpTaxParser,
    sg_tax: SgTaxParser,
    us_tax: UsTaxParser,
    ca_tax: CaTaxParser,
    au_tax: AuTaxParser
};