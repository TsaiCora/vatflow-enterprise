// backend/src/modules/dataProcessor/outputGenerator.js
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { logger } = require('../../utils/logger');

/**
 * 报告生成器
 * 生成多种格式的申报报告
 */
class OutputGenerator {
    constructor() {
        this.outputDir = './data/output/';
        // 确保输出目录存在
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * 生成报告
     * @param {Object} data - 数据
     * @param {Object} options - 选项
     * @returns {Object} 生成的文件信息
     */
    generate(data, options = {}) {
        const {
            format = 'xlsx',
            includeCharts = true,
            includeSummary = true,
            includeDetails = true,
            fileName = null,
            outputPath = null
        } = options;

        const timestamp = Date.now();
        const baseName = fileName || `vat-report-${timestamp}`;
        const outputDir = outputPath || this.outputDir;

        const results = {
            files: [],
            formats: []
        };

        // 支持多种格式
        const formats = Array.isArray(format) ? format : [format];

        for (const fmt of formats) {
            let filePath;
            let dataBuffer;

            switch (fmt) {
                case 'xlsx':
                    filePath = path.join(outputDir, `${baseName}.xlsx`);
                    dataBuffer = this.generateExcel(data, { includeCharts, includeSummary, includeDetails });
                    break;
                case 'csv':
                    filePath = path.join(outputDir, `${baseName}.csv`);
                    dataBuffer = this.generateCSV(data);
                    break;
                case 'json':
                    filePath = path.join(outputDir, `${baseName}.json`);
                    dataBuffer = this.generateJSON(data);
                    break;
                case 'pdf':
                    filePath = path.join(outputDir, `${baseName}.pdf`);
                    dataBuffer = this.generatePDF(data);
                    break;
                default:
                    logger.warn(`不支持的报告格式: ${fmt}`);
                    continue;
            }

            fs.writeFileSync(filePath, dataBuffer);
            results.files.push(filePath);
            results.formats.push(fmt);
            logger.info(`📄 报告已生成: ${filePath}`);
        }

        return results;
    }

    /**
     * 生成 Excel 报告
     */
    generateExcel(data, options = {}) {
        const { includeCharts = true, includeSummary = true, includeDetails = true } = options;

        const workbook = XLSX.utils.book_new();

        // 汇总页
        if (includeSummary && data.summary) {
            const summaryData = [
                ['VAT申报汇总报告'],
                [''],
                ['指标', '数值'],
                ['总交易数', data.summary.totalTransactions || 0],
                ['净销售额总额', data.summary.totalNet || 0],
                ['VAT总额', data.summary.totalVAT || 0],
                ['含税总额', data.summary.totalGross || 0],
                ['涉及国家', Object.keys(data.summary.countries || {}).join(', ')],
                ['申报期间', data.groups?.[0]?.period || 'N/A']
            ];
            const ws = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, ws, '汇总');
        }

        // 明细数据
        if (includeDetails && data.groups) {
            const detailData = data.groups.map(group => ({
                '国家': group.country,
                'VAT号': group.vatNumber,
                '申报期间': group.period,
                '交易笔数': group.count || 0,
                '净销售额': group.totalNet || 0,
                'VAT税额': group.totalVAT || 0,
                '含税总额': group.totalGross || 0,
                '税率': `${((group.taxRate || 0.20) * 100).toFixed(1)}%`
            }));
            const ws = XLSX.utils.json_to_sheet(detailData);
            XLSX.utils.book_append_sheet(workbook, ws, '明细');
        }

        // 国家汇总
        if (data.summary?.countries) {
            const countryData = Object.entries(data.summary.countries).map(([country, info]) => ({
                '国家': country,
                '交易笔数': info.transactions || 0,
                '净销售额': info.totalNet || 0,
                'VAT税额': info.totalVAT || 0
            }));
            const ws = XLSX.utils.json_to_sheet(countryData);
            XLSX.utils.book_append_sheet(workbook, ws, '国家汇总');
        }

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    /**
     * 生成 CSV 报告
     */
    generateCSV(data) {
        if (!data.groups || data.groups.length === 0) {
            return '国家,VAT号,申报期间,交易笔数,净销售额,VAT税额,含税总额,税率\n';
        }

        const headers = ['国家', 'VAT号', '申报期间', '交易笔数', '净销售额', 'VAT税额', '含税总额', '税率'];
        const rows = data.groups.map(group => [
            group.country,
            group.vatNumber || 'N/A',
            group.period || 'N/A',
            group.count || 0,
            (group.totalNet || 0).toFixed(2),
            (group.totalVAT || 0).toFixed(2),
            (group.totalGross || 0).toFixed(2),
            `${((group.taxRate || 0.20) * 100).toFixed(1)}%`
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }

    /**
     * 生成 JSON 报告
     */
    generateJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    /**
     * 生成 PDF 报告（占位）
     */
    generatePDF(data) {
        // 实际项目中使用 pdfkit 或 puppeteer
        // 这里返回一个简单的文本文件
        logger.warn('PDF生成功能需要配置，当前返回文本文件');
        return Buffer.from(JSON.stringify(data, null, 2));
    }

    /**
     * 批量生成报告
     */
    async generateBatch(datasets, options = {}) {
        const results = [];

        for (const [name, data] of Object.entries(datasets)) {
            const result = this.generate(data, {
                ...options,
                fileName: name
            });
            results.push({
                name,
                ...result
            });
        }

        return results;
    }

    /**
     * 清理旧报告
     */
    cleanOldReports(days = 30) {
        const files = fs.readdirSync(this.outputDir);
        const now = Date.now();
        const threshold = days * 24 * 60 * 60 * 1000;
        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(this.outputDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > threshold) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        }

        logger.info(`🧹 清理了 ${deletedCount} 个旧报告文件`);
        return deletedCount;
    }

    /**
     * 获取输出目录
     */
    getOutputDir() {
        return this.outputDir;
    }

    /**
     * 设置输出目录
     */
    setOutputDir(dir) {
        this.outputDir = dir;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}

module.exports = new OutputGenerator();