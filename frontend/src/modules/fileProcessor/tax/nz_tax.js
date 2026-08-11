// backend/src/modules/fileProcessor/parsers/nz_tax.js
/**
 * 新西兰 GST 税务计算
 */

const GST_RATES = {
    STANDARD: 15,
    ZERO: 0,
    EXEMPT: 'exempt'
};

function calculateVAT(amount, rate = GST_RATES.STANDARD) {
    if (rate === GST_RATES.EXEMPT) {
        return { netAmount: amount, vatAmount: 0, grossAmount: amount, rate: 'exempt', currency: 'NZD' };
    }
    const vatAmount = (amount * rate) / 100;
    return { netAmount: amount, vatAmount: vatAmount, grossAmount: amount + vatAmount, rate: rate, currency: 'NZD' };
}

function validateVATNumber(vatNumber) {
    const pattern = /^NZ\d{8,9}$/;
    if (!pattern.test(vatNumber)) return { valid: false, message: '无效的新西兰 GST 号码格式' };
    return { valid: true, message: 'GST 号码有效' };
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
    return { ...summary, currency: 'NZD', country: 'NZ', countryName: '新西兰' };
}

module.exports = {
    GST_RATES, calculateVAT, validateVATNumber, getVATSummary,
    countryCode: 'NZ', countryName: '新西兰', currency: 'NZD', taxSystem: 'GST'
};