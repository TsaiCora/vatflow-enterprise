// backend/src/modules/fileProcessor/parsers/de_tax.js

/**
 * 德国进口增值税证明解析器
 */
class DeTaxParser {
    constructor() {
        this.platform = 'de_tax';
        this.country = 'DE';
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
        if (firstLine.includes('Steuernummer') || firstLine.includes('Umsatzsteuer')) return 'text';
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.period) continue;

            results.push({
                type: 'de_import_vat',
                country: 'DE',
                vatNumber: row.vat_number || '',
                taxId: row.tax_id || '',
                period: row.period || '',
                totalImportVat: parseFloat(row.total_import_vat || 0),
                totalCustomsValue: parseFloat(row.total_customs_value || 0),
                entries: this._parseEntries(row),
                source: 'de_tax',
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
        // 解析德国进口明细
        return [];
    }

    _parseText(lines) {
        // 文本格式解析
        const results = [];
        return results;
    }
}

module.exports = DeTaxParser;