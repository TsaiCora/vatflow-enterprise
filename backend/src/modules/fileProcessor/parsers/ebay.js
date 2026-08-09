// backend/src/modules/fileProcessor/parsers/ebay.js
const { logger } = require('../../../utils/logger');

function parseEbay(rawData) {
    if (!rawData || rawData.length === 0) {
        logger.warn('eBay 数据为空');
        return [];
    }

    const results = [];

    for (const row of rawData) {
        // 清理字段名
        const normalized = {};
        for (const [key, value] of Object.entries(row)) {
            let cleanKey = key.replace(/_[0-9]+$/, '').trim().replace(/\s+/g, '_');
            normalized[cleanKey] = value;
        }

        const transaction = {
            order_id: normalized['Transaction_ID'] || normalized['Order_ID'] || normalized['Order_Number'] || '',
            order_date: normalized['Transaction_Date'] || normalized['Order_Date'] || '',
            country: normalized['Country'] || normalized['Buyer_Country'] || normalized['Ship_To_Country'] || '',
            vat_number: normalized['Buyer_VAT_ID'] || normalized['VAT_ID'] || '',
            amount: parseCurrency(normalized['Gross_Amount'] || normalized['Total_Amount'] || 0),
            net_amount: parseCurrency(normalized['Net_Amount'] || normalized['Item_Price'] || 0),
            vat_amount: parseCurrency(normalized['Tax'] || normalized['VAT_Amount'] || 0),
            product_sku: normalized['Item_ID'] || normalized['Product_ID'] || normalized['SKU'] || '',
            quantity: parseInt(normalized['Quantity'] || normalized['Qty'] || 1),
            _platform: 'ebay',
            _raw: row
        };

        results.push(transaction);
    }

    logger.info(`eBay 解析完成：${results.length} 条记录`);
    return results;
}

function parseCurrency(value) {
    if (value === null || value === undefined || value === '') return 0;
    const str = String(value).replace(/[€$£,]/g, '').replace(/\(/, '-').replace(/\)/, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

module.exports = { parse: parseEbay };