// backend/src/modules/fileProcessor/validator.js
const { logger } = require('../../utils/logger');

/**
 * 数据验证器
 * 验证交易数据的完整性和正确性
 */
class DataValidator {
    /**
     * 验证数据
     */
    async validate(data) {
        const valid = [];
        const invalid = [];
        const issues = [];

        for (const [index, row] of data.entries()) {
            const result = this.validateRow(row, index);
            if (result.valid) {
                valid.push(result.row);
            } else {
                invalid.push(result);
                issues.push(...result.errors);
            }
        }

        return {
            valid,
            invalid,
            issues,
            summary: {
                total: data.length,
                validCount: valid.length,
                invalidCount: invalid.length,
                issueCount: issues.length
            }
        };
    }

    /**
     * 验证单行
     */
    validateRow(row, index) {
        const errors = [];
        const warnings = [];
        const fixed = { ...row };

        // 1. 检查必填字段
        const requiredFields = ['order_id', 'country'];
        for (const field of requiredFields) {
            if (!row[field] || row[field] === '') {
                errors.push({
                    field,
                    message: `${field} 为必填字段`,
                    value: row[field]
                });
            }
        }

        // 2. 验证国家代码
        if (row.country) {
            const country = row.country.toUpperCase();
            if (country.length !== 2) {
                errors.push({
                    field: 'country',
                    message: `无效的国家代码: ${row.country}`,
                    value: row.country
                });
            } else {
                fixed.country = country;
            }
        }

        // 3. 验证金额
        const amountFields = ['amount', 'net_amount', 'vat_amount'];
        for (const field of amountFields) {
            if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
                const num = Number(row[field]);
                if (isNaN(num) || num < 0) {
                    errors.push({
                        field,
                        message: `${field} 必须是正数`,
                        value: row[field]
                    });
                } else {
                    fixed[field] = num;
                }
            }
        }

        // 4. 验证日期
        if (row.order_date) {
            const date = new Date(row.order_date);
            if (isNaN(date.getTime())) {
                warnings.push({
                    field: 'order_date',
                    message: `无效的日期格式: ${row.order_date}`,
                    value: row.order_date
                });
            }
        }

        // 5. 验证VAT号（如果存在）
        if (row.vat_number) {
            const vat = String(row.vat_number).replace(/\s/g, '').toUpperCase();
            if (vat.length < 5) {
                warnings.push({
                    field: 'vat_number',
                    message: `VAT号可能无效: ${row.vat_number}`,
                    value: row.vat_number
                });
            }
            fixed.vat_number = vat;
        }

        // 6. 验证税率（如果存在）
        if (row.tax_rate !== undefined && row.tax_rate !== null && row.tax_rate !== '') {
            const rate = Number(row.tax_rate);
            if (isNaN(rate) || rate < 0 || rate > 1) {
                errors.push({
                    field: 'tax_rate',
                    message: `税率必须在0到1之间: ${row.tax_rate}`,
                    value: row.tax_rate
                });
            } else {
                fixed.tax_rate = rate;
            }
        }

        // 7. 验证净销售额和VAT的关系（如果两者都存在）
        if (fixed.net_amount !== undefined && fixed.vat_amount !== undefined && fixed.tax_rate !== undefined) {
            const expectedVAT = fixed.net_amount * fixed.tax_rate;
            const difference = Math.abs(fixed.vat_amount - expectedVAT);
            const tolerance = expectedVAT * 0.1;

            if (difference > tolerance && difference > 0.01) {
                warnings.push({
                    field: 'vat_amount',
                    message: `VAT金额与净销售额*税率不匹配: 期望 ${expectedVAT.toFixed(2)}, 实际 ${fixed.vat_amount.toFixed(2)}`,
                    value: fixed.vat_amount,
                    expected: expectedVAT
                });
            }
        }

        // 8. 自动修复：计算缺失的金额
        if (fixed.net_amount !== undefined && fixed.vat_amount !== undefined) {
            if (fixed.gross_amount === undefined || fixed.gross_amount === null) {
                fixed.gross_amount = fixed.net_amount + fixed.vat_amount;
            }
        }

        if (fixed.amount !== undefined && fixed.net_amount === undefined && fixed.vat_amount === undefined) {
            // 如果只有总金额，假设税率默认20%
            if (!fixed.tax_rate) fixed.tax_rate = 0.20;
            fixed.net_amount = fixed.amount / (1 + fixed.tax_rate);
            fixed.vat_amount = fixed.amount - fixed.net_amount;
        }

        return {
            row: fixed,
            valid: errors.length === 0,
            errors,
            warnings,
            index
        };
    }

    /**
     * 批量验证
     */
    async validateBatch(datasets) {
        const results = {};

        for (const [name, data] of Object.entries(datasets)) {
            results[name] = await this.validate(data);
        }

        return results;
    }

    /**
     * 获取验证统计
     */
    getStats(validationResult) {
        return {
            total: validationResult.summary.total,
            valid: validationResult.summary.validCount,
            invalid: validationResult.summary.invalidCount,
            issues: validationResult.summary.issueCount,
            validRate: validationResult.summary.total > 0
                ? (validationResult.summary.validCount / validationResult.summary.total * 100).toFixed(1)
                : 0
        };
    }
}

module.exports = new DataValidator();