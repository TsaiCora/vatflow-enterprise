// backend/src/modules/fileProcessor/parsers/c88.js

/**
 * 英国 C88 海关进口清关单解析器
 * C88 是每票货物的清关记录（已逐步被 CDS 系统取代）
 */
class C88Parser {
    constructor() {
        this.platform = 'c88';
        this.type = 'customs_clearance';
        this.requiredFields = ['entry_number', 'entry_date', 'customs_value', 'import_vat', 'vat_number'];
    }

    /**
     * 解析 C88 文件
     */
    parse(content, options = {}) {
        const lines = content.split('\n');
        const format = this._detectFormat(lines);

        if (format === 'csv' || format === 'excel') {
            return this._parseCSV(lines);
        } else if (format === 'pdf') {
            return this._parsePDF(content);
        } else {
            return this._parseText(lines);
        }
    }

    _detectFormat(lines) {
        const firstLine = lines[0] || '';
        if (firstLine.includes('C88') || firstLine.includes('SAD')) {
            return 'pdf';
        }
        if (firstLine.includes(',')) {
            return 'csv';
        }
        return 'text';
    }

    _parseCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.entry_number) continue;

            results.push({
                type: 'c88',
                vatNumber: row.vat_number || '',
                entryNumber: row.entry_number || '',
                entryDate: row.entry_date || '',
                customsValue: parseFloat(row.customs_value || 0),
                importVat: parseFloat(row.import_vat || 0),
                dutyAmount: parseFloat(row.duty_amount || 0),
                exciseDuty: parseFloat(row.excise_duty || 0),
                // 货物明细
                goodsDescription: row.goods_description || '',
                commodityCode: row.commodity_code || '',
                quantity: parseFloat(row.quantity || 0),
                unit: row.unit || '',
                countryOfOrigin: row.country_of_origin || '',
                // 清关信息
                customsOffice: row.customs_office || '',
                clearanceDate: row.clearance_date || '',
                defermentAccount: row.deferment_account || '',
                isPVA: row.deferment_type === 'PVA' || false,
                source: 'c88',
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

    _parsePDF(content) {
        // C88 PDF 解析
        return {
            type: 'c88',
            format: 'pdf',
            status: 'pdf_detected',
            message: 'PDF 格式需要先转换为 CSV 或手动录入'
        };
    }

    _parseText(lines) {
        // 文本格式解析
        const results = [];
        return results;
    }

    /**
     * 提取 C88 汇总数据
     */
    extractSummary(data) {
        const totalImportVat = data.reduce((sum, item) => sum + item.importVat, 0);
        const totalCustomsValue = data.reduce((sum, item) => sum + item.customsValue, 0);

        return {
            totalEntries: data.length,
            totalImportVat,
            totalCustomsValue,
            pvaEntries: data.filter(item => item.isPVA).length,
            entries: data
        };
    }
}

module.exports = C88Parser;