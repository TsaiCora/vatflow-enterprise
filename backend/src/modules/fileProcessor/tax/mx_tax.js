// backend/src/modules/fileProcessor/parsers/mx_tax.js
/**
 * 墨西哥 IVA 税务计算
 */

const IVA_RATES = {
    STANDARD: 16,
    REDUCED: 8,
    ZERO: 0,
    EXEMPT: 'exempt'
};

function calculateVAT(amount, rate = IVA_RATES.STANDARD) {
    if (rate === IVA_RATES.EXEMPT) {
        return { netAmount: amount, vatAmount: 0, grossAmount: amount, rate: 'exempt', currency: 'MXN' };
    }
    const vatAmount = (amount * rate) / 100;
    return { netAmount: amount, vatAmount: vatAmount, grossAmount: amount + vatAmount, rate: rate, currency: 'MXN' };
}

function validateVATNumber(vatNumber) {
    const pattern = /^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (!pattern.test(vatNumber)) return { valid: false, message: '无效的墨西哥 RFC 号码格式' };
    return { valid: true, message: 'RFC 号码有效' };
}

function getVATSummary(transactions) {
    const summary = { totalNetAmount: 0, totalVATAmount: 0, totalGrossAmount: 0, byRate: {} };
    transactions.forEach(tx => {
        const rate = tx.vatRate || IVA_RATES.STANDARD;
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
    return { ...summary, currency: 'MXN', country: 'MX', countryName: '墨西哥' };
}

module.exports = {
    IVA_RATES, calculateVAT, validateVATNumber, getVATSummary,
    countryCode: 'MX', countryName: '墨西哥', currency: 'MXN', taxSystem: 'IVA'
};