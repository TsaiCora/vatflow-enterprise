// backend/src/modules/fileProcessor/detector.js
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { logger } = require('../../utils/logger');

/**
 * 平台检测器
 * 通过文件名、扩展名、内容识别平台
 */
class PlatformDetector {
    constructor() {
        this.platformPatterns = [
            {
                platform: 'amazon',
                keywords: ['Amazon', 'Order ID', 'Item Total', 'Payment', 'Marketplace', 'ASIN'],
                formats: ['.csv', '.xlsx', '.txt']
            },
            {
                platform: 'ebay',
                keywords: ['eBay', 'Transaction ID', 'Item ID', 'Gross Amount', 'Net Amount', 'Sales Record'],
                formats: ['.csv', '.xlsx']
            },
            {
                platform: 'shopify',
                keywords: ['Shopify', 'Order #', 'Total Price', 'Tax', 'Shipping', 'Lineitem'],
                formats: ['.csv', '.xlsx', '.json']
            },
            {
                platform: 'wish',
                keywords: ['Wish', 'Merchant Order ID', 'Total Price', 'Commission', 'Tax Authority'],
                formats: ['.csv', '.xlsx']
            },
            {
                platform: 'aliexpress',
                keywords: ['AliExpress', 'Order ID', 'Product Name', 'Total Amount', 'Store Name'],
                formats: ['.csv', '.xlsx', '.json']
            },
            {
                platform: 'etsy',
                keywords: ['Etsy', 'Order #', 'Item Total', 'Sales Tax', 'Receipt'],
                formats: ['.csv', '.xlsx']
            },
            {
                platform: 'zalando',
                keywords: ['Zalando', 'Order Number', 'Product Price', 'VAT', 'Merchant'],
                formats: ['.csv', '.xlsx']
            },
            {
                platform: 'allegro',
                keywords: ['Allegro', 'orderId', 'totalPrice', 'shippingCountry'],
                formats: ['.csv', '.xlsx', '.json']
            }
        ];

        // 置信度阈值
        this.confidenceThreshold = 3;
    }

    /**
     * 检测平台
     */
    async detect(filePath) {
        const filename = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const content = this.readFileHeader(filePath);

        let bestMatch = {
            platform: 'unknown',
            confidence: 0,
            matches: []
        };

        for (const pattern of this.platformPatterns) {
            let score = 0;
            const matches = [];

            // 检查扩展名
            if (pattern.formats.includes(ext)) {
                score += 1;
                matches.push('format');
            }

            // 检查文件名
            const filenameLower = filename.toLowerCase();
            for (const keyword of pattern.keywords) {
                if (filenameLower.includes(keyword.toLowerCase())) {
                    score += 2;
                    matches.push(`filename:${keyword}`);
                    break;
                }
            }

            // 检查内容
            if (content) {
                const contentLower = content.toLowerCase();
                for (const keyword of pattern.keywords) {
                    if (contentLower.includes(keyword.toLowerCase())) {
                        score += 3;
                        matches.push(`content:${keyword}`);
                        break;
                    }
                }
            }

            if (score > bestMatch.confidence) {
                bestMatch = {
                    platform: pattern.platform,
                    confidence: score,
                    matches
                };
            }
        }

        // 如果置信度低于阈值，尝试从Excel表头二次识别
        if (bestMatch.confidence < this.confidenceThreshold && (ext === '.xlsx' || ext === '.xls')) {
            const headers = this.readExcelHeaders(filePath);
            if (headers && headers.length > 0) {
                const headerStr = headers.join(' ').toLowerCase();
                for (const pattern of this.platformPatterns) {
                    let score = 0;
                    for (const keyword of pattern.keywords) {
                        if (headerStr.includes(keyword.toLowerCase())) {
                            score += 4;
                        }
                    }
                    if (score > bestMatch.confidence) {
                        bestMatch = {
                            platform: pattern.platform,
                            confidence: score,
                            matches: ['excel_headers']
                        };
                    }
                }
            }
        }

        logger.debug(`平台检测结果: ${bestMatch.platform} (置信度: ${bestMatch.confidence})`);

        return {
            platform: bestMatch.platform,
            format: ext.replace('.', ''),
            confidence: bestMatch.confidence,
            matches: bestMatch.matches
        };
    }

    /**
     * 读取文件头部内容
     */
    readFileHeader(filePath) {
        try {
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.csv' || ext === '.txt') {
                const content = fs.readFileSync(filePath, 'utf-8');
                return content.slice(0, 2000);
            }
            if (ext === '.json') {
                const content = fs.readFileSync(filePath, 'utf-8');
                return content.slice(0, 2000);
            }
            return null;
        } catch (error) {
            logger.error(`读取文件头部失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 读取Excel表头
     */
    readExcelHeaders(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            if (data && data.length > 0) {
                return data[0].filter(h => h).map(h => String(h).trim());
            }
            return null;
        } catch (error) {
            logger.error(`读取Excel表头失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 获取所有支持的平台
     */
    getSupportedPlatforms() {
        return this.platformPatterns.map(p => p.platform);
    }

    /**
     * 获取平台关键词
     */
    getPlatformKeywords(platform) {
        const pattern = this.platformPatterns.find(p => p.platform === platform);
        return pattern ? pattern.keywords : [];
    }
}

module.exports = new PlatformDetector();