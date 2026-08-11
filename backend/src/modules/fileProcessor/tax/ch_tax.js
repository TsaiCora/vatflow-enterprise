// backend/src/modules/fileProcessor/parsers/ch_tax.js
/**
 * 瑞士 VAT 税务计算
 */

const VAT_RATES = {
    STANDARD: 7.7,
    REDUCED: 2.5,
    ZERO: 0,
    EXEMPT: 'exempt'
};

function calculateVAT(amount, rate = VAT_RATES.STANDARD) {
    if (rate === VAT_RATES.EXEMPT) {
        return { netAmount: amount, vatAmount: 0, grossAmount: amount, rate: 'exempt', currency: 'CHF' };
    }
    const vatAmount = (amount * rate) / 100;
    return { netAmount: amount, vatAmount: vatAmount, grossAmount: amount + vatAmount, rate: rate, currency: 'CHF' };
}

function validateVATNumber(vatNumber) {
    const pattern = /^CHE-?\d{3}\.\d{3}\.\d{3}$/;
    if (!pattern.test(vatNumber)) return { valid: false, message: '无效的瑞士 VAT 号码格式' };
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
    return { ...summary, currency: 'CHF', country: 'CH', countryName: '瑞士' };
}

module.exports = {
    VAT_RATES, calculateVAT, validateVATNumber, getVATSummary,
    countryCode: 'CH', countryName: '瑞士', currency: 'CHF', taxSystem: 'VAT'
};