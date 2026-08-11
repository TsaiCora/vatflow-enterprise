// backend/src/modules/fileProcessor/parsers/se_tax.js

/**
 * 瑞典进口增值税证明解析器
 * Momsbesked - Skatteverket
 */
class SeTaxParser {
    constructor() {
        this.platform = 'se_tax';
        this.country = 'SE';
        this.type = 'import_vat_certificate';
        this.requiredFields = ['period', 'vat_number', 'total_import_vat'];
        this.fieldMap = {
            'period': 'period',
            'org_nr': 'vat_number',
            'ing_ moms': 'total_import_vat',
            'tullvarde': 'total_customs_value'
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
        if (firstLine.includes('period') || firstLine.includes('moms')) return 'csv';
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.period) continue;

            results.push({
                type: 'se_import_vat',
                country: 'SE',
                vatNumber: row.org_nr || row.vat_number || '',
                period: row.period || '',
                year: parseInt(row.period.substring(0, 4)) || 0,
                month: parseInt(row.period.substring(4, 6)) || 0,
                totalImportVat: parseFloat(row.ing_moms || row.total_import_vat || 0),
                totalCustomsValue: parseFloat(row.tullvarde || row.total_customs_value || 0),
                entries: this._parseEntries(row),
                source: 'se_tax',
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
            country: 'SE',
            totalImportVat: data.reduce((sum, item) => sum + item.totalImportVat, 0),
            totalCustomsValue: data.reduce((sum, item) => sum + item.totalCustomsValue, 0),
            totalEntries: data.length,
            periods: [...new Set(data.map(item => item.period))],
            entries: data
        };
    }
}

module.exports = SeTaxParser;