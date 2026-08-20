// scripts/generateImportParsers.js
/**
 * 批量生成各国进口文件解析器
 */

const fs = require('fs');
const path = require('path');

const countries = [
    // 欧洲
    { code: 'be', name: '比利时', vatProof: 'Certificat TVA', customsDoc: 'Document douanier', authority: 'Service Public Fédéral Finances', period: '月度' },
    { code: 'pl', name: '波兰', vatProof: 'Deklaracja VAT', customsDoc: 'Dokument celny', authority: 'Krajowa Administracja Skarbowa', period: '月度' },
    { code: 'se', name: '瑞典', vatProof: 'Momsbesked', customsDoc: 'Tulldeklaration', authority: 'Skatteverket', period: '月度' },
    { code: 'dk', name: '丹麦', vatProof: 'Momsangivelse', customsDoc: 'Tolddeklaration', authority: 'Skattestyrelsen', period: '月度' },
    { code: 'fi', name: '芬兰', vatProof: 'ALV-ilmoitus', customsDoc: 'Tulli-ilmoitus', authority: 'Verohallinto', period: '月度' },
    { code: 'ie', name: '爱尔兰', vatProof: 'VAT Return', customsDoc: 'Customs Declaration', authority: 'Revenue Commissioners', period: '月度' },
    { code: 'pt', name: '葡萄牙', vatProof: 'Declaração de IVA', customsDoc: 'Declaração aduaneira', authority: 'Autoridade Tributária', period: '月度' },
    { code: 'at', name: '奥地利', vatProof: 'UVA-Meldung', customsDoc: 'Zollanmeldung', authority: 'Finanzamt', period: '月度' },
    { code: 'no', name: '挪威', vatProof: 'MVA-melding', customsDoc: 'Tolldeklarasjon', authority: 'Skatteetaten', period: '月度' },
    { code: 'ch', name: '瑞士', vatProof: 'MWST-Abrechnung', customsDoc: 'Zollanmeldung', authority: 'Eidgenössische Steuerverwaltung', period: '季度' },
    { code: 'ru', name: '俄罗斯', vatProof: 'НДС-декларация', customsDoc: 'Таможенная декларация', authority: 'ФНС России', period: '季度' },
    // 亚洲
    { code: 'jp', name: '日本', vatProof: '消費税申告書', customsDoc: '輸入許可書', authority: '国税庁', period: '月度' },
    { code: 'kr', name: '韩国', vatProof: '부가가치세 신고서', customsDoc: '수입신고서', authority: '국세청', period: '月度' },
    { code: 'cn', name: '中国', vatProof: '增值税申报表', customsDoc: '进口报关单', authority: '国家税务总局', period: '月度' },
    { code: 'sg', name: '新加坡', vatProof: 'GST Return', customsDoc: 'Import Declaration', authority: 'IRAS', period: '月度' },
    { code: 'my', name: '马来西亚', vatProof: 'SST Return', customsDoc: 'Import Declaration', authority: 'Royal Malaysian Customs', period: '月度' },
    { code: 'th', name: '泰国', vatProof: 'ภาษีมูลค่าเพิ่ม', customsDoc: 'ใบขนสินค้าขาเข้า', authority: 'กรมสรรพากร', period: '月度' },
    { code: 'vn', name: '越南', vatProof: 'Tờ khai thuế GTGT', customsDoc: 'Tờ khai hải quan', authority: 'Tổng cục Thuế', period: '月度' },
    { code: 'id', name: '印度尼西亚', vatProof: 'SPT PPN', customsDoc: 'Pemberitahuan Impor', authority: 'Direktorat Jenderal Pajak', period: '月度' },
    { code: 'ph', name: '菲律宾', vatProof: 'VAT Return', customsDoc: 'Import Declaration', authority: 'Bureau of Internal Revenue', period: '月度' },
    { code: 'in', name: '印度', vatProof: 'GSTR-1', customsDoc: 'Bill of Entry', authority: 'Central Board of Indirect Taxes', period: '月度' },
    // 美洲
    { code: 'us', name: '美国', vatProof: 'Sales Tax Return', customsDoc: 'Customs Entry', authority: 'IRS / CBP', period: '月度' },
    { code: 'ca', name: '加拿大', vatProof: 'GST/HST Return', customsDoc: 'Customs Invoice', authority: 'CRA', period: '月度' },
    { code: 'mx', name: '墨西哥', vatProof: 'Declaración de IVA', customsDoc: 'Pedimento de importación', authority: 'SAT', period: '月度' },
    { code: 'br', name: '巴西', vatProof: 'Declaração de ICMS', customsDoc: 'DI - Declaração de Importação', authority: 'Receita Federal', period: '月度' },
    // 大洋洲
    { code: 'au', name: '澳大利亚', vatProof: 'BAS', customsDoc: 'Import Declaration', authority: 'Australian Tax Office', period: '月度' },
    { code: 'nz', name: '新西兰', vatProof: 'GST Return', customsDoc: 'Import Declaration', authority: 'Inland Revenue', period: '月度' },
    // 非洲
    { code: 'za', name: '南非', vatProof: 'VAT Return', customsDoc: 'Customs Declaration', authority: 'SARS', period: '月度' },
    // 中东
    { code: 'ae', name: '阿联酋', vatProof: 'VAT Return', customsDoc: 'Customs Declaration', authority: 'FTA', period: '月度' },
    { code: 'tr', name: '土耳其', vatProof: 'KDV Beyannamesi', customsDoc: 'Gümrük Beyannamesi', authority: 'Gelir İdaresi Başkanlığı', period: '月度' },
];

const template = (c) => `// backend/src/modules/fileProcessor/certificates/${c.code}_import.js
/**
 * ${c.name}进口VAT证明文件解析器
 * ${c.vatProof} - ${c.authority}
 */

class ${c.code.toUpperCase()}ImportParser {
    constructor() {
        this.country = '${c.code.toUpperCase()}';
        this.countryName = '${c.name}';
        this.vatProof = '${c.vatProof}';
        this.customsDoc = '${c.customsDoc}';
        this.authority = '${c.authority}';
        this.period = '${c.period}';
        this.format = 'PDF/XML';
    }

    async parse(fileContent, fileType = 'pdf') {
        try {
            const result = {
                success: true,
                country: this.country,
                countryName: this.countryName,
                documentType: this.vatProof,
                parsedData: {
                    documentNumber: this.extractDocumentNumber(fileContent),
                    importDate: this.extractDate(fileContent),
                    vatNumber: this.extractVATNumber(fileContent),
                    totalValue: this.extractTotalValue(fileContent),
                    vatAmount: this.extractVATAmount(fileContent),
                    customsValue: this.extractCustomsValue(fileContent),
                    period: this.extractPeriod(fileContent)
                },
                rawData: fileContent,
                warnings: [],
                errors: []
            };

            return result;
        } catch (error) {
            return {
                success: false,
                country: this.country,
                error: error.message
            };
        }
    }

    extractDocumentNumber(content) {
        const match = content.match(/Document Number:?\\s*([A-Z0-9\\-]+)/i);
        return match ? match[1] : null;
    }

    extractDate(content) {
        const match = content.match(/(\\d{4}[-/]\\d{2}[-/]\\d{2})/);
        return match ? match[1] : null;
    }

    extractVATNumber(content) {
        const match = content.match(/VAT Number:?\\s*([A-Z0-9]+)/i);
        return match ? match[1] : null;
    }

    extractTotalValue(content) {
        const match = content.match(/Total Value:?\\s*([\\d,\.]+)/i);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    extractVATAmount(content) {
        const match = content.match(/VAT Amount:?\\s*([\\d,\.]+)/i);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    extractCustomsValue(content) {
        const match = content.match(/Customs Value:?\\s*([\\d,\.]+)/i);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    extractPeriod(content) {
        const match = content.match(/(\\d{4})[\\-\\s]*(Q[1-4])/i);
        return match ? \`\${match[1]}-\${match[2]}\` : null;
    }

    validate(data) {
        const errors = [];
        if (!data.vatNumber) errors.push('VAT号码缺失');
        if (!data.totalValue || data.totalValue <= 0) errors.push('总金额无效');
        return { valid: errors.length === 0, errors };
    }
}

module.exports = new ${c.code.toUpperCase()}ImportParser();
`;

// 生成文件
const outputDir = path.join(__dirname, '../backend/src/modules/fileProcessor/certificates');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

countries.forEach(c => {
    const filename = `${c.code}_import.js`;
    const filepath = path.join(outputDir, filename);
    const content = template(c);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`✅ 生成: ${filename}`);
});

console.log(`\n🎉 共生成 ${countries.length} 个国家的进口文件解析器！`);