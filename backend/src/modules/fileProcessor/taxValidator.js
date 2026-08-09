// backend/src/modules/fileProcessor/taxValidator.js

/**
 * 税务数据校验器
 * 支持多国进口VAT与销售VAT的校验和比对
 */
class TaxValidator {
    constructor() {
        this.countryConfigs = {
            GB: { vatRate: 20, currency: 'GBP', name: '英国', type: 'standard' },
            DE: { vatRate: 19, currency: 'EUR', name: '德国', type: 'standard' },
            FR: { vatRate: 20, currency: 'EUR', name: '法国', type: 'standard' },
            IT: { vatRate: 22, currency: 'EUR', name: '意大利', type: 'standard' },
            ES: { vatRate: 21, currency: 'EUR', name: '西班牙', type: 'standard' },
            NL: { vatRate: 21, currency: 'EUR', name: '荷兰', type: 'standard' },
            BE: { vatRate: 21, currency: 'EUR', name: '比利时', type: 'standard' },
            PL: { vatRate: 23, currency: 'PLN', name: '波兰', type: 'standard' },
            SE: { vatRate: 25, currency: 'SEK', name: '瑞典', type: 'standard' },
            JP: { vatRate: 10, currency: 'JPY', name: '日本', type: 'standard' },
            US: { vatRate: 0, currency: 'USD', name: '美国', type: 'no_vat' },
            CA: { vatRate: 5, currency: 'CAD', name: '加拿大', type: 'gst' },
            AU: { vatRate: 10, currency: 'AUD', name: '澳大利亚', type: 'gst' },
            SG: { vatRate: 7, currency: 'SGD', name: '新加坡', type: 'gst' }
        };
    }

    /**
     * 完整校验流程
     */
    validate(importData, salesData, options = {}) {
        const results = {
            valid: true,
            checks: [],
            errors: [],
            warnings: [],
            summary: {},
            countryReports: {}
        };

        // 1. 校验进口数据完整性
        this._validateImportData(importData, results);

        // 2. 校验销售数据
        this._validateSalesData(salesData, results);

        // 3. 校验数据一致性
        this._validateConsistency(importData, salesData, results);

        // 4. 校验 VAT 计算正确性
        this._validateVATCalculation(salesData, results);

        // 5. 按国家汇总
        const countrySummary = this._summarizeByCountry(importData, salesData);
        results.countryReports = countrySummary;

        // 6. 生成校验摘要
        results.summary = this._generateSummary(importData, salesData, countrySummary);

        results.valid = results.errors.length === 0;

        return results;
    }

    /**
     * 1. 校验进口数据
     */
    _validateImportData(data, results) {
        if (!data || data.length === 0) {
            results.errors.push('缺少进口数据，无法进行税务抵扣');
            return;
        }

        for (const item of data) {
            // 检查 VAT 号
            const country = item.country || 'GB';
            const config = this.countryConfigs[country];
            if (!item.vatNumber && config && config.type !== 'no_vat') {
                results.warnings.push(`[${country}] VAT 号缺失`);
            }

            // 检查进口 VAT 金额
            if (item.totalImportVat <= 0 && config && config.type !== 'no_vat') {
                results.warnings.push(`[${country}] 进口 VAT 金额为 0 或负数`);
            }

            // 检查期间
            if (!item.period || !this._isValidPeriod(item.period)) {
                results.warnings.push(`[${country}] 期间格式不正确: ${item.period}`);
            }
        }
    }

    /**
     * 2. 校验销售数据
     */
    _validateSalesData(data, results) {
        if (!data || data.length === 0) {
            results.warnings.push('缺少销售数据');
            return;
        }

        for (const item of data) {
            if (!item.orderId) {
                results.warnings.push('订单号缺失');
            }
            if (item.vatAmount < 0) {
                results.errors.push(`订单 ${item.orderId} VAT 金额为负数`);
            }
        }
    }

    /**
     * 3. 校验数据一致性
     */
    _validateConsistency(importData, salesData, results) {
        // 按国家分别计算
        const countries = new Set();
        importData.forEach(item => countries.add(item.country || 'GB'));
        salesData.forEach(item => countries.add(item.country || 'GB'));

        for (const country of countries) {
            const config = this.countryConfigs[country];
            if (!config) continue;

            const importVat = importData
                .filter(item => (item.country || 'GB') === country)
                .reduce((sum, item) => sum + (item.totalImportVat || 0), 0);

            const salesVat = salesData
                .filter(item => (item.country || 'GB') === country)
                .reduce((sum, item) => sum + (item.vatAmount || 0), 0);

            const payableVAT = salesVat - importVat;

            results.checks.push({
                name: `${config.name} (${country}) VAT 抵扣`,
                country,
                totalSalesVat: salesVat,
                totalImportVat: importVat,
                payableVAT: payableVAT,
                status: payableVAT >= 0 ? 'ok' : 'warning'
            });

            if (payableVAT < 0) {
                results.warnings.push(`[${country}] 应缴 VAT 为负数 (${payableVAT.toFixed(2)})，可能存在退税`);
            }
        }
    }

    /**
     * 4. 校验 VAT 计算正确性
     */
    _validateVATCalculation(salesData, results) {
        for (const item of salesData) {
            if (!item.totalAmount || !item.vatAmount) continue;
            const country = item.country || 'GB';
            const config = this.countryConfigs[country];
            if (!config || config.type === 'no_vat') continue;

            const rate = config.vatRate / 100;
            const calculatedVat = item.totalAmount * rate / (1 + rate);
            const difference = Math.abs(item.vatAmount - calculatedVat);

            if (difference > 0.01) {
                results.warnings.push(
                    `[${country}] 订单 ${item.orderId} VAT 计算偏差: 实际 ${item.vatAmount}, 应为约 ${calculatedVat.toFixed(2)}`
                );
            }
        }
    }

    /**
     * 按国家汇总
     */
    _summarizeByCountry(importData, salesData) {
        const countries = {};

        // 合并所有国家
        const allCountries = new Set();
        importData.forEach(item => allCountries.add(item.country || 'GB'));
        salesData.forEach(item => allCountries.add(item.country || 'GB'));

        for (const country of allCountries) {
            const config = this.countryConfigs[country];
            const importItems = importData.filter(item => (item.country || 'GB') === country);
            const salesItems = salesData.filter(item => (item.country || 'GB') === country);

            const totalImportVat = importItems.reduce((sum, item) => sum + (item.totalImportVat || 0), 0);
            const totalCustomsValue = importItems.reduce((sum, item) => sum + (item.totalCustomsValue || 0), 0);
            const totalSalesVat = salesItems.reduce((sum, item) => sum + (item.vatAmount || 0), 0);
            const totalSalesAmount = salesItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

            countries[country] = {
                country,
                countryName: config ? config.name : country,
                vatRate: config ? config.vatRate : 0,
                currency: config ? config.currency : 'EUR',
                totalImportVat,
                totalCustomsValue,
                totalSalesVat,
                totalSalesAmount,
                importEntryCount: importItems.length,
                salesCount: salesItems.length,
                payableVAT: totalSalesVat - totalImportVat,
                status: (totalSalesVat - totalImportVat) >= 0 ? '正常' : '待退税'
            };
        }

        return countries;
    }

    /**
     * 生成校验摘要
     */
    _generateSummary(importData, salesData, countrySummary) {
        const totalImportVat = Object.values(countrySummary).reduce((sum, c) => sum + c.totalImportVat, 0);
        const totalSalesVat = Object.values(countrySummary).reduce((sum, c) => sum + c.totalSalesVat, 0);
        const totalPayable = totalSalesVat - totalImportVat;

        return {
            totalSalesVat: totalSalesVat.toFixed(2),
            totalImportVat: totalImportVat.toFixed(2),
            totalPayableVAT: totalPayable.toFixed(2),
            totalImportEntries: importData.length,
            totalSalesCount: salesData.length,
            countryCount: Object.keys(countrySummary).length,
            status: totalPayable >= 0 ? '正常申报' : '待退税'
        };
    }

    /**
     * 检查期间格式 (YYYY-MM)
     */
    _isValidPeriod(period) {
        return /^\d{4}-\d{2}$/.test(period);
    }
}

module.exports = TaxValidator;