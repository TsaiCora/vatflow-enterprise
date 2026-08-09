// backend/src/modules/fileProcessor/parsers/jp_tax.js

/**
 * 日本消费税证明解析器
 * 消費税確定申告書 - 国税庁
 */
class JpTaxParser {
    constructor() {
        this.platform = 'jp_tax';
        this.country = 'JP';
        this.type = 'import_vat_certificate';
        this.requiredFields = ['period', 'tax_number', 'total_import_tax'];
        this.fieldMap = {
            '申告期間': 'period',
            '法人番号': 'tax_number',
            '消費税額': 'total_import_tax',
            '課税売上高': 'total_customs_value'
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
        if (firstLine.includes('申告') || firstLine.includes('消費税')) return 'csv';
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.period && !row.申告期間) continue;

            const period = row.申告期間 || row.period || '';
            results.push({
                type: 'jp_import_tax',
                country: 'JP',
                taxNumber: row.法人番号 || row.tax_number || '',
                period: period,
                year: parseInt(period.substring(0, 4)) || 0,
                month: parseInt(period.substring(4, 6)) || 0,
                totalImportTax: parseFloat(row.消費税額 || row.total_import_tax || 0),
                totalCustomsValue: parseFloat(row.課税売上高 || row.total_customs_value || 0),
                entries: this._parseEntries(row),
                source: 'jp_tax',
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
            country: 'JP',
            totalImportTax: data.reduce((sum, item) => sum + item.totalImportTax, 0),
            totalCustomsValue: data.reduce((sum, item) => sum + item.totalCustomsValue, 0),
            totalEntries: data.length,
            periods: [...new Set(data.map(item => item.period))],
            entries: data
        };
    }
}

module.exports = JpTaxParser;