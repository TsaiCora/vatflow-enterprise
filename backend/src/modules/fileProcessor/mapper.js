// backend/src/modules/fileProcessor/mapper.js
const { logger } = require('../../utils/logger');
const platformMapping = require('../../config/platforms.json');

/**
 * 字段映射器
 * 将各平台字段映射为标准字段
 */
class FieldMapper {
    constructor() {
        this.mappings = platformMapping;
    }

    /**
     * 映射字段
     */
    async map(data, platformInfo) {
        const platform = platformInfo.platform || 'default';
        const mapping = this.mappings[platform] || this.mappings.default;

        const mappedData = [];

        for (const row of data) {
            const mappedRow = {};

            // 应用字段映射
            for (const [standardField, sourceFields] of Object.entries(mapping)) {
                const fields = Array.isArray(sourceFields) ? sourceFields : [sourceFields];
                let found = false;

                for (const field of fields) {
                    const value = row[field];
                    if (value !== undefined && value !== null && value !== '') {
                        mappedRow[standardField] = this.cleanFieldValue(field, value);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    mappedRow[standardField] = null;
                }
            }

            // 添加原始数据（可选）
            mappedRow._raw = row;
            mappedRow._platform = platform;

            mappedData.push(mappedRow);
        }

        // 过滤掉完全为空的行
        const filtered = mappedData.filter(row => {
            const standardFields = Object.keys(this.mappings[platform] || this.mappings.default);
            return standardFields.some(field => {
                const value = row[field];
                return value !== null && value !== undefined && value !== '';
            });
        });

        logger.debug(`字段映射完成: ${mappedData.length} -> ${filtered.length} 条有效记录`);

        return filtered;
    }

    /**
     * 清洗字段值
     */
    cleanFieldValue(fieldName, value) {
        if (value === null || value === undefined) return null;

        const strValue = String(value).trim();

        // 数字字段清洗
        const numericFields = ['amount', 'net_amount', 'vat_amount', 'total', 'price', 'tax'];
        if (numericFields.some(f => fieldName.toLowerCase().includes(f))) {
            const cleaned = strValue.replace(/[€$£,]/g, '').replace(/\(/, '-').replace(/\)/, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
        }

        // 日期字段标准化
        const dateFields = ['date', 'order_date', 'transaction_date', 'created_at', 'purchase_date'];
        if (dateFields.some(f => fieldName.toLowerCase().includes(f))) {
            const parsed = new Date(strValue);
            if (!isNaN(parsed)) {
                return parsed.toISOString().split('T')[0];
            }
            const match = strValue.match(/(\d{4}-\d{2}-\d{2})/);
            if (match) return match[1];
            return strValue;
        }

        // 国家代码标准化
        const countryFields = ['country', 'shipping_country', 'recipient_country', 'buyer_country'];
        if (countryFields.some(f => fieldName.toLowerCase().includes(f))) {
            const countryMap = {
                'United Kingdom': 'GB',
                'Great Britain': 'GB',
                'UK': 'GB',
                'England': 'GB',
                'Deutschland': 'DE',
                'Germany': 'DE',
                'France': 'FR',
                'Italy': 'IT',
                'Spain': 'ES',
                'España': 'ES',
                'Netherlands': 'NL',
                'Portugal': 'PT',
                'Belgium': 'BE',
                'Austria': 'AT',
                'Sweden': 'SE',
                'Denmark': 'DK',
                'Finland': 'FI',
                'Ireland': 'IE',
                'Poland': 'PL',
                'Greece': 'GR',
                'Hungary': 'HU',
                'Czechia': 'CZ',
                'Czech Republic': 'CZ',
                'Slovakia': 'SK',
                'Slovenia': 'SI',
                'Croatia': 'HR',
                'Romania': 'RO',
                'Bulgaria': 'BG',
                'Lithuania': 'LT',
                'Latvia': 'LV',
                'Estonia': 'EE',
                'Luxembourg': 'LU',
                'Malta': 'MT',
                'Cyprus': 'CY'
            };
            return countryMap[strValue] || strValue.toUpperCase();
        }

        return strValue;
    }

    /**
     * 获取映射配置
     */
    getMapping(platform) {
        return this.mappings[platform] || this.mappings.default;
    }

    /**
     * 更新映射配置
     */
    updateMapping(platform, mapping) {
        this.mappings[platform] = {
            ...this.mappings[platform],
            ...mapping
        };
        logger.info(`映射配置已更新: ${platform}`);
        return this.mappings[platform];
    }

    /**
     * 获取所有映射配置
     */
    getAllMappings() {
        return this.mappings;
    }
}

module.exports = new FieldMapper();