// backend/src/modules/fileProcessor/taxValidator.js

/**
 * 税务数据校验器
 * 支持多国进口VAT与销售VAT的校验和比对
 * 自动从 tax/ 目录加载所有国家配置
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../../utils/logger');

class TaxValidator {
    constructor() {
        // ===== 从 tax 目录动态加载所有国家配置 =====
        this.countryConfigs = this._loadCountryConfigs();
        this.taxCalculators = this._loadTaxCalculators();
        
        logger.info(`✅ 税务校验器已加载 ${Object.keys(this.countryConfigs).length} 个国家配置`);
    }

    /**
     * 从 tax 目录加载所有国家配置
     */
    _loadCountryConfigs() {
        const configs = {};
        const taxDir = path.join(__dirname, 'tax');
        
        try {
            const files = fs.readdirSync(taxDir);
            
            for (const file of files) {
                // 匹配 *_tax.js 文件
                if (file.endsWith('_tax.js') && file !== 'index.js') {
                    try {
                        const module = require(path.join(taxDir, file));
                        const countryCode = module.countryCode || file.replace('_tax.js', '').toUpperCase();
                        
                        // 提取税率
                        let vatRate = 0;
                        if (module.VAT_RATES && module.VAT_RATES.STANDARD !== undefined) {
                            vatRate = module.VAT_RATES.STANDARD;
                        } else if (module.GST_RATES && module.GST_RATES.STANDARD !== undefined) {
                            vatRate = module.GST_RATES.STANDARD;
                        } else if (module.IVA_RATES && module.IVA_RATES.STANDARD !== undefined) {
                            vatRate = module.IVA_RATES.STANDARD;
                        } else if (module.ICMS_RATES && module.ICMS_RATES.STANDARD !== undefined) {
                            vatRate = module.ICMS_RATES.STANDARD;
                        } else if (module.SST_RATES && module.SST_RATES.STANDARD !== undefined) {
                            vatRate = module.SST_RATES.STANDARD;
                        }

                        configs[countryCode] = {
                            vatRate: vatRate,
                            currency: module.currency || 'EUR',
                            name: module.countryName || countryCode,
                            type: this._getTaxType(countryCode),
                            taxSystem: module.taxSystem || 'VAT'
                        };
                        
                        logger.debug(`   → 加载国家: ${countryCode} (${module.countryName}) 税率: ${vatRate}%`);
                    } catch (err) {
                        logger.warn(`⚠️ 加载税务文件失败: ${file}`, err.message);
                    }
                }
            }
        } catch (err) {
            logger.error('❌ 加载税务配置失败:', err.message);
            // 降级到默认配置
            return this._getDefaultConfigs();
        }

        return configs;
    }

    /**
     * 加载税务计算器
     */
    _loadTaxCalculators() {
        const calculators = {};
        const taxDir = path.join(__dirname, 'tax');
        
        try {
            const files = fs.readdirSync(taxDir);
            for (const file of files) {
                if (file.endsWith('_tax.js') && file !== 'index.js') {
                    try {
                        const module = require(path.join(taxDir, file));
                        const countryCode = module.countryCode || file.replace('_tax.js', '').toUpperCase();
                        calculators[countryCode] = module;
                    } catch (err) {
                        // 忽略加载失败
                    }
                }
            }
        } catch (err) {
            // 忽略
        }
        
        return calculators;
    }

    /**
     * 获取税务类型
     */
    _getTaxType(countryCode) {
        const types = {
            'GB': 'standard',
            'DE': 'standard',
            'FR': 'standard',
            'IT': 'standard',
            'ES': 'standard',
            'NL': 'standard',
            'BE': 'standard',
            'PL': 'standard',
            'SE': 'standard',
            'DK': 'standard',
            'FI': 'standard',
            'IE': 'standard',
            'PT': 'standard',
            'AT': 'standard',
            'NO': 'standard',
            'CH': 'standard',
            'JP': 'standard',
            'KR': 'standard',
            'SG': 'gst',
            'AU': 'gst',
            'NZ': 'gst',
            'CA': 'gst',
            'US': 'no_vat',
            'MX': 'iva',
            'BR': 'icms',
            'IN': 'gst',
            'MY': 'sst',
            'TH': 'standard',
            'VN': 'standard',
            'ID': 'standard',
            'PH': 'standard',
            'ZA': 'standard',
            'TR': 'standard',
            'AE': 'standard',
            'RU': 'standard'
        };
        return types[countryCode] || 'standard';
    }

    /**
     * 默认配置（降级方案）
     */
    _getDefaultConfigs() {
        return {
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
            SG: { vatRate: 9, currency: 'SGD', name: '新加坡', type: 'gst' }
        };
    }

    /**
     * 获取国家配置
     */
    getCountryConfig(countryCode) {
        return this.countryConfigs[countryCode.toUpperCase()] || null;
    }

    /**
     * 获取所有支持的国家
     */
    getSupportedCountries() {
        return Object.keys(this.countryConfigs);
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
            const country = item.country || 'GB';
            const config = this.getCountryConfig(country);
            
            if (!item.vatNumber && config && config.type !== 'no_vat') {
                results.warnings.push(`[${country}] VAT 号缺失`);
            }

            if (item.totalImportVat <= 0 && config && config.type !== 'no_vat') {
                results.warnings.push(`[${country}] 进口 VAT 金额为 0 或负数`);
            }

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
        const countries = new Set();
        importData.forEach(item => countries.add(item.country || 'GB'));
        salesData.forEach(item => countries.add(item.country || 'GB'));

        for (const country of countries) {
            const config = this.getCountryConfig(country);
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
            const config = this.getCountryConfig(country);
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

        const allCountries = new Set();
        importData.forEach(item => allCountries.add(item.country || 'GB'));
        salesData.forEach(item => allCountries.add(item.country || 'GB'));

        for (const country of allCountries) {
            const config = this.getCountryConfig(country);
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

    /**
     * 计算指定国家的VAT
     */
    calculateVAT(countryCode, amount, rate) {
        const config = this.getCountryConfig(countryCode);
        if (!config) {
            throw new Error(`不支持的国家: ${countryCode}`);
        }
        
        const vatRate = rate || config.vatRate;
        const vatAmount = (amount * vatRate) / 100;
        
        return {
            netAmount: amount,
            vatAmount: vatAmount,
            grossAmount: amount + vatAmount,
            rate: vatRate,
            currency: config.currency,
            country: countryCode,
            countryName: config.name
        };
    }

    /**
     * 验证VAT号码格式
     */
    validateVATNumber(countryCode, vatNumber) {
        const calculator = this.taxCalculators[countryCode.toUpperCase()];
        if (calculator && calculator.validateVATNumber) {
            return calculator.validateVATNumber(vatNumber);
        }
        
        // 降级到基本格式验证
        const config = this.getCountryConfig(countryCode);
        if (!config) {
            return { valid: false, message: `不支持的国家: ${countryCode}` };
        }
        
        // 基础格式验证
        const patterns = {
            'GB': /^GB\d{9,12}$/,
            'DE': /^DE\d{9}$/,
            'FR': /^FR[A-Z0-9]{2}\d{9}$/,
            'IT': /^IT\d{11}$/,
            'ES': /^ES[A-Z0-9]\d{8}$/,
            'NL': /^NL[A-Z0-9]{9}[A-Z]{1,2}$/,
            'BE': /^BE\d{10}$/,
            'PL': /^PL\d{10}$/,
            'SE': /^SE\d{12}$/,
            'DK': /^DK\d{8}$/,
            'FI': /^FI\d{8}$/,
            'IE': /^IE\d{7}[A-Z]{1,2}$/,
            'PT': /^PT\d{9}$/,
            'AT': /^ATU\d{8}$/,
            'JP': /^[A-Z0-9]{12,13}$/,
            'SG': /^[A-Z]\d{8}[A-Z]$/,
            'AU': /^\d{11}$/,
            'CA': /^[A-Z0-9]{9}$/,
            'KR': /^[0-9]{10}$/,
            'MX': /^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
            'BR': /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
            'IN': /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/,
            'ZA': /^\d{10}$/,
            'TR': /^TR\d{10}$/,
            'AE': /^AE\d{15}$/,
            'NZ': /^NZ\d{8,9}$/,
            'MY': /^[A-Z]{2}\d{8}$/,
            'TH': /^\d{13}$/,
            'VN': /^\d{10}$/,
            'ID': /^\d{15}$/,
            'PH': /^\d{12}$/,
            'RU': /^\d{10}$/,
            'NO': /^NO\d{9}$/,
            'CH': /^CHE-?\d{3}\.\d{3}\.\d{3}$/
        };
        
        const pattern = patterns[countryCode.toUpperCase()];
        if (pattern && pattern.test(vatNumber)) {
            return { valid: true, message: 'VAT 号码格式有效' };
        }
        
        return { valid: false, message: 'VAT 号码格式无效' };
    }
}

module.exports = TaxValidator;