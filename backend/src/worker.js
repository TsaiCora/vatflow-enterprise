// backend/src/worker.js
// 替换税务接口部分为以下代码：

// =============================================
// ===== 税务接口 =====
// =============================================

// 国家税率映射（所有35个国家）
const TAX_RATES = {
    GB: 20, FR: 20, DE: 19, IT: 22, ES: 21,
    NL: 21, BE: 21, PL: 23, SE: 25, DK: 25,
    FI: 24, IE: 23, PT: 23, AT: 20, NO: 25,
    CH: 7.7, RU: 20, JP: 10, KR: 10, SG: 9,
    MY: 8, TH: 7, VN: 10, ID: 11, PH: 12,
    IN: 18, AU: 10, NZ: 15, CA: 5, US: 0,
    MX: 16, BR: 17, TR: 18, AE: 5, ZA: 15
};

// 国家货币映射
const CURRENCY_MAP = {
    GB: 'GBP', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR',
    NL: 'EUR', BE: 'EUR', PL: 'PLN', SE: 'SEK', DK: 'DKK',
    FI: 'EUR', IE: 'EUR', PT: 'EUR', AT: 'EUR', NO: 'NOK',
    CH: 'CHF', RU: 'RUB', JP: 'JPY', KR: 'KRW', SG: 'SGD',
    MY: 'MYR', TH: 'THB', VN: 'VND', ID: 'IDR', PH: 'PHP',
    IN: 'INR', AU: 'AUD', NZ: 'NZD', CA: 'CAD', US: 'USD',
    MX: 'MXN', BR: 'BRL', TR: 'TRY', AE: 'AED', ZA: 'ZAR'
};

// 国家名称映射
const COUNTRY_NAME_MAP = {
    GB: '英国', FR: '法国', DE: '德国', IT: '意大利', ES: '西班牙',
    NL: '荷兰', BE: '比利时', PL: '波兰', SE: '瑞典', DK: '丹麦',
    FI: '芬兰', IE: '爱尔兰', PT: '葡萄牙', AT: '奥地利', NO: '挪威',
    CH: '瑞士', RU: '俄罗斯', JP: '日本', KR: '韩国', SG: '新加坡',
    MY: '马来西亚', TH: '泰国', VN: '越南', ID: '印度尼西亚', PH: '菲律宾',
    IN: '印度', AU: '澳大利亚', NZ: '新西兰', CA: '加拿大', US: '美国',
    MX: '墨西哥', BR: '巴西', TR: '土耳其', AE: '阿联酋', ZA: '南非'
};

/**
 * 税务校验接口 - 单笔校验
 */
app.post('/api/v1/tax/validate', async (c) => {
    try {
        const body = await c.req.json();
        console.log('📤 税务校验请求:', body);

        // 支持两种请求格式
        // 格式1: { vatNumber, amount, country, period }
        // 格式2: { importData: [...], salesData: [...] }
        
        // 如果是批量校验（importData + salesData）
        if (body.importData && body.salesData) {
            const { importData, salesData } = body;
            const TaxValidator = require('./modules/fileProcessor/taxValidator');
            const validator = new TaxValidator();
            const result = validator.validate(importData, salesData);
            return c.json({ success: true, data: result });
        }

        // 单笔校验
        const { vatNumber, amount, country, period } = body;
        
        if (!vatNumber || !country) {
            return c.json({
                success: false,
                error: 'VAT号码和国家为必填项'
            }, 400);
        }

        const countryCode = country.toUpperCase();
        const taxRate = TAX_RATES[countryCode] || 20;
        const currency = CURRENCY_MAP[countryCode] || 'EUR';
        const countryName = COUNTRY_NAME_MAP[countryCode] || countryCode;

        // 金额计算
        const netAmount = amount || 0;
        const vatAmount = netAmount * (taxRate / 100);
        const grossAmount = netAmount + vatAmount;

        // 基础VAT号码格式验证
        let valid = true;
        let message = 'VAT 号码有效';

        // 简单格式验证
        const patterns = {
            'GB': /^GB\d{9,12}$/,
            'DE': /^DE\d{9}$/,
            'FR': /^FR[A-Z0-9]{2}\d{9}$/,
            'IT': /^IT\d{11}$/,
            'ES': /^ES[A-Z0-9]\d{8}$/,
            'NL': /^NL[A-Z0-9]{9}[A-Z]{1,2}$/,
            'BE': /^BE\d{10}$/,
            'PL': /^PL\d{10}$/,
            'SE': /^SE\d{12}$/,
            'DK': /^DK\d{8}$/,
            'FI': /^FI\d{8}$/,
            'IE': /^IE\d{7}[A-Z]{1,2}$/,
            'PT': /^PT\d{9}$/,
            'AT': /^ATU\d{8}$/,
            'JP': /^[A-Z0-9]{12,13}$/,
            'SG': /^[A-Z]\d{8}[A-Z]$/,
            'AU': /^\d{11}$/,
            'CA': /^[A-Z0-9]{9}$/,
            'KR': /^[0-9]{10}$/,
            'MX': /^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
            'BR': /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
            'IN': /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/,
            'ZA': /^\d{10}$/,
            'TR': /^TR\d{10}$/,
            'AE': /^AE\d{15}$/,
            'NZ': /^NZ\d{8,9}$/,
            'MY': /^[A-Z]{2}\d{8}$/,
            'TH': /^\d{13}$/,
            'VN': /^\d{10}$/,
            'ID': /^\d{15}$/,
            'PH': /^\d{12}$/,
            'RU': /^\d{10}$/,
            'NO': /^NO\d{9}$/,
            'CH': /^CHE-?\d{3}\.\d{3}\.\d{3}$/,
            'US': /^\d{2}-\d{7}$/
        };

        const pattern = patterns[countryCode];
        if (pattern && !pattern.test(vatNumber)) {
            valid = false;
            message = `VAT 号码格式无效，请使用 ${countryCode} 格式`;
        }

        return c.json({
            success: true,
            data: {
                vatNumber,
                country: countryCode,
                countryName,
                valid,
                message,
                taxRate,
                netAmount,
                vatAmount,
                grossAmount,
                currency,
                period: period || null,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ 税务校验错误:', error);
        return c.json({
            success: false,
            error: error.message || '税务校验失败'
        }, 500);
    }
});

/**
 * 税务摘要
 */
app.post('/api/v1/tax/summary', async (c) => {
    try {
        const { importData, salesData } = await c.req.json();
        const TaxValidator = require('./modules/fileProcessor/taxValidator');
        const validator = new TaxValidator();
        const summary = validator._generateSummary(importData, salesData);
        return c.json({ success: true, data: summary });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * 获取所有支持的税务国家列表
 */
app.get('/api/v1/tax/countries', async (c) => {
    try {
        const countries = Object.keys(TAX_RATES).map(code => ({
            code,
            name: COUNTRY_NAME_MAP[code] || code,
            taxRate: TAX_RATES[code],
            currency: CURRENCY_MAP[code] || 'EUR'
        }));
        return c.json({ success: true, data: countries });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * 获取平台列表
 */
app.get('/api/v1/tax/platforms', async (c) => {
    try {
        const platforms = [
            { id: 'amazon', name: 'Amazon', icon: 'amazon' },
            { id: 'ebay', name: 'eBay', icon: 'ebay' },
            { id: 'aliexpress', name: 'AliExpress', icon: 'aliexpress' },
            { id: 'shopify', name: 'Shopify', icon: 'shopify' },
            { id: 'etsy', name: 'Etsy', icon: 'etsy' },
            { id: 'walmart', name: 'Walmart', icon: 'walmart' },
            { id: 'target', name: 'Target', icon: 'target' },
            { id: 'zalando', name: 'Zalando', icon: 'zalando' },
            { id: 'lazada', name: 'Lazada', icon: 'lazada' },
            { id: 'shopee', name: 'Shopee', icon: 'shopee' },
            { id: 'temu', name: 'Temu', icon: 'temu' },
            { id: 'shein', name: 'SHEIN', icon: 'shein' },
            { id: 'tiktok', name: 'TikTok Shop', icon: 'tiktok' },
        ];
        return c.json({ success: true, data: platforms });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * 获取电商平台列表
 */
app.get('/api/v1/tax/ecommerce-platforms', async (c) => {
    try {
        const platforms = [
            { id: 'amazon', name: 'Amazon', countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'] },
            { id: 'ebay', name: 'eBay', countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT'] },
            { id: 'aliexpress', name: 'AliExpress', countries: ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'PL', 'SE'] },
            { id: 'shopify', name: 'Shopify', countries: ['GB', 'US', 'CA', 'AU', 'NZ'] },
            { id: 'etsy', name: 'Etsy', countries: ['GB', 'FR', 'DE', 'IT', 'NL', 'SE', 'PL'] },
            { id: 'walmart', name: 'Walmart', countries: ['US', 'CA', 'MX'] },
            { id: 'lazada', name: 'Lazada', countries: ['SG', 'MY', 'TH', 'VN', 'PH', 'ID'] },
            { id: 'shopee', name: 'Shopee', countries: ['SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'TW'] },
            { id: 'temu', name: 'Temu', countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES'] },
            { id: 'shein', name: 'SHEIN', countries: ['US', 'GB', 'FR', 'DE', 'IT', 'ES', 'AU'] },
            { id: 'tiktok', name: 'TikTok Shop', countries: ['GB', 'US', 'SG', 'TH', 'VN', 'PH', 'MY'] },
        ];
        return c.json({ success: true, data: platforms });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// ===== C79 上传处理 =====
app.post('/api/v1/tax/c79/upload', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];
        // 处理 C79 文件解析
        return c.json({ 
            success: true, 
            message: 'C79 文件上传成功',
            data: { filename: file?.name || 'unknown' }
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// ===== C88 上传处理 =====
app.post('/api/v1/tax/c88/upload', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];
        return c.json({ 
            success: true, 
            message: 'C88 文件上传成功',
            data: { filename: file?.name || 'unknown' }
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});