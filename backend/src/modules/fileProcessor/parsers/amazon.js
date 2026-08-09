// backend/src/modules/fileProcessor/parsers/amazon.js
const { logger } = require('../../../utils/logger');

/**
 * Amazon 税务报告解析器
 * 支持 Amazon 税务报告 CSV 格式
 */
function parseAmazon(rawData) {
    if (!rawData || rawData.length === 0) {
        logger.warn('Amazon 数据为空');
        return [];
    }

    const results = [];

    for (const row of rawData) {
        // 使用 Amazon 原始字段名
        const transaction = {
            // 订单信息
            order_id: row.ACTIVITY_TRANSACTION_ID || row.TRANSACTION_EVENT_ID || '',
            order_date: row.TAX_CALCULATION_DATE || row.ACTIVITY_PERIOD || '',
            
            // 国家信息
            country: row.ARRIVAL_COUNTRY || row.TAXABLE_JURISDICTION || '',
            
            // VAT 号码
            vat_number: row.BUYER_VAT_NUMBER || row.SELLER_VAT_NUMBER || '',
            
            // 金额信息
            amount: parseCurrency(row.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL || 0),
            net_amount: parseCurrency(row.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL || 0),
            vat_amount: parseCurrency(row.TOTAL_ACTIVITY_VALUE_VAT_AMT || 0),
            
            // 税率
            tax_rate: parseFloat(row.PRICE_OF_ITEMS_VAT_RATE_PERCENT || 0) / 100,
            
            // 商品信息
            product_sku: row.SELLER_SKU || '',
            quantity: parseInt(row.QTY || 1),
            
            // 平台标识
            _platform: 'amazon',
            _raw: row
        };

        results.push(transaction);
    }

    logger.info(`Amazon 解析完成：${results.length} 条记录`);
    return results;
}

function parseCurrency(value) {
    if (value === null || value === undefined || value === '') return 0;
    const str = String(value).replace(/[€$£,]/g, '').replace(/\(/, '-').replace(/\)/, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

module.exports = { parse: parseAmazon };