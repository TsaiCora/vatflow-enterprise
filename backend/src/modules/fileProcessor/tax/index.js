// backend/src/modules/fileProcessor/tax/index.js
/**
 * 国家税务计算模块
 * 各国VAT/GST税务计算
 */

module.exports = {
    AU: require('./au_tax'),
    BE: require('./be_tax'),
    CA: require('./ca_tax'),
    DE: require('./de_tax'),
    ES: require('./es_tax'),
    FR: require('./fr_tax'),
    IT: require('./it_tax'),
    JP: require('./jp_tax'),
    NL: require('./nl_tax'),
    PL: require('./pl_tax'),
    SE: require('./se_tax'),
    SG: require('./sg_tax'),
    US: require('./us_tax'),
    // 新增国家
    GB: require('./gb_tax'),
    KR: require('./kr_tax'),
    MX: require('./mx_tax'),
    BR: require('./br_tax'),
    CH: require('./ch_tax'),
    NO: require('./no_tax'),
    DK: require('./dk_tax'),
    FI: require('./fi_tax'),
    IE: require('./ie_tax'),
    PT: require('./pt_tax'),
    AT: require('./at_tax'),
    IN: require('./in_tax'),
    ZA: require('./za_tax'),
    TR: require('./tr_tax'),
    AE: require('./ae_tax'),
    NZ: require('./nz_tax'),
    MY: require('./my_tax'),
    TH: require('./th_tax'),
    VN: require('./vn_tax'),
    ID: require('./id_tax'),
    PH: require('./ph_tax'),
    RU: require('./ru_tax')
};