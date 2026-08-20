// backend/src/modules/fileProcessor/certificates/index.js
/**
 * 证书处理模块
 * 各国进口VAT证明文件、清关文件处理
 */

const certificates = {
    // ===== 欧洲 =====
    c79: require('./c79'),           // 英国 C79
    c88: require('./c88'),           // 英国 C88/CDS
    de_import: require('./de_import'), // 德国进口VAT证明
    fr_import: require('./fr_import'), // 法国进口VAT证明
    it_import: require('./it_import'), // 意大利进口VAT证明
    es_import: require('./es_import'), // 西班牙进口VAT证明
    nl_import: require('./nl_import'), // 荷兰进口VAT证明
    be_import: require('./be_import'), // 比利时进口VAT证明
    pl_import: require('./pl_import'), // 波兰进口VAT证明
    se_import: require('./se_import'), // 瑞典进口VAT证明
    dk_import: require('./dk_import'), // 丹麦进口VAT证明
    fi_import: require('./fi_import'), // 芬兰进口VAT证明
    ie_import: require('./ie_import'), // 爱尔兰进口VAT证明
    pt_import: require('./pt_import'), // 葡萄牙进口VAT证明
    at_import: require('./at_import'), // 奥地利进口VAT证明
    no_import: require('./no_import'), // 挪威进口VAT证明
    ch_import: require('./ch_import'), // 瑞士进口VAT证明
    ru_import: require('./ru_import'), // 俄罗斯进口VAT证明
    // ===== 亚洲 =====
    jp_import: require('./jp_import'), // 日本进口VAT证明
    kr_import: require('./kr_import'), // 韩国进口VAT证明
    cn_import: require('./cn_import'), // 中国进口VAT证明
    sg_import: require('./sg_import'), // 新加坡进口VAT证明
    my_import: require('./my_import'), // 马来西亚进口VAT证明
    th_import: require('./th_import'), // 泰国进口VAT证明
    vn_import: require('./vn_import'), // 越南进口VAT证明
    id_import: require('./id_import'), // 印度尼西亚进口VAT证明
    ph_import: require('./ph_import'), // 菲律宾进口VAT证明
    in_import: require('./in_import'), // 印度进口VAT证明
    // ===== 美洲 =====
    us_import: require('./us_import'), // 美国进口VAT证明
    ca_import: require('./ca_import'), // 加拿大进口VAT证明
    mx_import: require('./mx_import'), // 墨西哥进口VAT证明
    br_import: require('./br_import'), // 巴西进口VAT证明
    // ===== 大洋洲 =====
    au_import: require('./au_import'), // 澳大利亚进口VAT证明
    nz_import: require('./nz_import'), // 新西兰进口VAT证明
    // ===== 非洲 =====
    za_import: require('./za_import'), // 南非进口VAT证明
    // ===== 中东 =====
    ae_import: require('./ae_import'), // 阿联酋进口VAT证明
    tr_import: require('./tr_import'), // 土耳其进口VAT证明
};

/**
 * 获取证书处理器
 */
const getCertificateHandler = (type) => {
    const key = type.toLowerCase();
    return certificates[key] || null;
};

/**
 * 获取所有支持的证书类型
 */
const getSupportedCertificates = () => {
    return Object.keys(certificates);
};

/**
 * 获取国家进口文件信息
 */
const getCountryImportInfo = (countryCode) => {
    const importInfo = {
        GB: {
            country: 'GB',
            name: '英国',
            vatProof: 'C79',
            customsDoc: 'C88 / CDS',
            authority: 'HMRC',
            period: '月度',
            format: 'PDF/XML'
        },
        DE: {
            country: 'DE',
            name: '德国',
            vatProof: 'Einkommensteuerbescheid',
            customsDoc: 'Zollanmeldung',
            authority: 'Bundeszentralamt für Steuern',
            period: '季度/月度',
            format: 'PDF/XML'
        },
        FR: {
            country: 'FR',
            name: '法国',
            vatProof: 'Attestation de TVA',
            customsDoc: 'Déclaration en douane',
            authority: 'Direction Générale des Douanes',
            period: '月度',
            format: 'PDF/XML'
        },
        IT: {
            country: 'IT',
            name: '意大利',
            vatProof: 'Certificato IVA',
            customsDoc: 'Dichiarazione doganale',
            authority: 'Agenzia delle Dogane',
            period: '月度',
            format: 'PDF/XML'
        },
        ES: {
            country: 'ES',
            name: '西班牙',
            vatProof: 'Certificado de IVA',
            customsDoc: 'Documento de despacho',
            authority: 'Agencia Tributaria',
            period: '月度',
            format: 'PDF/XML'
        },
        NL: {
            country: 'NL',
            name: '荷兰',
            vatProof: 'BTW aangifte',
            customsDoc: 'Invoeraangifte',
            authority: 'Belastingdienst',
            period: '月度',
            format: 'PDF/XML'
        },
        BE: {
            country: 'BE',
            name: '比利时',
            vatProof: 'Certificat TVA',
            customsDoc: 'Document douanier',
            authority: 'Service Public Fédéral Finances',
            period: '月度',
            format: 'PDF/XML'
        },
        PL: {
            country: 'PL',
            name: '波兰',
            vatProof: 'Deklaracja VAT',
            customsDoc: 'Dokument celny',
            authority: 'Krajowa Administracja Skarbowa',
            period: '月度',
            format: 'PDF/XML'
        },
        SE: {
            country: 'SE',
            name: '瑞典',
            vatProof: 'Momsbesked',
            customsDoc: 'Tulldeklaration',
            authority: 'Skatteverket',
            period: '月度',
            format: 'PDF/XML'
        },
        DK: {
            country: 'DK',
            name: '丹麦',
            vatProof: 'Momsangivelse',
            customsDoc: 'Tolddeklaration',
            authority: 'Skattestyrelsen',
            period: '月度',
            format: 'PDF/XML'
        },
        FI: {
            country: 'FI',
            name: '芬兰',
            vatProof: 'ALV-ilmoitus',
            customsDoc: 'Tulli-ilmoitus',
            authority: 'Verohallinto',
            period: '月度',
            format: 'PDF/XML'
        },
        IE: {
            country: 'IE',
            name: '爱尔兰',
            vatProof: 'VAT Return',
            customsDoc: 'Customs Declaration',
            authority: 'Revenue Commissioners',
            period: '月度',
            format: 'PDF/XML'
        },
        PT: {
            country: 'PT',
            name: '葡萄牙',
            vatProof: 'Declaração de IVA',
            customsDoc: 'Declaração aduaneira',
            authority: 'Autoridade Tributária',
            period: '月度',
            format: 'PDF/XML'
        },
        AT: {
            country: 'AT',
            name: '奥地利',
            vatProof: 'UVA-Meldung',
            customsDoc: 'Zollanmeldung',
            authority: 'Finanzamt',
            period: '月度',
            format: 'PDF/XML'
        },
        NO: {
            country: 'NO',
            name: '挪威',
            vatProof: 'MVA-melding',
            customsDoc: 'Tolldeklarasjon',
            authority: 'Skatteetaten',
            period: '月度',
            format: 'PDF/XML'
        },
        CH: {
            country: 'CH',
            name: '瑞士',
            vatProof: 'MWST-Abrechnung',
            customsDoc: 'Zollanmeldung',
            authority: 'Eidgenössische Steuerverwaltung',
            period: '季度',
            format: 'PDF/XML'
        },
        RU: {
            country: 'RU',
            name: '俄罗斯',
            vatProof: 'НДС-декларация',
            customsDoc: 'Таможенная декларация',
            authority: 'ФНС России',
            period: '季度',
            format: 'PDF/XML'
        },
        JP: {
            country: 'JP',
            name: '日本',
            vatProof: '消費税申告書',
            customsDoc: '輸入許可書',
            authority: '国税庁',
            period: '月度',
            format: 'PDF/XML'
        },
        KR: {
            country: 'KR',
            name: '韩国',
            vatProof: '부가가치세 신고서',
            customsDoc: '수입신고서',
            authority: '국세청',
            period: '月度',
            format: 'PDF/XML'
        },
        CN: {
            country: 'CN',
            name: '中国',
            vatProof: '增值税申报表',
            customsDoc: '进口报关单',
            authority: '国家税务总局',
            period: '月度',
            format: 'PDF/XML'
        },
        SG: {
            country: 'SG',
            name: '新加坡',
            vatProof: 'GST Return',
            customsDoc: 'Import Declaration',
            authority: 'IRAS',
            period: '月度',
            format: 'PDF/XML'
        },
        MY: {
            country: 'MY',
            name: '马来西亚',
            vatProof: 'SST Return',
            customsDoc: 'Import Declaration',
            authority: 'Royal Malaysian Customs',
            period: '月度',
            format: 'PDF/XML'
        },
        TH: {
            country: 'TH',
            name: '泰国',
            vatProof: 'ภาษีมูลค่าเพิ่ม',
            customsDoc: 'ใบขนสินค้าขาเข้า',
            authority: 'กรมสรรพากร',
            period: '月度',
            format: 'PDF/XML'
        },
        VN: {
            country: 'VN',
            name: '越南',
            vatProof: 'Tờ khai thuế GTGT',
            customsDoc: 'Tờ khai hải quan',
            authority: 'Tổng cục Thuế',
            period: '月度',
            format: 'PDF/XML'
        },
        ID: {
            country: 'ID',
            name: '印度尼西亚',
            vatProof: 'SPT PPN',
            customsDoc: 'Pemberitahuan Impor',
            authority: 'Direktorat Jenderal Pajak',
            period: '月度',
            format: 'PDF/XML'
        },
        PH: {
            country: 'PH',
            name: '菲律宾',
            vatProof: 'VAT Return',
            customsDoc: 'Import Declaration',
            authority: 'Bureau of Internal Revenue',
            period: '月度',
            format: 'PDF/XML'
        },
        IN: {
            country: 'IN',
            name: '印度',
            vatProof: 'GSTR-1',
            customsDoc: 'Bill of Entry',
            authority: 'Central Board of Indirect Taxes',
            period: '月度',
            format: 'PDF/XML'
        },
        US: {
            country: 'US',
            name: '美国',
            vatProof: 'Sales Tax Return',
            customsDoc: 'Customs Entry',
            authority: 'IRS / CBP',
            period: '月度',
            format: 'PDF/XML'
        },
        CA: {
            country: 'CA',
            name: '加拿大',
            vatProof: 'GST/HST Return',
            customsDoc: 'Customs Invoice',
            authority: 'CRA',
            period: '月度',
            format: 'PDF/XML'
        },
        MX: {
            country: 'MX',
            name: '墨西哥',
            vatProof: 'Declaración de IVA',
            customsDoc: 'Pedimento de importación',
            authority: 'SAT',
            period: '月度',
            format: 'PDF/XML'
        },
        BR: {
            country: 'BR',
            name: '巴西',
            vatProof: 'Declaração de ICMS',
            customsDoc: 'DI - Declaração de Importação',
            authority: 'Receita Federal',
            period: '月度',
            format: 'PDF/XML'
        },
        AU: {
            country: 'AU',
            name: '澳大利亚',
            vatProof: 'BAS - Business Activity Statement',
            customsDoc: 'Import Declaration',
            authority: 'Australian Tax Office',
            period: '月度',
            format: 'PDF/XML'
        },
        NZ: {
            country: 'NZ',
            name: '新西兰',
            vatProof: 'GST Return',
            customsDoc: 'Import Declaration',
            authority: 'Inland Revenue',
            period: '月度',
            format: 'PDF/XML'
        },
        ZA: {
            country: 'ZA',
            name: '南非',
            vatProof: 'VAT Return',
            customsDoc: 'Customs Declaration',
            authority: 'SARS',
            period: '月度',
            format: 'PDF/XML'
        },
        AE: {
            country: 'AE',
            name: '阿联酋',
            vatProof: 'VAT Return',
            customsDoc: 'Customs Declaration',
            authority: 'FTA',
            period: '月度',
            format: 'PDF/XML'
        },
        TR: {
            country: 'TR',
            name: '土耳其',
            vatProof: 'KDV Beyannamesi',
            customsDoc: 'Gümrük Beyannamesi',
            authority: 'Gelir İdaresi Başkanlığı',
            period: '月度',
            format: 'PDF/XML'
        }
    };
    return importInfo[countryCode.toUpperCase()] || null;
};

module.exports = {
    ...certificates,
    certificates,
    getCertificateHandler,
    getSupportedCertificates,
    getCountryImportInfo
};