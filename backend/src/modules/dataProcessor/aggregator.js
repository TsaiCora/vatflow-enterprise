// backend/src/modules/dataProcessor/aggregator.js
const { logger } = require('../../utils/logger');

/**
 * 数据聚合器
 * 按国家、VAT号、期间等维度聚合交易数据
 */
class DataAggregator {
    constructor() {
        this.countryRates = require('../../config/country-rates.json');
    }

    /**
     * 聚合交易数据
     * @param {Array} transactions - 交易记录数组
     * @param {Object} options - 聚合选项
     * @returns {Object} 聚合结果
     */
    aggregate(transactions, options = {}) {
        const {
            groupBy = ['country', 'vatNumber', 'period'],
            includeDetails = true,
            includeSummary = true
        } = options;

        if (!transactions || transactions.length === 0) {
            return {
                groups: [],
                summary: {
                    totalTransactions: 0,
                    totalNet: 0,
                    totalVAT: 0,
                    totalGross: 0,
                    countries: []
                }
            };
        }

        // 按维度分组
        const groups = {};
        let skippedCount = 0;

        for (const tx of transactions) {
            // 确定申报期间
            const period = this.getPeriod(tx.orderDate || tx.order_date);

            // 获取国家
            let country = tx.country;
            if (!country && tx.vatNumber) {
                country = this.extractCountryFromVAT(tx.vatNumber);
            }
            if (!country) {
                skippedCount++;
                continue;
            }

            // 构建分组键
            const key = this.buildGroupKey({ country, vatNumber: tx.vatNumber, period }, groupBy);

            if (!groups[key]) {
                groups[key] = {
                    key,
                    country,
                    vatNumber: tx.vatNumber || 'N/A',
                    period,
                    transactions: [],
                    totalNet: 0,
                    totalVAT: 0,
                    totalGross: 0,
                    count: 0,
                    taxRate: this.getTaxRate(country)
                };
            }

            // 累加数据
            const net = parseFloat(tx.netAmount || tx.net_amount || 0);
            const vat = parseFloat(tx.vatAmount || tx.vat_amount || 0);
            const gross = parseFloat(tx.grossAmount || tx.gross_amount || tx.amount || net + vat);

            groups[key].transactions.push(tx);
            groups[key].totalNet += net;
            groups[key].totalVAT += vat;
            groups[key].totalGross += gross;
            groups[key].count++;
        }

        // 转换为数组
        let result = Object.values(groups);

        // 排序（按国家、期间）
        result.sort((a, b) => {
            if (a.country !== b.country) return a.country.localeCompare(b.country);
            if (a.period !== b.period) return a.period.localeCompare(b.period);
            return a.vatNumber.localeCompare(b.vatNumber);
        });

        // 计算汇总
        const summary = includeSummary ? this.calculateSummary(result) : null;

        // 如果不包含明细，移除交易列表
        if (!includeDetails) {
            result = result.map(group => {
                const { transactions, ...rest } = group;
                return { ...rest };
            });
        }

        if (skippedCount > 0) {
            logger.warn(`跳过 ${skippedCount} 条无国家标识的交易`);
        }

        return {
            groups: result,
            summary,
            meta: {
                totalGroups: result.length,
                totalTransactions: transactions.length,
                skippedCount,
                groupBy
            }
        };
    }

    /**
     * 获取申报期间
     */
    getPeriod(dateStr) {
        if (!dateStr) return this.getDefaultPeriod();
        
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${year}-${month}`;
            }
        } catch (e) {
            // 忽略
        }

        // 尝试解析常见格式
        const match = String(dateStr).match(/(\d{4})[-/](\d{2})/);
        if (match) {
            return `${match[1]}-${match[2]}`;
        }

        return this.getDefaultPeriod();
    }

    /**
     * 获取默认期间（当前月）
     */
    getDefaultPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * 从VAT号提取国家代码
     */
    extractCountryFromVAT(vatNumber) {
        if (!vatNumber) return null;
        const vat = String(vatNumber).replace(/[^A-Z0-9]/g, '').toUpperCase();
        const countryCodes = Object.keys(this.countryRates);
        for (const code of countryCodes) {
            if (vat.startsWith(code)) return code;
        }
        return null;
    }

    /**
     * 构建分组键
     */
    buildGroupKey(data, groupBy) {
        const parts = [];
        if (groupBy.includes('country')) parts.push(data.country);
        if (groupBy.includes('vatNumber')) parts.push(data.vatNumber || 'N/A');
        if (groupBy.includes('period')) parts.push(data.period);
        return parts.join('|');
    }

    /**
     * 获取税率
     */
    getTaxRate(country) {
        return this.countryRates[country] || 0.20;
    }

    /**
     * 计算汇总
     */
    calculateSummary(groups) {
        const summary = {
            totalTransactions: 0,
            totalNet: 0,
            totalVAT: 0,
            totalGross: 0,
            countries: {},
            periods: {}
        };

        for (const group of groups) {
            summary.totalTransactions += group.count;
            summary.totalNet += group.totalNet;
            summary.totalVAT += group.totalVAT;
            summary.totalGross += group.totalGross;

            if (!summary.countries[group.country]) {
                summary.countries[group.country] = {
                    transactions: 0,
                    totalNet: 0,
                    totalVAT: 0
                };
            }
            summary.countries[group.country].transactions += group.count;
            summary.countries[group.country].totalNet += group.totalNet;
            summary.countries[group.country].totalVAT += group.totalVAT;

            if (!summary.periods[group.period]) {
                summary.periods[group.period] = {
                    transactions: 0,
                    totalNet: 0,
                    totalVAT: 0
                };
            }
            summary.periods[group.period].transactions += group.count;
            summary.periods[group.period].totalNet += group.totalNet;
            summary.periods[group.period].totalVAT += group.totalVAT;
        }

        return summary;
    }
}

module.exports = new DataAggregator();