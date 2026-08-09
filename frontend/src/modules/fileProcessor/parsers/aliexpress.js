// backend/src/modules/fileProcessor/parsers/aliexpress.js
const { logger } = require('../../../utils/logger');

function parseAliexpress(rawData) {
    if (!rawData || rawData.length === 0) {
        logger.warn('AliExpress 数据为空');
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
            order_id: normalized['Order_Id'] || normalized['Order_ID'] || normalized['OrderId'] || '',
            order_date: normalized['Order_Date'] || normalized['Created_At'] || '',
            country: normalized['Country'] || normalized['Shipping_Country'] || '',
            vat_number: normalized['VAT_Number'] || normalized['Tax_ID'] || '',
            amount: parseCurrency(normalized['Total_Amount'] || normalized['Price_Info'] || 0),
            net_amount: parseCurrency(normalized['Product_Amount'] || normalized['Item_Price'] || 0),
            vat_amount: parseCurrency(normalized['VAT'] || normalized['Tax'] || 0),
            product_sku: normalized['SKU'] || normalized['Product_SKU'] || '',
            quantity: parseInt(normalized['Quantity'] || 1),
            store_name: normalized['Store_Name'] || '',
            _platform: 'aliexpress',
            _raw: row
        };

        results.push(transaction);
    }

    logger.info(`AliExpress 解析完成：${results.length} 条记录`);
    return results;
}

function parseCurrency(value) {
    if (value === null || value === undefined || value === '') return 0;
    const str = String(value).replace(/[€$£,]/g, '').replace(/\(/, '-').replace(/\)/, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

module.exports = { parse: parseAliexpress };