// backend/src/modules/fileProcessor/parsers/pt_tax.js
/**
 * 葡萄牙 VAT 税务计算
 */

const VAT_RATES = {
    STANDARD: 23,
    REDUCED: 13,
    LOW: 6,
    ZERO: 0,
    EXEMPT: 'exempt'
};

function calculateVAT(amount, rate = VAT_RATES.STANDARD) {
    if (rate === VAT_RATES.EXEMPT) {
        return { netAmount: amount, vatAmount: 0, grossAmount: amount, rate: 'exempt', currency: 'EUR' };
    }
    const vatAmount = (amount * rate) / 100;
    return { netAmount: amount, vatAmount: vatAmount, grossAmount: amount + vatAmount, rate: rate, currency: 'EUR' };
}

function validateVATNumber(vatNumber) {
    const pattern = /^PT\d{9}$/;
    if (!pattern.test(vatNumber)) return { valid: false, message: '无效的葡萄牙 VAT 号码格式' };
    return { valid: true, message: 'VAT 号码有效' };
}

function getVATSummary(transactions) {
    const summary = { totalNetAmount: 0, totalVATAmount: 0, totalGrossAmount: 0, byRate: {} };
    transactions.forEach(tx => {
        const rate = tx.vatRate || VAT_RATES.STANDARD;
        const result = calculateVAT(tx.amount, rate);
        summary.totalNetAmount += result.netAmount;
        summary.totalVATAmount += result.vatAmount;
        summary.totalGrossAmount += result.grossAmount;
        const key = String(rate);
        if (!summary.byRate[key]) summary.byRate[key] = { count: 0, amount: 0, vat: 0 };
        summary.byRate[key].count += 1;
        summary.byRate[key].amount += result.netAmount;
        summary.byRate[key].vat += result.vatAmount;
    });
    return { ...summary, currency: 'EUR', country: 'PT', countryName: '葡萄牙' };
}

module.exports = {
    VAT_RATES, calculateVAT, validateVATNumber, getVATSummary,
    countryCode: 'PT', countryName: '葡萄牙', currency: 'EUR', taxSystem: 'VAT'
};