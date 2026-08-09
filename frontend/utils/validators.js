// frontend/src/utils/validators.js

/**
 * 验证必填字段
 * @param {string} value - 值
 * @param {string} fieldName - 字段名称
 * @returns {string|null} 错误信息或null
 */
export const required = (value, fieldName = '此字段') => {
    if (value === null || value === undefined || value === '') {
        return `${fieldName}为必填项`;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return `${fieldName}为必填项`;
    }
    return null;
};

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {string|null} 错误信息或null
 */
export const isEmail = (email) => {
    if (!email) return null;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return '请输入有效的邮箱地址';
    }
    return null;
};

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @param {string} countryCode - 国家代码
 * @returns {string|null} 错误信息或null
 */
export const isPhone = (phone, countryCode = 'CN') => {
    if (!phone) return null;
    const cleaned = phone.replace(/\s/g, '');
    const patterns = {
        CN: /^(\+86)?1[3-9]\d{9}$/,
        GB: /^(\+44)?7\d{9}$/,
        US: /^(\+1)?\d{10}$/,
        FR: /^(\+33)?[67]\d{8}$/,
        DE: /^(\+49)?1[5-7]\d{9}$/
    };
    
    const pattern = patterns[countryCode] || patterns.CN;
    if (!pattern.test(cleaned)) {
        return '请输入有效的手机号';
    }
    return null;
};

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @param {Object} options - 选项
 * @returns {string|null} 错误信息或null
 */
export const isPasswordStrong = (password, options = {}) => {
    if (!password) {
        return options.required ? '密码为必填项' : null;
    }
    
    const { minLength = 6, maxLength = 20, requireUppercase = false, requireLowercase = false, requireNumber = false, requireSpecial = false } = options;
    
    if (password.length < minLength) {
        return `密码至少${minLength}位`;
    }
    if (password.length > maxLength) {
        return `密码最多${maxLength}位`;
    }
    
    if (requireUppercase && !/[A-Z]/.test(password)) {
        return '密码至少包含一个大写字母';
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
        return '密码至少包含一个小写字母';
    }
    if (requireNumber && !/\d/.test(password)) {
        return '密码至少包含一个数字';
    }
    if (requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
        return '密码至少包含一个特殊字符';
    }
    
    return null;
};

/**
 * 验证密码是否匹配
 * @param {string} password - 密码
 * @param {string} confirmPassword - 确认密码
 * @returns {string|null} 错误信息或null
 */
export const passwordMatch = (password, confirmPassword) => {
    if (!password || !confirmPassword) return null;
    if (password !== confirmPassword) {
        return '两次输入的密码不一致';
    }
    return null;
};

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {string|null} 错误信息或null
 */
export const isURL = (url) => {
    if (!url) return null;
    try {
        new URL(url);
        return null;
    } catch {
        return '请输入有效的URL地址';
    }
};

/**
 * 验证数字
 * @param {number} value - 值
 * @param {Object} options - 选项
 * @returns {string|null} 错误信息或null
 */
export const isNumber = (value, options = {}) => {
    const { min, max, integer = false, positive = false, required = false } = options;
    
    if (value === null || value === undefined || value === '') {
        if (required) return '此字段为必填项';
        return null;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
        return '请输入有效的数字';
    }
    
    if (integer && !Number.isInteger(num)) {
        return '请输入整数';
    }
    if (positive && num <= 0) {
        return '请输入正数';
    }
    if (min !== undefined && num < min) {
        return `值不能小于${min}`;
    }
    if (max !== undefined && num > max) {
        return `值不能大于${max}`;
    }
    
    return null;
};

/**
 * 验证字符长度
 * @param {string} value - 值
 * @param {Object} options - 选项
 * @returns {string|null} 错误信息或null
 */
export const isLength = (value, options = {}) => {
    const { min, max, required = false } = options;
    
    if (!value) {
        if (required) return '此字段为必填项';
        return null;
    }
    
    const len = String(value).length;
    if (min !== undefined && len < min) {
        return `至少${min}个字符`;
    }
    if (max !== undefined && len > max) {
        return `最多${max}个字符`;
    }
    
    return null;
};

/**
 * 验证VAT号码格式
 * @param {string} vatNumber - VAT号码
 * @param {string} countryCode - 国家代码
 * @returns {string|null} 错误信息或null
 */
export const isVAT = (vatNumber, countryCode) => {
    if (!vatNumber) return null;
    
    const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
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
    
    // 如果没有指定国家，尝试所有模式
    if (!countryCode) {
        for (const pattern of Object.values(patterns)) {
            if (pattern.test(cleaned)) {
                return null;
            }
        }
        return '请输入有效的VAT号码';
    }
    
    const pattern = patterns[countryCode];
    if (!pattern) {
        return `不支持的国家代码: ${countryCode}`;
    }
    
    if (!pattern.test(cleaned)) {
        return `请输入有效的${countryCode} VAT号码`;
    }
    
    return null;
};

/**
 * 验证邮政编码
 * @param {string} postcode - 邮政编码
 * @param {string} countryCode - 国家代码
 * @returns {string|null} 错误信息或null
 */
export const isPostcode = (postcode, countryCode = 'GB') => {
    if (!postcode) return null;
    
    const cleaned = postcode.replace(/\s/g, '').toUpperCase();
    const patterns = {
        GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/,
        US: /^\d{5}(-\d{4})?$/,
        CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/,
        FR: /^\d{5}$/,
        DE: /^\d{5}$/,
        IT: /^\d{5}$/,
        ES: /^\d{5}$/,
        NL: /^\d{4}[A-Z]{2}$/,
        BE: /^\d{4}$/,
        AT: /^\d{4}$/,
        CH: /^\d{4}$/,
        SE: /^\d{5}$/,
        DK: /^\d{4}$/,
        FI: /^\d{5}$/,
        NO: /^\d{4}$/,
        IE: /^[A-Z]\d{2}$/
    };
    
    const pattern = patterns[countryCode];
    if (!pattern) {
        return `不支持的国家代码: ${countryCode}`;
    }
    
    if (!pattern.test(cleaned)) {
        return '请输入有效的邮政编码';
    }
    
    return null;
};

/**
 * 验证信用卡号
 * @param {string} cardNumber - 卡号
 * @returns {string|null} 错误信息或null
 */
export const isCreditCard = (cardNumber) => {
    if (!cardNumber) return null;
    
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(cleaned)) {
        return '请输入有效的信用卡号';
    }
    
    // Luhn算法验证
    let sum = 0;
    let alternate = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let n = parseInt(cleaned[i], 10);
        if (alternate) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alternate = !alternate;
    }
    
    if (sum % 10 !== 0) {
        return '请输入有效的信用卡号';
    }
    
    return null;
};

/**
 * 验证IP地址
 * @param {string} ip - IP地址
 * @param {string} version - 版本 'v4' | 'v6'
 * @returns {string|null} 错误信息或null
 */
export const isIP = (ip, version = 'v4') => {
    if (!ip) return null;
    
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (version === 'v4' || version === 'both') {
        if (ipv4Pattern.test(ip)) {
            const parts = ip.split('.').map(Number);
            if (parts.every(p => p >= 0 && p <= 255)) {
                return null;
            }
        }
    }
    
    if (version === 'v6' || version === 'both') {
        if (ipv6Pattern.test(ip)) {
            return null;
        }
    }
    
    return '请输入有效的IP地址';
};

/**
 * 验证域名
 * @param {string} domain - 域名
 * @returns {string|null} 错误信息或null
 */
export const isDomain = (domain) => {
    if (!domain) return null;
    
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!pattern.test(domain)) {
        return '请输入有效的域名';
    }
    return null;
};

/**
 * 验证日期
 * @param {string} date - 日期字符串
 * @param {string} format - 格式
 * @returns {string|null} 错误信息或null
 */
export const isDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return '请输入有效的日期';
    }
    
    // 检查日期是否在合理范围内
    const year = d.getFullYear();
    if (year < 1900 || year > 2100) {
        return '请输入合理的日期';
    }
    
    return null;
};

/**
 * 验证年龄
 * @param {Date|string} birthDate - 出生日期
 * @param {number} minAge - 最小年龄
 * @returns {string|null} 错误信息或null
 */
export const isAge = (birthDate, minAge = 18) => {
    if (!birthDate) return null;
    
    const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    if (isNaN(date.getTime())) {
        return '请输入有效的出生日期';
    }
    
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
        age--;
    }
    
    if (age < minAge) {
        return `年龄必须大于${minAge}岁`;
    }
    
    return null;
};

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {Array<string>} allowedTypes - 允许的类型
 * @returns {string|null} 错误信息或null
 */
export const isFileType = (file, allowedTypes) => {
    if (!file) return null;
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext) && !allowedTypes.includes(file.type)) {
        return `不支持的文件类型: ${ext}`;
    }
    return null;
};

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSize - 最大大小 (bytes)
 * @returns {string|null} 错误信息或null
 */
export const isFileSize = (file, maxSize) => {
    if (!file) return null;
    
    if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
        return `文件大小不能超过${maxMB}MB`;
    }
    return null;
};

/**
 * 验证手机验证码
 * @param {string} code - 验证码
 * @param {number} length - 长度
 * @returns {string|null} 错误信息或null
 */
export const isVerificationCode = (code, length = 6) => {
    if (!code) return null;
    
    if (!/^\d+$/.test(code)) {
        return '验证码只能包含数字';
    }
    if (code.length !== length) {
        return `验证码必须为${length}位`;
    }
    return null;
};

/**
 * 验证JSON格式
 * @param {string} jsonString - JSON字符串
 * @returns {string|null} 错误信息或null
 */
export const isJSON = (jsonString) => {
    if (!jsonString) return null;
    
    try {
        JSON.parse(jsonString);
        return null;
    } catch {
        return '请输入有效的JSON格式';
    }
};

/**
 * 验证是否为空对象
 * @param {Object} obj - 对象
 * @returns {boolean} 是否为空
 */
export const isEmptyObject = (obj) => {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * 验证是否为有效的VAT申报期间
 * @param {string} period - 期间 (YYYY-MM)
 * @returns {boolean} 是否有效
 */
export const isValidPeriod = (period) => {
    if (!period) return false;
    const pattern = /^\d{4}-\d{2}$/;
    if (!pattern.test(period)) return false;
    
    const [year, month] = period.split('-').map(Number);
    if (year < 2000 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    
    return true;
};

/**
 * 验证税率
 * @param {number} rate - 税率 (0-1)
 * @returns {string|null} 错误信息或null
 */
export const isValidTaxRate = (rate) => {
    if (rate === null || rate === undefined || isNaN(rate)) {
        return '税率不能为空';
    }
    if (rate < 0 || rate > 1) {
        return '税率必须在0到1之间';
    }
    return null;
};

/**
 * 组合多个验证器
 * @param {Array<Function>} validators - 验证器数组
 * @returns {Function} 组合验证器
 */
export const composeValidators = (...validators) => {
    return (value) => {
        for (const validator of validators) {
            const error = validator(value);
            if (error) return error;
        }
        return null;
    };
};

// 导出所有验证器
export default {
    required,
    isEmail,
    isPhone,
    isPasswordStrong,
    passwordMatch,
    isURL,
    isNumber,
    isLength,
    isVAT,
    isPostcode,
    isCreditCard,
    isIP,
    isDomain,
    isDate,
    isAge,
    isFileType,
    isFileSize,
    isVerificationCode,
    isJSON,
    isEmptyObject,
    isValidPeriod,
    isValidTaxRate,
    composeValidators
};