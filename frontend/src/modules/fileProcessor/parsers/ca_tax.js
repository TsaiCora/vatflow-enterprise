// backend/src/modules/fileProcessor/parsers/ca_tax.js

/**
 * 加拿大 GST/HST 解析器
 * GST/HST Return - Canada Revenue Agency
 */
class CaTaxParser {
    constructor() {
        this.platform = 'ca_tax';
        this.country = 'CA';
        this.type = 'gst_hst';
        this.requiredFields = ['period', 'business_number', 'total_gst'];
        this.provinceRates = {
            'AB': 5, 'BC': 5, 'MB': 5, 'NB': 15, 'NL': 15,
            'NS': 15, 'NT': 5, 'NU': 5, 'ON': 13, 'PE': 15,
            'QC': 9.975, 'SK': 5, 'YT': 5
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
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.period) continue;

            const province = row.province || row.省 || '';
            results.push({
                type: 'ca_gst_hst',
                country: 'CA',
                businessNumber: row.business_number || row.商业编号 || '',
                province: province,
                provinceRate: this.provinceRates[province] || 5,
                period: row.period || '',
                year: parseInt((row.period || '').substring(0, 4)) || 0,
                month: parseInt((row.period || '').substring(4, 6)) || 0,
                totalGST: parseFloat(row.total_gst || row.gst总额 || 0),
                totalSalesAmount: parseFloat(row.total_sales || row.销售额 || 0),
                entries: this._parseEntries(row),
                source: 'ca_tax',
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
        const provinceSummary = {};
        for (const item of data) {
            if (!provinceSummary[item.province]) {
                provinceSummary[item.province] = {
                    province: item.province,
                    totalGST: 0,
                    totalSalesAmount: 0,
                    entries: 0
                };
            }
            provinceSummary[item.province].totalGST += item.totalGST;
            provinceSummary[item.province].totalSalesAmount += item.totalSalesAmount;
            provinceSummary[item.province].entries += 1;
        }
        return {
            country: 'CA',
            totalGST: data.reduce((sum, item) => sum + item.totalGST, 0),
            totalSalesAmount: data.reduce((sum, item) => sum + item.totalSalesAmount, 0),
            totalEntries: data.length,
            provinces: provinceSummary,
            entries: data
        };
    }
}

module.exports = CaTaxParser;