// frontend/src/modules/fileProcessor/parsers/mercari.js

/**
 * Mercari 订单解析器
 */
class MercariParser {
    constructor() {
        this.platform = 'mercari';
        this.requiredFields = ['order_id', 'order_date', 'customer_name', 'total_amount', 'vat_amount', 'country'];
    }

    parse(content, options = {}) {
        const lines = content.split('\n');
        const headers = this._parseHeaders(lines[0]);
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const row = this._parseRow(lines[i], headers);
            if (!row.order_id) continue;

            results.push({
                orderId: row.order_id,
                orderDate: row.order_date,
                customerName: row.customer_name,
                customerEmail: row.customer_email || '',
                totalAmount: parseFloat(row.total_amount || 0),
                vatAmount: parseFloat(row.vat_amount || 0),
                netAmount: parseFloat(row.total_amount || 0) - parseFloat(row.vat_amount || 0),
                country: row.country || 'JP',
                currency: row.currency || 'JPY',
                vatNumber: row.vat_number || '',
                platform: 'mercari',
                status: 'pending'
            });
        }

        return results;
    }

    _parseHeaders(line) {
        return line.split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    }

    _parseRow(line, headers) {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        return row;
    }
}

module.exports = MercariParser;