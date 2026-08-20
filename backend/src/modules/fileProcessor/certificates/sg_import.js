// backend/src/modules/fileProcessor/certificates/sg_import.js
/**
 * 新加坡进口VAT证明文件解析器
 * GST Return - IRAS
 */

class SGImportParser {
    constructor() {
        this.country = 'SG';
        this.countryName = '新加坡';
        this.vatProof = 'GST Return';
        this.customsDoc = 'Import Declaration';
        this.authority = 'IRAS';
        this.period = '月度';
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
        const match = content.match(/Document Number:?\s*([A-Z0-9\-]+)/i);
        return match ? match[1] : null;
    }

    extractDate(content) {
        const match = content.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
        return match ? match[1] : null;
    }

    extractVATNumber(content) {
        const match = content.match(/VAT Number:?\s*([A-Z0-9]+)/i);
        return match ? match[1] : null;
    }

    extractTotalValue(content) {
        const match = content.match(/Total Value:?\s*([\d,.]+)/i);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    extractVATAmount(content) {
        const match = content.match(/VAT Amount:?\s*([\d,.]+)/i);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    extractCustomsValue(content) {
        const match = content.match(/Customs Value:?\s*([\d,.]+)/i);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    extractPeriod(content) {
        const match = content.match(/(\d{4})[\-\s]*(Q[1-4])/i);
        return match ? `${match[1]}-${match[2]}` : null;
    }

    validate(data) {
        const errors = [];
        if (!data.vatNumber) errors.push('VAT号码缺失');
        if (!data.totalValue || data.totalValue <= 0) errors.push('总金额无效');
        return { valid: errors.length === 0, errors };
    }
}

module.exports = new SGImportParser();
