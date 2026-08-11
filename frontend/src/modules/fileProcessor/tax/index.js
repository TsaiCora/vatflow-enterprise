// frontend/src/modules/fileProcessor/tax/index.js
/**
 * 国家税务计算 - 前端
 * 各国VAT/GST税务计算 (35个国家)
 */

// 国家税务计算器映射
const taxCalculators = {
    AE: require('./ae_tax'),
    AT: require('./at_tax'),
    AU: require('./au_tax'),
    BE: require('./be_tax'),
    BR: require('./br_tax'),
    CA: require('./ca_tax'),
    CH: require('./ch_tax'),
    DE: require('./de_tax'),
    DK: require('./dk_tax'),
    ES: require('./es_tax'),
    FI: require('./fi_tax'),
    FR: require('./fr_tax'),
    GB: require('./gb_tax'),
    ID: require('./id_tax'),
    IE: require('./ie_tax'),
    IN: require('./in_tax'),
    IT: require('./it_tax'),
    JP: require('./jp_tax'),
    KR: require('./kr_tax'),
    MX: require('./mx_tax'),
    MY: require('./my_tax'),
    NL: require('./nl_tax'),
    NO: require('./no_tax'),
    NZ: require('./nz_tax'),
    PH: require('./ph_tax'),
    PL: require('./pl_tax'),
    PT: require('./pt_tax'),
    RU: require('./ru_tax'),
    SE: require('./se_tax'),
    SG: require('./sg_tax'),
    TH: require('./th_tax'),
    TR: require('./tr_tax'),
    US: require('./us_tax'),
    VN: require('./vn_tax'),
    ZA: require('./za_tax'),
};

/**
 * 获取国家税务计算器
 */
export const getTaxCalculator = (countryCode) => {
    const key = countryCode.toUpperCase();
    return taxCalculators[key] || null;
};

/**
 * 获取所有支持的国家列表
 */
export const getSupportedCountries = () => {
    return Object.keys(taxCalculators);
};

/**
 * 计算VAT
 */
export const calculateVAT = (countryCode, amount, rate) => {
    const calculator = getTaxCalculator(countryCode);
    if (!calculator) {
        throw new Error(`不支持的国家: ${countryCode}`);
    }
    return calculator.calculateVAT(amount, rate);
};

/**
 * 验证VAT号码
 */
export const validateVATNumber = (countryCode, vatNumber) => {
    const calculator = getTaxCalculator(countryCode);
    if (!calculator) {
        return { valid: false, message: `不支持的国家: ${countryCode}` };
    }
    return calculator.validateVATNumber(vatNumber);
};

export default taxCalculators;