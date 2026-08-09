// frontend/src/modules/fileProcessor/parsers/index.js

// ===== 电商平台解析器 =====
import AmazonParser from './amazon';
import EbayParser from './ebay';
import ShopifyParser from './shopify';
import WishParser from './wish';
import AliexpressParser from './aliexpress';
import AllegroParser from './allegro';
import EtsyParser from './etsy';
import ZalandoParser from './zalando';
import DepopParser from './depop';
import LazadaParser from './lazada';
import MercariParser from './mercari';
import PoshmarkParser from './poshmark';
import RakutenParser from './rakuten';
import SheinParser from './shein';
import ShopeeParser from './shopee';
import TargetParser from './target';
import TemuParser from './temu';
import TiktokParser from './tiktok';
import WalmartParser from './walmart';
import YahooParser from './yahoo';

// ===== 英国税务文件 =====
import C79Parser from './c79';
import C88Parser from './c88';
import PVAParser from './pva';

// ===== 欧洲税务文件 =====
import DeTaxParser from './de_tax';
import FrTaxParser from './fr_tax';
import ItTaxParser from './it_tax';
import EsTaxParser from './es_tax';
import NlTaxParser from './nl_tax';
import BeTaxParser from './be_tax';
import PlTaxParser from './pl_tax';
import SeTaxParser from './se_tax';

// ===== 亚洲税务文件 =====
import JpTaxParser from './jp_tax';
import SgTaxParser from './sg_tax';

// ===== 美洲税务文件 =====
import UsTaxParser from './us_tax';
import CaTaxParser from './ca_tax';

// ===== 大洋洲税务文件 =====
import AuTaxParser from './au_tax';

// ===== 解析器注册表 =====
const parsers = {
    // 电商平台
    amazon: AmazonParser,
    ebay: EbayParser,
    shopify: ShopifyParser,
    wish: WishParser,
    aliexpress: AliexpressParser,
    allegro: AllegroParser,
    etsy: EtsyParser,
    zalando: ZalandoParser,
    depop: DepopParser,
    lazada: LazadaParser,
    mercari: MercariParser,
    poshmark: PoshmarkParser,
    rakuten: RakutenParser,
    shein: SheinParser,
    shopee: ShopeeParser,
    target: TargetParser,
    temu: TemuParser,
    tiktok: TiktokParser,
    walmart: WalmartParser,
    yahoo: YahooParser,
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
 * 获取解析器
 */
export function getParser(platform) {
    const Parser = parsers[platform.toLowerCase()];
    if (!Parser) {
        throw new Error(`不支持的平台: ${platform}`);
    }
    return new Parser();
}

/**
 * 获取所有支持的平台列表
 */
export function getSupportedPlatforms() {
    return Object.keys(parsers);
}

/**
 * 获取平台显示名称
 */
export function getPlatformDisplayName(platform) {
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
 * 获取所有税务平台列表
 */
export function getTaxPlatforms() {
    return [
        'c79', 'c88', 'pva',
        'de_tax', 'fr_tax', 'it_tax', 'es_tax', 'nl_tax', 'be_tax', 'pl_tax', 'se_tax',
        'jp_tax', 'sg_tax',
        'us_tax', 'ca_tax',
        'au_tax'
    ];
}

/**
 * 获取所有电商平台列表
 */
export function getEcommercePlatforms() {
    return [
        'amazon', 'ebay', 'shopify', 'wish', 'aliexpress', 'allegro',
        'etsy', 'zalando', 'depop', 'lazada', 'mercari', 'poshmark',
        'rakuten', 'shein', 'shopee', 'target', 'temu', 'tiktok',
        'walmart', 'yahoo'
    ];
}

export default {
    getParser,
    getSupportedPlatforms,
    getTaxPlatforms,
    getEcommercePlatforms,
    getPlatformDisplayName,
    parsers
};