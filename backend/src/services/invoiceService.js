// backend/src/services/invoiceService.js
/**
 * 发票生成服务
 * 参考 Quaderno API 设计
 */

const taxRulesEngine = require('./taxRulesEngine');

class InvoiceService {
    constructor() {
        this.invoices = [];
        this.sequenceCounter = {};
    }

    /**
     * 生成发票
     */
    createInvoice(data) {
        const {
            tenantId,
            countryCode,
            transactionIds,
            buyerName,
            buyerAddress,
            buyerVATNumber,
            items,
            issueDate = new Date().toISOString().split('T')[0],
            dueDays = 30
        } = data;

        // 获取国家规则
        const rules = taxRulesEngine.getCountryRules(countryCode);
        const currency = rules.currency || 'EUR';
        const decimalPlaces = rules.invoiceRules?.decimalPlaces || 2;

        // 生成发票编号
        const sequence = this.getNextSequence(tenantId);
        const invoiceNumber = taxRulesEngine.generateInvoiceNumber(countryCode, sequence);

        // 计算总计
        let totalNet = 0;
        let totalVAT = 0;
        const invoiceItems = [];

        for (const item of items) {
            const netAmount = item.amount || 0;
            const rate = item.vatRate || taxRulesEngine.getTaxRate(countryCode);
            const vatAmount = netAmount * (rate / 100);
            
            totalNet += netAmount;
            totalVAT += vatAmount;
            
            invoiceItems.push({
                description: item.description || '商品/服务',
                quantity: item.quantity || 1,
                unitPrice: netAmount / (item.quantity || 1),
                netAmount: taxRulesEngine.roundTo(netAmount, decimalPlaces),
                vatRate: rate,
                vatAmount: taxRulesEngine.roundTo(vatAmount, decimalPlaces)
            });
        }

        const totalGross = totalNet + totalVAT;

        // 计算到期日期
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + (dueDays || rules.invoiceRules?.dueDays || 30));

        // 构建发票对象
        const invoice = {
            invoiceNumber,
            tenantId,
            countryCode,
            countryName: rules.name,
            currency,
            issueDate,
            dueDate: dueDate.toISOString().split('T')[0],
            buyer: {
                name: buyerName,
                address: buyerAddress,
                vatNumber: buyerVATNumber
            },
            items: invoiceItems,
            summary: {
                totalNet: taxRulesEngine.roundTo(totalNet, decimalPlaces),
                totalVAT: taxRulesEngine.roundTo(totalVAT, decimalPlaces),
                totalGross: taxRulesEngine.roundTo(totalGross, decimalPlaces)
            },
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            transactionIds: transactionIds || []
        };

        // 保存发票
        this.invoices.push(invoice);
        
        return invoice;
    }

    /**
     * 获取下一个序列号
     */
    getNextSequence(tenantId) {
        if (!this.sequenceCounter[tenantId]) {
            this.sequenceCounter[tenantId] = 1;
        }
        return this.sequenceCounter[tenantId]++;
    }

    /**
     * 获取发票列表
     */
    getInvoices(tenantId, filters = {}) {
        let result = this.invoices.filter(inv => inv.tenantId === tenantId);
        
        if (filters.countryCode) {
            result = result.filter(inv => inv.countryCode === filters.countryCode);
        }
        if (filters.status) {
            result = result.filter(inv => inv.status === filters.status);
        }
        if (filters.startDate) {
            result = result.filter(inv => inv.issueDate >= filters.startDate);
        }
        if (filters.endDate) {
            result = result.filter(inv => inv.issueDate <= filters.endDate);
        }
        
        return result;
    }

    /**
     * 获取单个发票
     */
    getInvoice(invoiceNumber) {
        return this.invoices.find(inv => inv.invoiceNumber === invoiceNumber) || null;
    }

    /**
     * 更新发票状态
     */
    updateInvoiceStatus(invoiceNumber, status) {
        const invoice = this.getInvoice(invoiceNumber);
        if (!invoice) {
            throw new Error(`发票不存在: ${invoiceNumber}`);
        }
        invoice.status = status;
        invoice.updatedAt = new Date().toISOString();
        return invoice;
    }

    /**
     * 生成发票 HTML
     */
    generateInvoiceHTML(invoice) {
        const rules = taxRulesEngine.getCountryRules(invoice.countryCode);
        const currencySymbol = this.getCurrencySymbol(rules.currency);
        
        let itemsHTML = invoice.items.map(item => `
            <tr>
                <td>${item.description}</td>
                <td align="center">${item.quantity}</td>
                <td align="right">${currencySymbol}${item.unitPrice.toFixed(2)}</td>
                <td align="center">${item.vatRate}%</td>
                <td align="right">${currencySymbol}${item.netAmount.toFixed(2)}</td>
                <td align="right">${currencySymbol}${item.vatAmount.toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>发票 ${invoice.invoiceNumber}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; }
                    .header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
                    .header h1 { color: #1976d2; margin: 0; }
                    .info { margin: 20px 0; display: flex; justify-content: space-between; }
                    .info div { padding: 10px; background: #f5f5f5; border-radius: 4px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #1976d2; color: white; padding: 10px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #ddd; }
                    .summary { text-align: right; margin-top: 20px; }
                    .total-row { font-weight: bold; font-size: 1.2em; }
                    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>VATFlow 发票</h1>
                    <p>${invoice.invoiceNumber}</p>
                </div>
                
                <div class="info">
                    <div>
                        <strong>客户:</strong> ${invoice.buyer.name}<br>
                        <strong>地址:</strong> ${invoice.buyer.address || '-'}<br>
                        <strong>VAT号码:</strong> ${invoice.buyer.vatNumber || '-'}
                    </div>
                    <div>
                        <strong>发票日期:</strong> ${invoice.issueDate}<br>
                        <strong>到期日期:</strong> ${invoice.dueDate}<br>
                        <strong>国家:</strong> ${invoice.countryName}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>项目</th>
                            <th>数量</th>
                            <th>单价</th>
                            <th>税率</th>
                            <th>净额</th>
                            <th>VAT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div class="summary">
                    <p>净额: ${currencySymbol}${invoice.summary.totalNet.toFixed(2)}</p>
                    <p>VAT: ${currencySymbol}${invoice.summary.totalVAT.toFixed(2)}</p>
                    <p class="total-row">总计: ${currencySymbol}${invoice.summary.totalGross.toFixed(2)}</p>
                </div>

                <div class="footer">
                    <p>© VATFlow 批量申报系统 | ${invoice.countryName} ${rules.taxSystem}</p>
                    <p>此发票由系统自动生成，具有法律效力</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * 获取货币符号
     */
    getCurrencySymbol(currency) {
        const symbols = {
            'EUR': '€',
            'GBP': '£',
            'USD': '$',
            'CNY': '¥',
            'JPY': '¥',
            'SGD': 'S$',
            'AUD': 'A$',
            'CAD': 'C$',
            'PLN': 'zł',
            'SEK': 'SEK',
            'DKK': 'DKK',
            'NOK': 'NOK',
            'CHF': 'CHF',
            'RUB': '₽',
            'KRW': '₩',
            'MYR': 'RM',
            'THB': '฿',
            'VND': '₫',
            'IDR': 'Rp',
            'PHP': '₱',
            'INR': '₹',
            'MXN': '$',
            'BRL': 'R$',
            'ZAR': 'R',
            'AED': 'د.إ',
            'TRY': '₺'
        };
        return symbols[currency] || currency;
    }
}

module.exports = new InvoiceService();