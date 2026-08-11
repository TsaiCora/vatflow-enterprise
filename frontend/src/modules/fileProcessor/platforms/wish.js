// backend/src/modules/fileProcessor/parsers/wish.js
const { logger } = require('../../../utils/logger');

function parseWish(rawData) {
    if (!rawData || rawData.length === 0) {
        logger.warn('Wish 数据为空');
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
            order_id: normalized['Order_ID'] || '',
            order_date: normalized['Transaction_Date'] || '',
            country: normalized['Ship_To_Country'] || normalized['Taxable_Country'] || '',
            vat_number: normalized['Company_Name'] || '',
            amount: parseCurrency(normalized['Gross_Amount_Plus_Tax_Amount'] || normalized['Gross_Amount'] || 0),
            net_amount: parseCurrency(normalized['Gross_Amount'] || 0),
            vat_amount: parseCurrency(normalized['Tax_Amount'] || normalized['Tax_Amount_(in_Merchant_Payment_Currency)'] || 0),
            tax_rate: parseFloat(normalized['Tax_Rate']) || null,
            taxable_basis: parseCurrency(normalized['Taxable_Basis'] || 0),
            tax_authority: normalized['Tax_Authority_Name'] || '',
            product_sku: normalized['Description'] || '',
            quantity: parseInt(normalized['Quantity'] || 1),
            _platform: 'wish',
            _raw: row
        };

        results.push(transaction);
    }

    logger.info(`Wish 解析完成：${results.length} 条记录`);
    return results;
}

function parseCurrency(value) {
    if (value === null || value === undefined || value === '') return 0;
    const str = String(value).replace(/[€$£,]/g, '').replace(/\(/, '-').replace(/\)/, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

module.exports = { parse: parseWish };