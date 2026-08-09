// backend/src/modules/fileProcessor/parsers/allegro.js
const { logger } = require('../../../utils/logger');

function parseAllegro(rawData) {
    if (!rawData || rawData.length === 0) {
        logger.warn('Allegro 数据为空');
        return [];
    }

    const results = [];

    for (const row of rawData) {
        const normalized = {};
        for (const [key, value] of Object.entries(row)) {
            let cleanKey = key.trim().replace(/\s+/g, '_');
            if (key === 'orderId') cleanKey = 'order_id';
            if (key === 'createdAt') cleanKey = 'order_date';
            if (key === 'totalPrice') cleanKey = 'amount';
            if (key === 'shippingCountry') cleanKey = 'country';
            normalized[cleanKey] = value;
        }

        const transaction = {
            order_id: normalized['order_id'] || normalized['Order_ID'] || '',
            order_date: normalized['order_date'] || normalized['Created_At'] || '',
            country: normalized['country'] || normalized['Shipping_Country'] || '',
            vat_number: normalized['vat_number'] || normalized['VAT_Number'] || '',
            amount: parseCurrency(normalized['amount'] || normalized['Total_Amount'] || 0),
            net_amount: parseCurrency(normalized['net_amount'] || 0),
            vat_amount: parseCurrency(normalized['vat_amount'] || 0),
            product_sku: normalized['product_sku'] || normalized['SKU'] || '',
            quantity: parseInt(normalized['quantity'] || 1),
            _platform: 'allegro',
            _raw: row
        };

        results.push(transaction);
    }

    logger.info(`Allegro 解析完成：${results.length} 条记录`);
    return results;
}

function parseCurrency(value) {
    if (value === null || value === undefined || value === '') return 0;
    const str = String(value).replace(/[€$£,]/g, '').replace(/\(/, '-').replace(/\)/, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

module.exports = { parse: parseAllegro };