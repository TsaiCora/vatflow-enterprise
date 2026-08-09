// backend/src/utils/validators.js
const Joi = require('joi');

/**
 * 通用验证器
 */
class Validators {
    /**
     * 验证邮箱
     */
    isValidEmail(email) {
        const schema = Joi.string().email();
        const { error } = schema.validate(email);
        return !error;
    }

    /**
     * 验证手机号
     */
    isValidPhone(phone, countryCode = 'CN') {
        const patterns = {
            CN: /^(\+86)?1[3-9]\d{9}$/,
            GB: /^(\+44)?7\d{9}$/,
            US: /^(\+1)?\d{10}$/,
            FR: /^(\+33)?[67]\d{8}$/,
            DE: /^(\+49)?1[5-7]\d{9}$/
        };
        const pattern = patterns[countryCode] || patterns.CN;
        return pattern.test(phone.replace(/\s/g, ''));
    }

    /**
     * 验证URL
     */
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 验证VAT号码
     */
    isValidVAT(vatNumber, countryCode = null) {
        if (!vatNumber) return false;
        
        const cleaned = String(vatNumber).replace(/\s/g, '').toUpperCase();
        const patterns = {
            GB: /^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$/,
            FR: /^FR[A-HJ-NP-Z0-9]{2}\d{9}$/,
            DE: /^DE\d{9}$/,
            IT: /^IT\d{11}$/,
            ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
            NL: /^NL\d{9}B\d{2}$/,
            BE: /^BE\d{10}$/,
            AT: /^ATU\d{8}$/,
            IE: /^IE\d{7}[A-Z]{1,2}$/,
            PL: /^PL\d{10}$/,
            PT: /^PT\d{9}$/,
            SE: /^SE\d{12}$/,
            DK: /^DK\d{8}$/,
            FI: /^FI\d{8}$/,
            HU: /^HU\d{8}$/,
            CZ: /^CZ\d{8,10}$/,
            SK: /^SK\d{10}$/,
            RO: /^RO\d{2,10}$/,
            BG: /^BG\d{9,10}$/,
            GR: /^GR\d{9}$/,
            CY: /^CY\d{8}[A-Z]$/,
            MT: /^MT\d{8}$/,
            SI: /^SI\d{8}$/,
            LV: /^LV\d{11}$/,
            LT: /^LT\d{9,12}$/,
            EE: /^EE\d{9}$/,
            LU: /^LU\d{8}$/,
            HR: /^HR\d{11}$/,
            CH: /^CHE-\d{3}\.\d{3}\.\d{3}$/
        };

        if (countryCode && patterns[countryCode]) {
            return patterns[countryCode].test(cleaned);
        }

        // 尝试所有模式
        for (const pattern of Object.values(patterns)) {
            if (pattern.test(cleaned)) return true;
        }
        return false;
    }

    /**
     * 验证税率
     */
    isValidTaxRate(rate) {
        if (rate === null || rate === undefined) return false;
        const num = Number(rate);
        return !isNaN(num) && num >= 0 && num <= 1;
    }

    /**
     * 验证金额
     */
    isValidAmount(amount) {
        if (amount === null || amount === undefined) return false;
        const num = Number(amount);
        return !isNaN(num) && num >= 0;
    }

    /**
     * 验证日期
     */
    isValidDate(date) {
        if (!date) return false;
        const d = new Date(date);
        return !isNaN(d.getTime());
    }

    /**
     * 验证期间格式 (YYYY-MM)
     */
    isValidPeriod(period) {
        if (!period) return false;
        const pattern = /^\d{4}-\d{2}$/;
        if (!pattern.test(period)) return false;
        const [year, month] = period.split('-').map(Number);
        return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
    }

    /**
     * 验证国家代码
     */
    isValidCountryCode(code) {
        if (!code) return false;
        const countryCodes = [
            'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
            'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
            'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB'
        ];
        return countryCodes.includes(code.toUpperCase());
    }

    /**
     * 验证密码强度
     */
    validatePassword(password, options = {}) {
        const { minLength = 6, maxLength = 20, requireUppercase = false, requireNumber = false, requireSpecial = false } = options;
        
        const errors = [];

        if (password.length < minLength) {
            errors.push(`密码至少${minLength}位`);
        }
        if (password.length > maxLength) {
            errors.push(`密码最多${maxLength}位`);
        }
        if (requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('密码至少包含一个大写字母');
        }
        if (requireNumber && !/\d/.test(password)) {
            errors.push('密码至少包含一个数字');
        }
        if (requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
            errors.push('密码至少包含一个特殊字符');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证IP地址
     */
    isValidIP(ip) {
        const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        if (ipv4.test(ip)) {
            const parts = ip.split('.').map(Number);
            return parts.every(p => p >= 0 && p <= 255);
        }
        if (ipv6.test(ip)) return true;
        return false;
    }

    /**
     * 验证域名
     */
    isValidDomain(domain) {
        const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        return pattern.test(domain);
    }

    /**
     * 验证JSON
     */
    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 验证布尔值
     */
    isValidBoolean(value) {
        return value === true || value === false || value === 'true' || value === 'false' || value === 0 || value === 1;
    }

    /**
     * 验证整数
     */
    isValidInteger(value) {
        return Number.isInteger(Number(value));
    }

    /**
     * 验证正整数
     */
    isValidPositiveInteger(value) {
        const num = Number(value);
        return Number.isInteger(num) && num > 0;
    }

    /**
     * 验证非负整数
     */
    isValidNonNegativeInteger(value) {
        const num = Number(value);
        return Number.isInteger(num) && num >= 0;
    }

    /**
     * 验证枚举值
     */
    isValidEnum(value, enumValues) {
        return enumValues.includes(value);
    }

    /**
     * 验证字符串长度
     */
    isValidLength(value, min, max) {
        const len = String(value).length;
        if (min !== undefined && len < min) return false;
        if (max !== undefined && len > max) return false;
        return true;
    }

    /**
     * 验证正则表达式
     */
    isValidPattern(value, pattern) {
        return pattern.test(String(value));
    }

    /**
     * 组合验证
     */
    composeValidators(...validators) {
        return (value) => {
            for (const validator of validators) {
                const result = validator(value);
                if (result !== true) {
                    return result;
                }
            }
            return true;
        };
    }
}

module.exports = new Validators();