// backend/src/modules/fileProcessor/parsers/be_tax.js

/**
 * 比利时进口增值税证明解析器
 * Certificat TVA - SPF Finances
 */
class BeTaxParser {
    constructor() {
        this.platform = 'be_tax';
        this.country = 'BE';
        this.type = 'import_vat_certificate';
        this.requiredFields = ['period', 'vat_number', 'total_import_vat'];
        this.fieldMap = {
            'periode': 'period',
            'num_tva': 'vat_number',
            'tva_deductible': 'total_import_vat',
            'valeur_douane': 'total_customs_value'
        };
    }

    parse(content) {
        const lines = content.split('\n');
        const format = this._detectFormat(lines);

        if (format === 'csv') {
            return this._parseCSV(lines);
        } else if (format === 'xml') {
            return this._parseXML(content);
        } else {
            return this._parseText(lines);
        }
    }

    _detectFormat(lines) {
        const firstLine = lines[0] || '';
        if (firstLine.includes('<?xml')) return 'xml';
        if (firstLine.includes(',')) return 'csv';
        if (firstLine.includes('periode') || firstLine.includes('tva')) return 'csv';
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.period && !row.periode) continue;

            const period = row.periode || row.period || '';
            results.push({
                type: 'be_import_vat',
                country: 'BE',
                vatNumber: row.num_tva || row.vat_number || '',
                period: period,
                year: parseInt(period.substring(0, 4)) || 0,
                month: parseInt(period.substring(4, 6)) || 0,
                totalImportVat: parseFloat(row.tva_deductible || row.total_import_vat || 0),
                totalCustomsValue: parseFloat(row.valeur_douane || row.total_customs_value || 0),
                entries: this._parseEntries(row),
                source: 'be_tax',
                created_at: new Date().toISOString()
            });
        }
        return results;
    }

    _parseXML(content) {
        const results = [];
        return results;
    }

    _parseRow(line, headers) {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        return row;
    }

    _parseEntries(row) {
        return [];
    }

    _parseText(lines) {
        const results = [];
        return results;
    }

    extractSummary(data) {
        return {
            country: 'BE',
            totalImportVat: data.reduce((sum, item) => sum + item.totalImportVat, 0),
            totalCustomsValue: data.reduce((sum, item) => sum + item.totalCustomsValue, 0),
            totalEntries: data.length,
            periods: [...new Set(data.map(item => item.period))],
            entries: data
        };
    }
}

module.exports = BeTaxParser;