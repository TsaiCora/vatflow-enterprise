// backend/src/modules/fileProcessor/index.js
const detector = require('./detector');
const parser = require('./parser');
const mapper = require('./mapper');
const validator = require('./validator');
const { logger } = require('../../utils/logger');

// 导入税务相关解析器
const C79Parser = require('./parsers/c79');
const C88Parser = require('./parsers/c88');
const PVAParser = require('./parsers/pva');
const TaxValidator = require('./taxValidator');

class FileProcessor {
    constructor() {
        this.detector = detector;
        this.parser = parser;
        this.mapper = mapper;
        this.validator = validator;
        this.taxValidator = new TaxValidator();
        this.c79Parser = new C79Parser();
        this.c88Parser = new C88Parser();
        this.pvaParser = new PVAParser();
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
            if (platformInfo.platform === 'c79') {
                rawData = await this.c79Parser.parse(filePath);
            } else if (platformInfo.platform === 'c88') {
                rawData = await this.c88Parser.parse(filePath);
            } else if (platformInfo.platform === 'pva') {
                rawData = await this.pvaParser.parse(filePath);
            } else {
                rawData = await this.parser.parse(filePath, platformInfo);
            }

            logger.info(`   → 解析出 ${rawData.length} 条记录`);

            // 3. 字段映射
            const mappedData = await this.mapper.map(rawData, platformInfo);
            logger.info(`   → 映射完成`);

            // 4. 数据验证
            const validationResult = await this.validator.validate(mappedData);
            logger.info(`   → 验证完成: ${validationResult.valid.length} 条有效, ${validationResult.invalid.length} 条无效`);

            // 5. 税务校验（如果适用）
            let taxValidation = null;
            if (options.enableTaxValidation) {
                const salesData = await this._getSalesData();
                taxValidation = await this.taxValidator.validate(validationResult.valid, salesData);
                logger.info(`   → 税务校验完成: ${taxValidation.checks.length} 项检查`);
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
}

module.exports = new FileProcessor();