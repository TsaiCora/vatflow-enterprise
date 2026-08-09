// backend/src/modules/fileProcessor/parsers/fr_tax.js

/**
 * 法国进口增值税证明解析器
 */
class FrTaxParser {
    constructor() {
        this.platform = 'fr_tax';
        this.country = 'FR';
        this.type = 'import_vat_certificate';
        this.requiredFields = ['period', 'vat_number', 'total_import_vat'];
    }

    parse(content) {
        const lines = content.split('\n');
        const format = this._detectFormat(lines);

        if (format === 'csv') {
            return this._parseCSV(lines);
        } else {
            return this._parseText(lines);
        }
    }

    _detectFormat(lines) {
        const firstLine = lines[0] || '';
        if (firstLine.includes(',')) return 'csv';
        if (firstLine.includes('TVA') || firstLine.includes('TVA à déduire')) return 'text';
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.period) continue;

            results.push({
                type: 'fr_import_vat',
                country: 'FR',
                vatNumber: row.vat_number || '',
                siret: row.siret || '',
                period: row.period || '',
                totalImportVat: parseFloat(row.total_import_vat || 0),
                totalCustomsValue: parseFloat(row.total_customs_value || 0),
                entries: this._parseEntries(row),
                source: 'fr_tax',
                created_at: new Date().toISOString()
            });
        }
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
}

module.exports = FrTaxParser;