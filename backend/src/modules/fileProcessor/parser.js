// backend/src/modules/fileProcessor/parser.js
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { logger } = require('../../utils/logger');

/**
 * 文件解析器
 * 支持 CSV、Excel、JSON、TXT 格式
 */
class FileParser {
    constructor() {
        // 平台特定解析器映射
        this.platformParsers = {
            amazon: this.parseAmazon,
            ebay: this.parseEbay,
            shopify: this.parseShopify,
            wish: this.parseWish,
            aliexpress: this.parseAliexpress,
            etsy: this.parseEtsy,
            zalando: this.parseZalando,
            allegro: this.parseAllegro
        };
    }

    /**
     * 解析文件
     */
    async parse(filePath, platformInfo) {
        const ext = path.extname(filePath).toLowerCase();
        let rawData = [];

        // 根据扩展名解析
        switch (ext) {
            case '.csv':
                rawData = await this.parseCSV(filePath);
                break;
            case '.xlsx':
            case '.xls':
                rawData = this.parseExcel(filePath);
                break;
            case '.json':
                rawData = this.parseJSON(filePath);
                break;
            case '.txt':
                rawData = await this.parseTXT(filePath);
                break;
            default:
                throw new Error(`不支持的文件格式: ${ext}`);
        }

        // 应用平台特定解析
        const platform = platformInfo.platform;
        if (platform !== 'unknown' && this.platformParsers[platform]) {
            rawData = this.platformParsers[platform](rawData);
        }

        return rawData;
    }

    /**
     * 解析 CSV
     */
    parseCSV(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            let delimiter = ',';

            // 检测分隔符
            try {
                const sample = fs.readFileSync(filePath, 'utf-8').slice(0, 500);
                if (sample.includes('\t')) delimiter = '\t';
                else if (sample.includes(';')) delimiter = ';';
                else if (sample.includes(',')) delimiter = ',';
            } catch (e) {
                // 忽略
            }

            fs.createReadStream(filePath, { encoding: 'utf-8' })
                .pipe(csv({
                    separator: delimiter,
                    skipLines: 0,
                    trim: true,
                    mapHeaders: ({ header }) => header.trim()
                }))
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    }

    /**
     * 解析 Excel
     */
    parseExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        const allData = [];

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, {
                defval: '',
                raw: false,
                header: 1
            });

            // 检测是否有表头
            if (data.length > 0) {
                const headers = data[0].map(h => String(h).trim());
                const rows = data.slice(1);

                for (const row of rows) {
                    const obj = {};
                    headers.forEach((h, i) => {
                        obj[h] = row[i] !== undefined ? String(row[i]).trim() : '';
                    });
                    allData.push(obj);
                }
            }
        }

        return allData;
    }

    /**
     * 解析 JSON
     */
    parseJSON(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [data];
    }

    /**
     * 解析 TXT (制表符分隔)
     */
    parseTXT(filePath) {
        return new Promise((resolve, reject) => {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                resolve([]);
                return;
            }

            // 检测是否为制表符分隔
            const firstLine = lines[0];
            if (firstLine.includes('\t')) {
                const headers = firstLine.split('\t').map(h => h.trim());
                const results = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split('\t').map(v => v.trim());
                    const obj = {};
                    headers.forEach((h, idx) => {
                        obj[h] = values[idx] || '';
                    });
                    results.push(obj);
                }

                resolve(results);
            } else {
                resolve([]);
            }
        });
    }

    /**
     * Amazon 解析器
     */
    parseAmazon(data) {
        return data.map(row => {
            const cleanRow = {};
            for (const [key, value] of Object.entries(row)) {
                let newKey = key.replace(/^[0-9]+\.\s*/, '').replace(/\(.*?\)/g, '').trim();
                cleanRow[newKey] = value;
            }
            return cleanRow;
        });
    }

    /**
     * eBay 解析器
     */
    parseEbay(data) {
        return data.map(row => {
            const cleanRow = {};
            for (const [key, value] of Object.entries(row)) {
                let newKey = key.replace(/_[0-9]+$/, '').trim();
                cleanRow[newKey] = value;
            }
            return cleanRow;
        });
    }

    /**
     * Shopify 解析器
     */
    parseShopify(data) {
        const results = [];
        for (const row of data) {
            const cleanRow = {};
            for (const [key, value] of Object.entries(row)) {
                let newKey = key.trim();
                // 处理Shopify的多税种字段
                if (newKey.includes('Tax ') && newKey.includes(' Value')) {
                    newKey = 'tax_value';
                }
                if (newKey.includes('Tax ') && newKey.includes(' Name')) {
                    newKey = 'tax_name';
                }
                cleanRow[newKey] = value;
            }
            results.push(cleanRow);
        }
        return results;
    }

    /**
     * Wish 解析器
     */
    parseWish(data) {
        return data.map(row => {
            const cleanRow = {};
            for (const [key, value] of Object.entries(row)) {
                let newKey = key.trim();
                // 保留Wish的特殊字段
                if (newKey.includes('Tax Authority')) {
                    newKey = 'tax_authority';
                }
                if (newKey.includes('Taxable Basis')) {
                    newKey = 'taxable_basis';
                }
                cleanRow[newKey] = value;
            }
            return cleanRow;
        });
    }

    /**
     * AliExpress 解析器
     */
    parseAliexpress(data) {
        return data.map(row => {
            const cleanRow = {};
            for (const [key, value] of Object.entries(row)) {
                let newKey = key.trim();
                if (newKey.includes('Price Info')) {
                    newKey = 'total_amount';
                }
                cleanRow[newKey] = value;
            }
            return cleanRow;
        });
    }

    /**
     * Etsy 解析器
     */
    parseEtsy(data) {
        return data.map(row => {
            const cleanRow = {};
            for (const [key, value] of Object.entries(row)) {
                let newKey = key.trim();
                if (newKey.includes('Sales Tax')) {
                    newKey = 'vat_amount';
                }
                cleanRow[newKey] = value;
            }
            return cleanRow;
        });
    }

    /**
     * Zalando 解析器
     */
    parseZalando(data) {
        return data.map(row => {
            const cleanRow = {};
            for (const [key, value] of Object.entries(row)) {
                let newKey = key.trim();
                cleanRow[newKey] = value;
            }
            return cleanRow;
        });
    }

    /**
     * Allegro 解析器
     */
    parseAllegro(data) {
        return data.map(row => {
            const cleanRow = {};
            for (const [key, value] of Object.entries(row)) {
                let newKey = key.trim();
                cleanRow[newKey] = value;
            }
            return cleanRow;
        });
    }
}

module.exports = new FileParser();