// backend/src/modules/fileProcessor/parsers/br_tax.js
/**
 * 巴西 ICMS 税务计算
 */

const ICMS_RATES = {
    STANDARD: 17,
    REDUCED: 12,
    ZERO: 0,
    EXEMPT: 'exempt'
};

function calculateVAT(amount, rate = ICMS_RATES.STANDARD) {
    if (rate === ICMS_RATES.EXEMPT) {
        return { netAmount: amount, vatAmount: 0, grossAmount: amount, rate: 'exempt', currency: 'BRL' };
    }
    const vatAmount = (amount * rate) / 100;
    return { netAmount: amount, vatAmount: vatAmount, grossAmount: amount + vatAmount, rate: rate, currency: 'BRL' };
}

function validateVATNumber(vatNumber) {
    const pattern = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!pattern.test(vatNumber)) return { valid: false, message: '无效的巴西 CNPJ 号码格式' };
    return { valid: true, message: 'CNPJ 号码有效' };
}

function getVATSummary(transactions) {
    const summary = { totalNetAmount: 0, totalVATAmount: 0, totalGrossAmount: 0, byRate: {} };
    transactions.forEach(tx => {
        const rate = tx.vatRate || ICMS_RATES.STANDARD;
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
    return { ...summary, currency: 'BRL', country: 'BR', countryName: '巴西' };
}

module.exports = {
    ICMS_RATES, calculateVAT, validateVATNumber, getVATSummary,
    countryCode: 'BR', countryName: '巴西', currency: 'BRL', taxSystem: 'ICMS'
};