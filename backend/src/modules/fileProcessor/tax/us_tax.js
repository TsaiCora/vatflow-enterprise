// backend/src/modules/fileProcessor/parsers/us_tax.js

/**
 * 美国销售税解析器
 * Sales Tax Return - State Tax Authority
 * 注意：美国没有联邦消费税，各州税率不同
 */
class UsTaxParser {
    constructor() {
        this.platform = 'us_tax';
        this.country = 'US';
        this.type = 'sales_tax';
        this.requiredFields = ['period', 'state', 'total_sales_tax'];
        this.stateRates = {
            'CA': 7.25, 'TX': 6.25, 'NY': 4.0, 'FL': 6.0,
            'IL': 6.25, 'PA': 6.0, 'OH': 5.75, 'GA': 4.0,
            'NC': 4.75, 'MI': 6.0, 'NJ': 6.625, 'VA': 5.3,
            'WA': 6.5, 'MA': 6.25, 'TN': 7.0, 'IN': 7.0,
            'MO': 4.225, 'MD': 6.0, 'WI': 5.0, 'MN': 6.875,
            'CO': 2.9, 'SC': 6.0, 'AL': 4.0, 'LA': 4.45,
            'KY': 6.0, 'OR': 0.0, 'AK': 0.0, 'NH': 0.0,
            'DE': 0.0, 'MT': 0.0
        };
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
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.period) continue;

            const state = row.state || row.州 || '';
            results.push({
                type: 'us_sales_tax',
                country: 'US',
                state: state,
                stateRate: this.stateRates[state] || 0,
                period: row.period || '',
                year: parseInt((row.period || '').substring(0, 4)) || 0,
                month: parseInt((row.period || '').substring(4, 6)) || 0,
                totalSalesTax: parseFloat(row.total_sales_tax || row.销售税 || 0),
                totalSalesAmount: parseFloat(row.total_sales || row.销售额 || 0),
                entries: this._parseEntries(row),
                source: 'us_tax',
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

    extractSummary(data) {
        const stateSummary = {};
        for (const item of data) {
            if (!stateSummary[item.state]) {
                stateSummary[item.state] = {
                    state: item.state,
                    totalSalesTax: 0,
                    totalSalesAmount: 0,
                    entries: 0
                };
            }
            stateSummary[item.state].totalSalesTax += item.totalSalesTax;
            stateSummary[item.state].totalSalesAmount += item.totalSalesAmount;
            stateSummary[item.state].entries += 1;
        }
        return {
            country: 'US',
            totalSalesTax: data.reduce((sum, item) => sum + item.totalSalesTax, 0),
            totalSalesAmount: data.reduce((sum, item) => sum + item.totalSalesAmount, 0),
            totalEntries: data.length,
            states: stateSummary,
            entries: data
        };
    }
}

module.exports = UsTaxParser;