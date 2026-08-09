// backend/src/modules/dataProcessor/calculator.js
const { logger } = require('../../utils/logger');

/**
 * 税额计算器
 * 计算VAT税额、验证税率
 */
class TaxCalculator {
    constructor() {
        this.countryRates = require('../../config/country-rates.json');
    }

    /**
     * 计算VAT税额
     * @param {Array|Object} data - 交易数据或聚合数据
     * @param {Object} options - 计算选项
     * @returns {Array|Object} 计算结果
     */
    calculate(data, options = {}) {
        const {
            useDefaultRate = true,
            defaultRate = 0.20,
            roundTo = 2,
            includeOriginal = false
        } = options;

        if (Array.isArray(data)) {
            return data.map(item => this.calculateItem(item, options));
        }

        return this.calculateItem(data, options);
    }

    /**
     * 计算单项
     */
    calculateItem(item, options) {
        const {
            useDefaultRate = true,
            defaultRate = 0.20,
            roundTo = 2,
            includeOriginal = false
        } = options;

        // 确定税率
        let taxRate = this.getTaxRate(item.country, item, useDefaultRate, defaultRate);

        // 获取净销售额
        let netAmount = parseFloat(item.netAmount || item.net_amount || item.totalNet || 0);
        let vatAmount = parseFloat(item.vatAmount || item.vat_amount || item.totalVAT || 0);
        let grossAmount = parseFloat(item.grossAmount || item.gross_amount || item.totalGross || item.amount || 0);

        // 如果净销售额为0但总金额存在，计算净销售额
        if (netAmount === 0 && grossAmount > 0) {
            netAmount = grossAmount / (1 + taxRate);
            vatAmount = grossAmount - netAmount;
        }

        // 如果只有净销售额，计算VAT
        if (netAmount > 0 && vatAmount === 0) {
            vatAmount = netAmount * taxRate;
            grossAmount = netAmount + vatAmount;
        }

        // 如果只有VAT，计算净销售额
        if (vatAmount > 0 && netAmount === 0) {
            netAmount = vatAmount / taxRate;
            grossAmount = netAmount + vatAmount;
        }

        // 四舍五入
        const round = (val) => Math.round(val * Math.pow(10, roundTo)) / Math.pow(10, roundTo);

        const result = {
            ...(includeOriginal ? { original: item } : {}),
            country: item.country,
            vatNumber: item.vatNumber || item.vat_number || 'N/A',
            period: item.period,
            netAmount: round(netAmount),
            vatAmount: round(vatAmount),
            grossAmount: round(grossAmount),
            taxRate: round(taxRate),
            taxRatePercent: round(taxRate * 100),
            isValid: this.validateVAT(netAmount, vatAmount, taxRate)
        };

        // 如果是聚合数据，添加额外字段
        if (item.count !== undefined) {
            result.count = item.count;
            result.transactions = item.transactions;
        }

        return result;
    }

    /**
     * 获取税率
     */
    getTaxRate(country, item, useDefaultRate, defaultRate) {
        // 优先使用自定义税率
        if (item.customRate !== undefined) {
            return item.customRate;
        }

        // 使用国家税率
        if (country && this.countryRates[country]) {
            return this.countryRates[country];
        }

        // 使用默认税率
        if (useDefaultRate) {
            return defaultRate;
        }

        // 从数据中提取税率
        if (item.taxRate) {
            return parseFloat(item.taxRate);
        }

        return defaultRate;
    }

    /**
     * 验证VAT计算是否正确
     */
    validateVAT(netAmount, vatAmount, taxRate) {
        if (netAmount < 0 || vatAmount < 0) return false;
        if (taxRate < 0 || taxRate > 1) return false;

        // 检查VAT是否与净销售额匹配（允许5%误差）
        const expectedVAT = netAmount * taxRate;
        const difference = Math.abs(vatAmount - expectedVAT);
        const tolerance = expectedVAT * 0.05;

        if (difference > tolerance) {
            return false;
        }

        return true;
    }

    /**
     * 批量验证
     */
    validateBatch(data) {
        const results = {
            valid: [],
            invalid: [],
            summary: {
                total: data.length,
                validCount: 0,
                invalidCount: 0,
                totalNet: 0,
                totalVAT: 0,
                issues: []
            }
        };

        for (const item of data) {
            const net = parseFloat(item.netAmount || item.net_amount || 0);
            const vat = parseFloat(item.vatAmount || item.vat_amount || 0);
            const rate = parseFloat(item.taxRate || this.getTaxRate(item.country));

            const isValid = this.validateVAT(net, vat, rate);

            if (isValid) {
                results.valid.push(item);
                results.summary.validCount++;
                results.summary.totalNet += net;
                results.summary.totalVAT += vat;
            } else {
                results.invalid.push({
                    ...item,
                    validationError: 'VAT计算不匹配'
                });
                results.summary.invalidCount++;
                results.summary.issues.push({
                    orderId: item.orderId || item.order_id,
                    reason: `净销售额 ${net} * 税率 ${rate} = ${net * rate}，实际VAT ${vat}`
                });
            }
        }

        return results;
    }

    /**
     * 计算VAT差额
     */
    calculateVariance(data) {
        const results = [];

        for (const item of data) {
            const net = parseFloat(item.netAmount || item.net_amount || 0);
            const vat = parseFloat(item.vatAmount || item.vat_amount || 0);
            const rate = parseFloat(item.taxRate || this.getTaxRate(item.country));

            const expectedVAT = net * rate;
            const variance = vat - expectedVAT;
            const variancePercent = expectedVAT > 0 ? (variance / expectedVAT) * 100 : 0;

            results.push({
                ...item,
                expectedVAT,
                variance,
                variancePercent: Math.round(variancePercent * 100) / 100,
                status: Math.abs(variancePercent) < 5 ? 'ok' : 'warning'
            });
        }

        return results;
    }

    /**
     * 获取税率建议
     */
    suggestRate(country, category = 'standard') {
        const rates = {
            standard: this.countryRates,
            reduced: {
                'FR': 0.10,
                'DE': 0.07,
                'IT': 0.10,
                'ES': 0.10,
                'GB': 0.05
            },
            superReduced: {
                'FR': 0.021,
                'DE': 0.00,
                'IT': 0.04,
                'ES': 0.04,
                'GB': 0.00
            }
        };

        const rateSet = rates[category] || rates.standard;
        return rateSet[country] || this.countryRates[country] || 0.20;
    }
}

module.exports = new TaxCalculator();