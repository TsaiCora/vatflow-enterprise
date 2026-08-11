// backend/src/modules/fileProcessor/parsers/shopify.js
const { logger } = require('../../../utils/logger');

function parseShopify(rawData) {
    if (!rawData || rawData.length === 0) {
        logger.warn('Shopify 数据为空');
        return [];
    }

    const results = [];
    let currentOrderId = null;

    for (const row of rawData) {
        const normalized = {};
        for (const [key, value] of Object.entries(row)) {
            let cleanKey = key.trim().replace(/\s+/g, '_');
            normalized[cleanKey] = value;
        }

        const orderId = normalized['Name'] || normalized['Order_#'] || normalized['Order_Number'] || '';
        if (orderId && orderId !== currentOrderId) {
            currentOrderId = orderId;
        }

        const transaction = {
            order_id: orderId || currentOrderId || '',
            order_date: normalized['Created_at'] || normalized['Paid_at'] || '',
            country: normalized['Shipping_Country'] || normalized['Billing_Country'] || '',
            vat_number: normalized['Tax_#_Name'] || normalized['Taxes'] || '',
            amount: parseCurrency(normalized['Total'] || normalized['Subtotal'] || 0),
            net_amount: parseCurrency(normalized['Subtotal'] || 0),
            vat_amount: parseCurrency(normalized['Taxes'] || getTaxValue(normalized, 1) || 0),
            product_sku: normalized['Lineitem_SKU'] || '',
            quantity: parseInt(normalized['Lineitem_quantity'] || 1),
            _platform: 'shopify',
            _raw: row
        };

        results.push(transaction);
    }

    logger.info(`Shopify 解析完成：${results.length} 条记录`);
    return results;
}

function getTaxValue(row, index) {
    return row[`Tax_${index}_Value`] || row[`Tax ${index} Value`] || null;
}

function parseCurrency(value) {
    if (value === null || value === undefined || value === '') return 0;
    const str = String(value).replace(/[€$£,]/g, '').replace(/\(/, '-').replace(/\)/, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

module.exports = { parse: parseShopify };