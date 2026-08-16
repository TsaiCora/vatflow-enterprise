// backend/src/modules/fileProcessor/index.js
const detector = require('./detector');
const parser = require('./parser');
const mapper = require('./mapper');
const validator = require('./validator');
const { logger } = require('../../utils/logger');

// 导入平台解析器
const platforms = require('./platforms');

// 导入税务计算器
const tax = require('./tax');

// 导入证书处理器
const certificates = require('./certificates');

// 导入税务校验器
const TaxValidator = require('./taxValidator');

class FileProcessor {
    constructor() {
        this.detector = detector;
        this.parser = parser;
        this.mapper = mapper;
        this.validator = validator;
        this.taxValidator = new TaxValidator();
        
        this.platforms = platforms;
        this.tax = tax;
        this.certificates = certificates;
        
        // ===== 证书处理器（包含 PVA） =====
        this.c79Parser = certificates.c79;
        this.c88Parser = certificates.c88;
        this.pvaParser = certificates.pva;  // ← 从 certificates 获取
    }

    /**
     * 获取平台解析器
     */
    getPlatformParser(platformName) {
        const parser = this.platforms[platformName.toLowerCase()];
        if (!parser) {
            logger.warn(`⚠️ 未找到平台解析器: ${platformName}`);
            return null;
        }
        return parser;
    }

    /**
     * 获取国家税务计算器
     */
    getTaxCalculator(countryCode) {
        const calculator = this.tax[countryCode.toUpperCase()];
        if (!calculator) {
            logger.warn(`⚠️ 未找到国家税务计算器: ${countryCode}`);
            return null;
        }
        return calculator;
    }

    /**
     * 完整处理流程
     */
    async process(filePath, options = {}) {
        try {
            logger.info(`📄 开始处理文件: ${filePath}`);

            const platformInfo = await this.detector.detect(filePath);
            logger.info(`   → 识别为: ${platformInfo.platform}`);

            let rawData;
            const platformName = platformInfo.platform.toLowerCase();
            
            // ===== 检查是否是证书类型（包括 PVA） =====
            if (platformName === 'c79') {
                rawData = await this.c79Parser.parse(filePath);
            } else if (platformName === 'c88') {
                rawData = await this.c88Parser.parse(filePath);
            } else if (platformName === 'pva') {
                rawData = await this.pvaParser.parse(filePath);  // ← 从 certificates 获取
            } else {
                const platformParser = this.getPlatformParser(platformName);
                if (platformParser) {
                    rawData = await platformParser.parse(filePath);
                } else {
                    rawData = await this.parser.parse(filePath, platformInfo);
                }
            }

            logger.info(`   → 解析出 ${rawData?.length || 0} 条记录`);

            const mappedData = await this.mapper.map(rawData, platformInfo);
            logger.info(`   → 映射完成`);

            const validationResult = await this.validator.validate(mappedData);
            logger.info(`   → 验证完成: ${validationResult.valid?.length || 0} 条有效`);

            let taxValidation = null;
            if (options.enableTaxValidation) {
                const salesData = await this._getSalesData();
                taxValidation = await this.taxValidator.validate(validationResult.valid, salesData);
            }

            return {
                success: true,
                platform: platformInfo.platform,
                rawData,
                mappedData,
                validationResult,
                taxValidation
            };

        } catch (error) {
            logger.error(`❌ 文件处理失败: ${error.message}`);
            throw error;
        }
    }

    async _getSalesData() {
        return [];
    }

    async processBatch(filePaths) {
        const results = [];
        for (const filePath of filePaths) {
            try {
                const result = await this.process(filePath);
                results.push({ filePath, success: true, ...result });
            } catch (error) {
                results.push({ filePath, success: false, error: error.message });
            }
        }
        return results;
    }

    getSupportedPlatforms() {
        return Object.keys(this.platforms);
    }

    getSupportedCountries() {
        return Object.keys(this.tax);
    }

    calculateTax(countryCode, amount, rate) {
        const calculator = this.getTaxCalculator(countryCode);
        if (!calculator) {
            throw new Error(`不支持的国家: ${countryCode}`);
        }
        return calculator.calculateVAT(amount, rate);
    }

    validateVATNumber(countryCode, vatNumber) {
        const calculator = this.getTaxCalculator(countryCode);
        if (!calculator) {
            throw new Error(`不支持的国家: ${countryCode}`);
        }
        return calculator.validateVATNumber(vatNumber);
    }
}

module.exports = new FileProcessor();