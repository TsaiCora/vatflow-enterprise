// backend/src/modules/fileProcessor/certificates/es_import.js
/**
 * 西班牙进口VAT证明文件解析器
 * Certificado de IVA - 税务机构签发
 */

class EsImportParser {
    constructor() {
        this.country = 'ES';
        this.countryName = '西班牙';
        this.vatProof = 'Certificado de IVA';
        this.customsDoc = 'Documento de despacho';
        this.authority = 'Agencia Tributaria';
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
        const match = content.match(/Número de documento:?\s*([A-Z0-9\-]+)/i);
        return match ? match[1] : null;
    }

    extractDate(content) {
        const match = content.match(/(\d{2}\/\d{2}\/\d{4})/);
        return match ? match[1] : null;
    }

    extractVATNumber(content) {
        const match = content.match(/Número IVA:?\s*([A-Z0-9]+)/i);
        return match ? match[1] : null;
    }

    extractTotalValue(content) {
        const match = content.match(/Importe total:?\s*€?\s*([\d,\.]+)/i);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    extractVATAmount(content) {
        const match = content.match(/IVA:?\s*€?\s*([\d,\.]+)/i);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    extractCustomsValue(content) {
        const match = content.match(/Valor en aduana:?\s*€?\s*([\d,\.]+)/i);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    extractPeriod(content) {
        const match = content.match(/(\d{4})[-\s]*(Q[1-4])/i);
        return match ? `${match[1]}-${match[2]}` : null;
    }

    validate(data) {
        const errors = [];
        if (!data.vatNumber) errors.push('VAT号码缺失');
        if (!data.totalValue || data.totalValue <= 0) errors.push('总金额无效');
        return { valid: errors.length === 0, errors };
    }
}

module.exports = new EsImportParser();