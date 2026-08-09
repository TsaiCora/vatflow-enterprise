// backend/src/modules/fileProcessor/parsers/sg_tax.js

/**
 * 新加坡 GST 解析器
 * GST Return - Inland Revenue Authority of Singapore
 */
class SgTaxParser {
    constructor() {
        this.platform = 'sg_tax';
        this.country = 'SG';
        this.type = 'gst_return';
        this.requiredFields = ['period', 'gst_reg_number', 'total_gst'];
        this.gstRate = 7;
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
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.period) continue;

            results.push({
                type: 'sg_gst',
                country: 'SG',
                gstRegNumber: row.gst_reg_number || row.gst注册号 || '',
                period: row.period || '',
                year: parseInt((row.period || '').substring(0, 4)) || 0,
                month: parseInt((row.period || '').substring(4, 6)) || 0,
                totalGST: parseFloat(row.total_gst || row.gst总额 || 0),
                totalSalesAmount: parseFloat(row.total_sales || row.销售额 || 0),
                gstRate: this.gstRate,
                entries: this._parseEntries(row),
                source: 'sg_tax',
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
            country: 'SG',
            totalGST: data.reduce((sum, item) => sum + item.totalGST, 0),
            totalSalesAmount: data.reduce((sum, item) => sum + item.totalSalesAmount, 0),
            totalEntries: data.length,
            periods: [...new Set(data.map(item => item.period))],
            entries: data
        };
    }
}

module.exports = SgTaxParser;