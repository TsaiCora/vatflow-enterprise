// backend/src/modules/fileProcessor/parsers/in_tax.js
/**
 * 印度 GST 税务计算
 */

const GST_RATES = {
    STANDARD: 18,
    REDUCED: 12,
    LOW: 5,
    ZERO: 0,
    EXEMPT: 'exempt'
};

function calculateVAT(amount, rate = GST_RATES.STANDARD) {
    if (rate === GST_RATES.EXEMPT) {
        return { netAmount: amount, vatAmount: 0, grossAmount: amount, rate: 'exempt', currency: 'INR' };
    }
    const vatAmount = (amount * rate) / 100;
    return { netAmount: amount, vatAmount: vatAmount, grossAmount: amount + vatAmount, rate: rate, currency: 'INR' };
}

function validateVATNumber(vatNumber) {
    const pattern = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/;
    if (!pattern.test(vatNumber)) return { valid: false, message: '无效的印度 GSTIN 号码格式' };
    return { valid: true, message: 'GSTIN 号码有效' };
}

function getVATSummary(transactions) {
    const summary = { totalNetAmount: 0, totalVATAmount: 0, totalGrossAmount: 0, byRate: {} };
    transactions.forEach(tx => {
        const rate = tx.vatRate || GST_RATES.STANDARD;
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
    return { ...summary, currency: 'INR', country: 'IN', countryName: '印度' };
}

module.exports = {
    GST_RATES, calculateVAT, validateVATNumber, getVATSummary,
    countryCode: 'IN', countryName: '印度', currency: 'INR', taxSystem: 'GST'
};