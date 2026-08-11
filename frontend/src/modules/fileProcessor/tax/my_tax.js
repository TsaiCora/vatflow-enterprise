// backend/src/modules/fileProcessor/parsers/my_tax.js
/**
 * 马来西亚 SST 税务计算
 */

const SST_RATES = {
    STANDARD: 8,
    ZERO: 0,
    EXEMPT: 'exempt'
};

function calculateVAT(amount, rate = SST_RATES.STANDARD) {
    if (rate === SST_RATES.EXEMPT) {
        return { netAmount: amount, vatAmount: 0, grossAmount: amount, rate: 'exempt', currency: 'MYR' };
    }
    const vatAmount = (amount * rate) / 100;
    return { netAmount: amount, vatAmount: vatAmount, grossAmount: amount + vatAmount, rate: rate, currency: 'MYR' };
}

function validateVATNumber(vatNumber) {
    const pattern = /^[A-Z]{2}\d{8}$/;
    if (!pattern.test(vatNumber)) return { valid: false, message: '无效的马来西亚 SST 号码格式' };
    return { valid: true, message: 'SST 号码有效' };
}

function getVATSummary(transactions) {
    const summary = { totalNetAmount: 0, totalVATAmount: 0, totalGrossAmount: 0, byRate: {} };
    transactions.forEach(tx => {
        const rate = tx.vatRate || SST_RATES.STANDARD;
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
    return { ...summary, currency: 'MYR', country: 'MY', countryName: '马来西亚' };
}

module.exports = {
    SST_RATES, calculateVAT, validateVATNumber, getVATSummary,
    countryCode: 'MY', countryName: '马来西亚', currency: 'MYR', taxSystem: 'SST'
};