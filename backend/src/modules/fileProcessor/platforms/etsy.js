// backend/src/modules/fileProcessor/parsers/etsy.js
const { logger } = require('../../../utils/logger');

function parseEtsy(rawData) {
    if (!rawData || rawData.length === 0) {
        logger.warn('Etsy 数据为空');
        return [];
    }

    const results = [];

    for (const row of rawData) {
        const normalized = {};
        for (const [key, value] of Object.entries(row)) {
            let cleanKey = key.trim().replace(/\s+/g, '_');
            normalized[cleanKey] = value;
        }

        const transaction = {
            order_id: normalized['Order_#'] || normalized['Order_ID'] || normalized['Order_Number'] || '',
            order_date: normalized['Order_Date'] || normalized['Date_Created'] || '',
            country: normalized['Country'] || normalized['Shipping_Country'] || '',
            vat_number: normalized['VAT'] || normalized['Tax_ID'] || '',
            amount: parseCurrency(normalized['Item_Total'] || normalized['Total_Price'] || 0),
            net_amount: parseCurrency(normalized['Subtotal'] || normalized['Item_Price'] || 0),
            vat_amount: parseCurrency(normalized['Sales_Tax'] || normalized['VAT_Amount'] || 0),
            product_sku: normalized['SKU'] || normalized['Product_ID'] || '',
            quantity: parseInt(normalized['Quantity'] || 1),
            _platform: 'etsy',
            _raw: row
        };

        results.push(transaction);
    }

    logger.info(`Etsy 解析完成：${results.length} 条记录`);
    return results;
}

function parseCurrency(value) {
    if (value === null || value === undefined || value === '') return 0;
    const str = String(value).replace(/[€$£,]/g, '').replace(/\(/, '-').replace(/\)/, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

module.exports = { parse: parseEtsy };