// backend/src/services/taxRulesEngine.js
/**
 * 税务规则引擎 - 各国税率、发票规则、申报规则
 * 参考 euinvoice-mcp 和 Quaderno API 设计
 */

// =============================================
// ===== 各国税务规则配置 =====
// =============================================
const TAX_RULES = {
    // ===== 欧洲 =====
    GB: {
        country: 'GB',
        name: '英国',
        currency: 'GBP',
        taxSystem: 'VAT',
        rates: {
            standard: 20,
            reduced: 5,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '£{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'quarterly',
            dueDate: '2026-10-07',
            format: 'VAT-100',
            currency: 'GBP'
        }
    },
    DE: {
        country: 'DE',
        name: '德国',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 19,
            reduced: 7,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'RE-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-10',
            format: 'USt-1A',
            currency: 'EUR'
        }
    },
    FR: {
        country: 'FR',
        name: '法国',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 20,
            reduced: 10,
            reducedLow: 5.5,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FACT-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-15',
            format: 'CA3',
            currency: 'EUR'
        }
    },
    IT: {
        country: 'IT',
        name: '意大利',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 22,
            reduced: 10,
            reducedLow: 4,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FATT-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'quarterly',
            dueDate: '2026-10-16',
            format: 'IVA-2026',
            currency: 'EUR'
        }
    },
    ES: {
        country: 'ES',
        name: '西班牙',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 21,
            reduced: 10,
            reducedLow: 4,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FACT-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'quarterly',
            dueDate: '2026-10-20',
            format: 'IVA-303',
            currency: 'EUR'
        }
    },
    NL: {
        country: 'NL',
        name: '荷兰',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 21,
            reduced: 9,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FACT-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-25',
            format: 'Omzetbelasting',
            currency: 'EUR'
        }
    },
    BE: {
        country: 'BE',
        name: '比利时',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 21,
            reduced: 12,
            reducedLow: 6,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FACT-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-20',
            format: 'BTW-2026',
            currency: 'EUR'
        }
    },
    PL: {
        country: 'PL',
        name: '波兰',
        currency: 'PLN',
        taxSystem: 'VAT',
        rates: {
            standard: 23,
            reduced: 8,
            reducedLow: 5,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FA-{YYYY}-{NNNNNN}',
            currencyFormat: 'zł{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-25',
            format: 'VAT-7',
            currency: 'PLN'
        }
    },
    SE: {
        country: 'SE',
        name: '瑞典',
        currency: 'SEK',
        taxSystem: 'VAT',
        rates: {
            standard: 25,
            reduced: 12,
            reducedLow: 6,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FA-{YYYY}-{NNNNNN}',
            currencyFormat: 'SEK{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-26',
            format: 'Moms-2026',
            currency: 'SEK'
        }
    },
    DK: {
        country: 'DK',
        name: '丹麦',
        currency: 'DKK',
        taxSystem: 'VAT',
        rates: {
            standard: 25,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FA-{YYYY}-{NNNNNN}',
            currencyFormat: 'DKK{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-25',
            format: 'VAT-2026',
            currency: 'DKK'
        }
    },
    FI: {
        country: 'FI',
        name: '芬兰',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 24,
            reduced: 14,
            reducedLow: 10,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'LA-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-12',
            format: 'ALV-2026',
            currency: 'EUR'
        }
    },
    IE: {
        country: 'IE',
        name: '爱尔兰',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 23,
            reduced: 13.5,
            reducedLow: 9,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-23',
            format: 'VAT-3',
            currency: 'EUR'
        }
    },
    PT: {
        country: 'PT',
        name: '葡萄牙',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 23,
            reduced: 13,
            reducedLow: 6,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FAT-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-20',
            format: 'IVA-2026',
            currency: 'EUR'
        }
    },
    AT: {
        country: 'AT',
        name: '奥地利',
        currency: 'EUR',
        taxSystem: 'VAT',
        rates: {
            standard: 20,
            reduced: 13,
            reducedLow: 10,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'RE-{YYYY}-{NNNNNN}',
            currencyFormat: '€{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-15',
            format: 'UVA-2026',
            currency: 'EUR'
        }
    },
    NO: {
        country: 'NO',
        name: '挪威',
        currency: 'NOK',
        taxSystem: 'VAT',
        rates: {
            standard: 25,
            reduced: 15,
            reducedLow: 12,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'FA-{YYYY}-{NNNNNN}',
            currencyFormat: 'NOK{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-20',
            format: 'MVA-2026',
            currency: 'NOK'
        }
    },
    CH: {
        country: 'CH',
        name: '瑞士',
        currency: 'CHF',
        taxSystem: 'VAT',
        rates: {
            standard: 7.7,
            reduced: 2.5,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'RE-{YYYY}-{NNNNNN}',
            currencyFormat: 'CHF{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'quarterly',
            dueDate: '2026-10-31',
            format: 'MWST-2026',
            currency: 'CHF'
        }
    },
    RU: {
        country: 'RU',
        name: '俄罗斯',
        currency: 'RUB',
        taxSystem: 'VAT',
        rates: {
            standard: 20,
            reduced: 10,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'СЧ-{YYYY}-{NNNNNN}',
            currencyFormat: '₽{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'quarterly',
            dueDate: '2026-10-25',
            format: 'НДС-2026',
            currency: 'RUB'
        }
    },
    // ===== 亚洲 =====
    JP: {
        country: 'JP',
        name: '日本',
        currency: 'JPY',
        taxSystem: 'Consumption Tax',
        rates: {
            standard: 10,
            reduced: 8,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '¥{amount}',
            decimalPlaces: 0,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-31',
            format: '消費税-2026',
            currency: 'JPY'
        }
    },
    CN: {
        country: 'CN',
        name: '中国',
        currency: 'CNY',
        taxSystem: 'VAT',
        rates: {
            standard: 13,
            reduced: 9,
            reducedLow: 6,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '¥{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-15',
            format: '增值税-2026',
            currency: 'CNY'
        }
    },
    KR: {
        country: 'KR',
        name: '韩国',
        currency: 'KRW',
        taxSystem: 'VAT',
        rates: {
            standard: 10,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '₩{amount}',
            decimalPlaces: 0,
            dueDays: 30
        },
        filingRules: {
            period: 'quarterly',
            dueDate: '2026-10-25',
            format: '부가가치세-2026',
            currency: 'KRW'
        }
    },
    SG: {
        country: 'SG',
        name: '新加坡',
        currency: 'SGD',
        taxSystem: 'GST',
        rates: {
            standard: 9,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: 'S${amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-31',
            format: 'GST-2026',
            currency: 'SGD'
        }
    },
    MY: {
        country: 'MY',
        name: '马来西亚',
        currency: 'MYR',
        taxSystem: 'SST',
        rates: {
            standard: 8,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: 'RM{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-31',
            format: 'SST-2026',
            currency: 'MYR'
        }
    },
    TH: {
        country: 'TH',
        name: '泰国',
        currency: 'THB',
        taxSystem: 'VAT',
        rates: {
            standard: 7,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '฿{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-15',
            format: 'ภาษีมูลค่าเพิ่ม-2026',
            currency: 'THB'
        }
    },
    VN: {
        country: 'VN',
        name: '越南',
        currency: 'VND',
        taxSystem: 'VAT',
        rates: {
            standard: 10,
            reduced: 5,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '₫{amount}',
            decimalPlaces: 0,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-20',
            format: 'GTGT-2026',
            currency: 'VND'
        }
    },
    ID: {
        country: 'ID',
        name: '印度尼西亚',
        currency: 'IDR',
        taxSystem: 'VAT',
        rates: {
            standard: 11,
            reduced: 5,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: 'Rp{amount}',
            decimalPlaces: 0,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-31',
            format: 'PPN-2026',
            currency: 'IDR'
        }
    },
    PH: {
        country: 'PH',
        name: '菲律宾',
        currency: 'PHP',
        taxSystem: 'VAT',
        rates: {
            standard: 12,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '₱{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-25',
            format: 'VAT-2026',
            currency: 'PHP'
        }
    },
    IN: {
        country: 'IN',
        name: '印度',
        currency: 'INR',
        taxSystem: 'GST',
        rates: {
            standard: 18,
            reduced: 12,
            reducedLow: 5,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '₹{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-20',
            format: 'GSTR-1',
            currency: 'INR'
        }
    },
    // ===== 美洲 =====
    US: {
        country: 'US',
        name: '美国',
        currency: 'USD',
        taxSystem: 'Sales Tax',
        rates: {
            standard: 0,
            zero: 0,
            exempt: 'exempt',
            states: {
                CA: 7.25,
                NY: 4.0,
                TX: 6.25,
                FL: 6.0,
                IL: 6.25,
                PA: 6.0,
                OH: 5.75,
                GA: 4.0,
                NC: 4.75,
                MI: 6.0
            }
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'state', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '${amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-20',
            format: 'SalesTax-2026',
            currency: 'USD'
        }
    },
    CA: {
        country: 'CA',
        name: '加拿大',
        currency: 'CAD',
        taxSystem: 'GST/HST',
        rates: {
            standard: 5,
            zero: 0,
            exempt: 'exempt',
            provinces: {
                ON: 13,
                BC: 12,
                QC: 14.975,
                AB: 5,
                MB: 12,
                SK: 11,
                NS: 15,
                NB: 15,
                PE: 15,
                NL: 15
            }
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'province', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: 'CAD{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-31',
            format: 'GST/HST-2026',
            currency: 'CAD'
        }
    },
    MX: {
        country: 'MX',
        name: '墨西哥',
        currency: 'MXN',
        taxSystem: 'IVA',
        rates: {
            standard: 16,
            reduced: 8,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '${amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-17',
            format: 'IVA-2026',
            currency: 'MXN'
        }
    },
    BR: {
        country: 'BR',
        name: '巴西',
        currency: 'BRL',
        taxSystem: 'ICMS',
        rates: {
            standard: 17,
            reduced: 12,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: 'R${amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-20',
            format: 'ICMS-2026',
            currency: 'BRL'
        }
    },
    // ===== 大洋洲 =====
    AU: {
        country: 'AU',
        name: '澳大利亚',
        currency: 'AUD',
        taxSystem: 'GST',
        rates: {
            standard: 10,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: 'A${amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-28',
            format: 'BAS-2026',
            currency: 'AUD'
        }
    },
    NZ: {
        country: 'NZ',
        name: '新西兰',
        currency: 'NZD',
        taxSystem: 'GST',
        rates: {
            standard: 15,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: 'NZ${amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-28',
            format: 'GST-2026',
            currency: 'NZD'
        }
    },
    // ===== 非洲 =====
    ZA: {
        country: 'ZA',
        name: '南非',
        currency: 'ZAR',
        taxSystem: 'VAT',
        rates: {
            standard: 15,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: 'R{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-31',
            format: 'VAT-201',
            currency: 'ZAR'
        }
    },
    // ===== 中东 =====
    AE: {
        country: 'AE',
        name: '阿联酋',
        currency: 'AED',
        taxSystem: 'VAT',
        rates: {
            standard: 5,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: 'د.إ{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-28',
            format: 'VAT-2026',
            currency: 'AED'
        }
    },
    TR: {
        country: 'TR',
        name: '土耳其',
        currency: 'TRY',
        taxSystem: 'VAT',
        rates: {
            standard: 18,
            reduced: 8,
            reducedLow: 1,
            zero: 0,
            exempt: 'exempt'
        },
        invoiceRules: {
            requiredFields: ['invoiceNumber', 'issueDate', 'dueDate', 'buyerName', 'buyerAddress', 'vatNumber', 'netAmount', 'vatAmount', 'grossAmount'],
            numberFormat: 'INV-{YYYY}-{NNNNNN}',
            currencyFormat: '₺{amount}',
            decimalPlaces: 2,
            dueDays: 30
        },
        filingRules: {
            period: 'monthly',
            dueDate: '2026-10-26',
            format: 'KDV-2026',
            currency: 'TRY'
        }
    }
};

// =============================================
// ===== 税务规则引擎类 =====
// =============================================
class TaxRulesEngine {
    constructor() {
        this.rules = TAX_RULES;
    }

    /**
     * 获取国家税务规则
     */
    getCountryRules(countryCode) {
        const code = countryCode.toUpperCase();
        if (!this.rules[code]) {
            throw new Error(`不支持的国家: ${code}`);
        }
        return this.rules[code];
    }

    /**
     * 获取国家税率
     */
    getTaxRate(countryCode, rateType = 'standard') {
        const rules = this.getCountryRules(countryCode);
        const rates = rules.rates;
        
        if (rates[rateType] !== undefined) {
            return rates[rateType];
        }
        
        // 如果指定税率不存在，返回标准税率
        return rates.standard || 0;
    }

    /**
     * 获取国家货币
     */
    getCurrency(countryCode) {
        const rules = this.getCountryRules(countryCode);
        return rules.currency || 'EUR';
    }

    /**
     * 获取发票规则
     */
    getInvoiceRules(countryCode) {
        const rules = this.getCountryRules(countryCode);
        return rules.invoiceRules;
    }

    /**
     * 获取申报规则
     */
    getFilingRules(countryCode) {
        const rules = this.getCountryRules(countryCode);
        return rules.filingRules;
    }

    /**
     * 计算 VAT
     */
    calculateVAT(countryCode, netAmount, rateType = 'standard') {
        const rate = this.getTaxRate(countryCode, rateType);
        const rules = this.getCountryRules(countryCode);
        const currency = rules.currency || 'EUR';
        const decimalPlaces = rules.invoiceRules?.decimalPlaces || 2;
        
        const vatAmount = netAmount * (rate / 100);
        const grossAmount = netAmount + vatAmount;
        
        return {
            countryCode,
            countryName: rules.name,
            taxSystem: rules.taxSystem,
            rate,
            rateType,
            netAmount: this.roundTo(netAmount, decimalPlaces),
            vatAmount: this.roundTo(vatAmount, decimalPlaces),
            grossAmount: this.roundTo(grossAmount, decimalPlaces),
            currency,
            decimalPlaces
        };
    }

    /**
     * 计算 PVA 递延增值税
     */
    calculatePVA(countryCode, netAmount, pvaReason = 'import_goods') {
        const rules = this.getCountryRules(countryCode);
        const currency = rules.currency || 'EUR';
        const decimalPlaces = rules.invoiceRules?.decimalPlaces || 2;
        
        // PVA 递延：当期 VAT 为 0，递延到后续申报
        return {
            countryCode,
            countryName: rules.name,
            taxSystem: rules.taxSystem,
            pvaReason,
            netAmount: this.roundTo(netAmount, decimalPlaces),
            vatAmount: 0,
            grossAmount: this.roundTo(netAmount, decimalPlaces),
            deferredVAT: this.roundTo(netAmount * (rules.rates.standard || 20) / 100, decimalPlaces),
            currency,
            decimalPlaces,
            isPVA: true
        };
    }

    /**
     * 生成发票编号
     */
    generateInvoiceNumber(countryCode, sequence = 1) {
        const rules = this.getCountryRules(countryCode);
        const format = rules.invoiceRules?.numberFormat || 'INV-{YYYY}-{NNNNNN}';
        const now = new Date();
        const year = now.getFullYear();
        const paddedSeq = String(sequence).padStart(6, '0');
        
        return format
            .replace('{YYYY}', year)
            .replace('{NNNNNN}', paddedSeq);
    }

    /**
     * 格式化金额
     */
    formatAmount(amount, countryCode) {
        const rules = this.getCountryRules(countryCode);
        const format = rules.invoiceRules?.currencyFormat || '€{amount}';
        const decimalPlaces = rules.invoiceRules?.decimalPlaces || 2;
        const formatted = amount.toFixed(decimalPlaces);
        
        return format.replace('{amount}', formatted);
    }

    /**
     * 获取所有支持的国家列表
     */
    getSupportedCountries() {
        return Object.keys(this.rules);
    }

    /**
     * 获取国家列表（带详细信息）
     */
    getCountriesList() {
        return Object.keys(this.rules).map(code => ({
            code,
            name: this.rules[code].name,
            currency: this.rules[code].currency,
            taxSystem: this.rules[code].taxSystem,
            standardRate: this.rules[code].rates.standard,
            filingPeriod: this.rules[code].filingRules?.period || 'monthly'
        }));
    }

    /**
     * 四舍五入
     */
    roundTo(value, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /**
     * 验证 VAT 号码格式（各国规则）
     */
    validateVATNumber(countryCode, vatNumber) {
        const rules = this.getCountryRules(countryCode);
        // 基础格式验证（由各国家的 patterns 提供）
        // 这里只做基础检查
        if (!vatNumber || vatNumber.length < 5) {
            return { valid: false, message: 'VAT号码格式无效' };
        }
        return { valid: true, message: 'VAT号码有效' };
    }
}

// =============================================
// ===== 导出 =====
// =============================================
module.exports = new TaxRulesEngine();