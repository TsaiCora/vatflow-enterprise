// backend/src/modules/fileProcessor/index.js
const detector = require('./detector');
const parser = require('./parser');
const mapper = require('./mapper');
const validator = require('./validator');
const { logger } = require('../../utils/logger');

// ===== 导入平台解析器 =====
const platforms = require('./platforms');

// ===== 导入税务计算器 =====
const tax = require('./tax');

// ===== 导入证书处理器 =====
const certificates = require('./certificates');

// ===== 导入税务校验器 =====
const TaxValidator = require('./taxValidator');

class FileProcessor {
    constructor() {
        this.detector = detector;
        this.parser = parser;
        this.mapper = mapper;
        this.validator = validator;
        this.taxValidator = new TaxValidator();
        
        // ===== 平台解析器 =====
        this.platforms = platforms;
        
        // ===== 税务计算器 =====
        this.tax = tax;
        
        // ===== 证书处理器 =====
        this.certificates = certificates;
        
        // ===== 兼容旧代码的引用 =====
        this.c79Parser = certificates.c79 || require('./certificates/c79');
        this.c88Parser = certificates.c88 || require('./certificates/c88');
        this.pvaParser = platforms.pva || require('./platforms/pva');
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
     * 完整处理流程（含税务校验）
     */
    async process(filePath, options = {}) {
        try {
            logger.info(`📄 开始处理文件: ${filePath}`);

            // 1. 检测平台
            const platformInfo = await this.detector.detect(filePath);
            logger.info(`   → 识别为: ${platformInfo.platform}`);

            // 2. 根据平台选择解析器
            let rawData;
            const platformName = platformInfo.platform.toLowerCase();
            
            // 检查是否是证书类型
            if (platformName === 'c79') {
                rawData = await this.certificates.c79.parse(filePath);
            } else if (platformName === 'c88') {
                rawData = await this.certificates.c88.parse(filePath);
            } else if (platformName === 'pva') {
                rawData = await this.platforms.pva.parse(filePath);
            } else {
                // 使用平台解析器
                const platformParser = this.getPlatformParser(platformName);
                if (platformParser) {
                    rawData = await platformParser.parse(filePath);
                } else {
                    // 降级到通用解析器
                    rawData = await this.parser.parse(filePath, platformInfo);
                }
            }

            logger.info(`   → 解析出 ${rawData?.length || 0} 条记录`);

            // 3. 字段映射
            const mappedData = await this.mapper.map(rawData, platformInfo);
            logger.info(`   → 映射完成`);

            // 4. 数据验证
            const validationResult = await this.validator.validate(mappedData);
            logger.info(`   → 验证完成: ${validationResult.valid?.length || 0} 条有效, ${validationResult.invalid?.length || 0} 条无效`);

            // 5. 税务校验（如果适用）
            let taxValidation = null;
            if (options.enableTaxValidation) {
                const salesData = await this._getSalesData();
                taxValidation = await this.taxValidator.validate(validationResult.valid, salesData);
                logger.info(`   → 税务校验完成: ${taxValidation.checks?.length || 0} 项检查`);
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

    /**
     * 获取销售数据（用于税务校验）
     */
    async _getSalesData() {
        // 从数据库获取销售数据
        return [];
    }

    /**
     * 批量处理
     */
    async processBatch(filePaths) {
        const results = [];

        for (const filePath of filePaths) {
            try {
                const result = await this.process(filePath);
                results.push({
                    filePath,
                    success: true,
                    ...result
                });
            } catch (error) {
                results.push({
                    filePath,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 获取所有支持的平台列表
     */
    getSupportedPlatforms() {
        return Object.keys(this.platforms);
    }

    /**
     * 获取所有支持的国家列表
     */
    getSupportedCountries() {
        return Object.keys(this.tax);
    }

    /**
     * 计算某国的税务
     */
    calculateTax(countryCode, amount, rate) {
        const calculator = this.getTaxCalculator(countryCode);
        if (!calculator) {
            throw new Error(`不支持的国家: ${countryCode}`);
        }
        return calculator.calculateVAT(amount, rate);
    }

    /**
     * 验证某国的VAT号码
     */
    validateVATNumber(countryCode, vatNumber) {
        const calculator = this.getTaxCalculator(countryCode);
        if (!calculator) {
            throw new Error(`不支持的国家: ${countryCode}`);
        }
        return calculator.validateVATNumber(vatNumber);
    }
}

// ===== 导出模块 =====
module.exports = new FileProcessor();

// ===== 额外导出各子模块 =====
module.exports.platforms = platforms;
module.exports.tax = tax;
module.exports.certificates = certificates;