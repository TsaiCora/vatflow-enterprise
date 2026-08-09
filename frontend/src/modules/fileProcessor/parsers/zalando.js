// backend/src/modules/fileProcessor/parsers/zalando.js
const { logger } = require('../../../utils/logger');

function parseZalando(rawData) {
    if (!rawData || rawData.length === 0) {
        logger.warn('Zalando 数据为空');
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
            order_id: normalized['Order_Number'] || normalized['Order_ID'] || '',
            order_date: normalized['Order_Date'] || '',
            country: normalized['Country'] || normalized['Shipping_Country'] || '',
            vat_number: normalized['VAT'] || normalized['VAT_Number'] || '',
            amount: parseCurrency(normalized['Product_Price'] || normalized['Total_Price'] || 0),
            net_amount: parseCurrency(normalized['Net_Amount'] || normalized['Subtotal'] || 0),
            vat_amount: parseCurrency(normalized['VAT_Amount'] || normalized['Tax'] || 0),
            product_sku: normalized['SKU'] || normalized['Product_SKU'] || '',
            quantity: parseInt(normalized['Quantity'] || 1),
            _platform: 'zalando',
            _raw: row
        };

        results.push(transaction);
    }

    logger.info(`Zalando 解析完成：${results.length} 条记录`);
    return results;
}

function parseCurrency(value) {
    if (value === null || value === undefined || value === '') return 0;
    const str = String(value).replace(/[€$£,]/g, '').replace(/\(/, '-').replace(/\)/, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

module.exports = { parse: parseZalando };