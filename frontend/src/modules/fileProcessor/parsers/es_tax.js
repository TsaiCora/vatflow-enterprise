// backend/src/modules/fileProcessor/parsers/es_tax.js

/**
 * 西班牙进口增值税证明解析器
 * Certificado de IVA - Agencia Tributaria
 */
class EsTaxParser {
    constructor() {
        this.platform = 'es_tax';
        this.country = 'ES';
        this.type = 'import_vat_certificate';
        this.requiredFields = ['period', 'vat_number', 'total_import_vat'];
        this.fieldMap = {
            'periodo': 'period',
            'nif': 'vat_number',
            'iva_soportado': 'total_import_vat',
            'base_imponible': 'total_customs_value',
            'numero_operaciones': 'entry_count'
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
        if (firstLine.includes('periodo') || firstLine.includes('nif')) return 'csv';
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.period && !row.nif) continue;

            const period = row.periodo || row.period || '';
            results.push({
                type: 'es_import_vat',
                country: 'ES',
                vatNumber: row.nif || row.vat_number || '',
                period: period,
                year: parseInt(period.substring(0, 4)) || 0,
                month: parseInt(period.substring(4, 6)) || 0,
                totalImportVat: parseFloat(row.iva_soportado || row.total_import_vat || 0),
                totalCustomsValue: parseFloat(row.base_imponible || row.total_customs_value || 0),
                entryCount: parseInt(row.numero_operaciones || row.entry_count || 0),
                entries: this._parseEntries(row),
                source: 'es_tax',
                created_at: new Date().toISOString()
            });
        }
        return results;
    }

    _parseXML(content) {
        // XML 格式解析（西班牙税务系统常用）
        const results = [];
        // 使用 xml2js 或简单正则解析
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
            country: 'ES',
            totalImportVat: data.reduce((sum, item) => sum + item.totalImportVat, 0),
            totalCustomsValue: data.reduce((sum, item) => sum + item.totalCustomsValue, 0),
            totalEntries: data.length,
            periods: [...new Set(data.map(item => item.period))],
            entries: data
        };
    }
}

module.exports = EsTaxParser;