// backend/src/services/filingService.js
/**
 * 申报数据服务
 * 整理各国申报所需数据
 */

const taxRulesEngine = require('./taxRulesEngine');

class FilingService {
    constructor() {
        this.filings = [];
    }

    /**
     * 生成申报数据
     */
    generateFilingData(tenantId, countryCode, period, transactions) {
        const rules = taxRulesEngine.getCountryRules(countryCode);
        const filingRules = rules.filingRules;
        const currency = rules.currency || 'EUR';
        const decimalPlaces = rules.invoiceRules?.decimalPlaces || 2;

        // 按税率分组汇总
        const groups = {};
        let totalNet = 0;
        let totalVAT = 0;
        let totalGross = 0;

        for (const tx of transactions) {
            const rate = tx.tax_rate || rules.rates.standard || 20;
            const net = tx.net_amount || 0;
            const vat = tx.vat_amount || 0;
            const gross = net + vat;

            if (!groups[rate]) {
                groups[rate] = {
                    rate,
                    netAmount: 0,
                    vatAmount: 0,
                    grossAmount: 0,
                    count: 0
                };
            }
            groups[rate].netAmount += net;
            groups[rate].vatAmount += vat;
            groups[rate].grossAmount += gross;
            groups[rate].count += 1;

            totalNet += net;
            totalVAT += vat;
            totalGross += gross;
        }

        // 按国家汇总
        const byCountry = {};
        for (const tx of transactions) {
            const country = tx.country || countryCode;
            if (!byCountry[country]) {
                byCountry[country] = {
                    countryCode: country,
                    netAmount: 0,
                    vatAmount: 0,
                    grossAmount: 0,
                    count: 0
                };
            }
            byCountry[country].netAmount += tx.net_amount || 0;
            byCountry[country].vatAmount += tx.vat_amount || 0;
            byCountry[country].grossAmount += (tx.net_amount || 0) + (tx.vat_amount || 0);
            byCountry[country].count += 1;
        }

        // 构建申报数据
        const filingData = {
            filingId: `FIL-${Date.now()}-${countryCode}`,
            tenantId,
            countryCode,
            countryName: rules.name,
            taxSystem: rules.taxSystem,
            period,
            currency,
            dueDate: filingRules?.dueDate || null,
            filingFormat: filingRules?.format || 'VAT-100',
            summary: {
                totalNet: taxRulesEngine.roundTo(totalNet, decimalPlaces),
                totalVAT: taxRulesEngine.roundTo(totalVAT, decimalPlaces),
                totalGross: taxRulesEngine.roundTo(totalGross, decimalPlaces),
                transactionCount: transactions.length
            },
            byRate: groups,
            byCountry: Object.values(byCountry),
            transactions: transactions.map(tx => ({
                id: tx.id,
                order_id: tx.order_id,
                country: tx.country,
                net_amount: tx.net_amount,
                vat_amount: tx.vat_amount,
                gross_amount: (tx.net_amount || 0) + (tx.vat_amount || 0)
            })),
            status: 'draft',
            generatedAt: new Date().toISOString(),
            filingRules
        };

        // 保存申报数据
        this.filings.push(filingData);
        return filingData;
    }

    /**
     * 获取申报数据列表
     */
    getFilings(tenantId, filters = {}) {
        let result = this.filings.filter(f => f.tenantId === tenantId);
        
        if (filters.countryCode) {
            result = result.filter(f => f.countryCode === filters.countryCode);
        }
        if (filters.period) {
            result = result.filter(f => f.period === filters.period);
        }
        if (filters.status) {
            result = result.filter(f => f.status === filters.status);
        }
        
        return result;
    }

    /**
     * 获取单个申报
     */
    getFiling(filingId) {
        return this.filings.find(f => f.filingId === filingId) || null;
    }

    /**
     * 更新申报状态
     */
    updateFilingStatus(filingId, status) {
        const filing = this.getFiling(filingId);
        if (!filing) {
            throw new Error(`申报不存在: ${filingId}`);
        }
        filing.status = status;
        filing.updatedAt = new Date().toISOString();
        return filing;
    }

    /**
     * 导出申报数据（CSV格式）
     */
    exportCSV(filingId) {
        const filing = this.getFiling(filingId);
        if (!filing) {
            throw new Error(`申报不存在: ${filingId}`);
        }

        const headers = ['交易ID', '订单号', '国家', '净额', 'VAT', '总额'];
        const rows = filing.transactions.map(tx => [
            tx.id,
            tx.order_id,
            tx.country,
            tx.net_amount.toFixed(2),
            tx.vat_amount.toFixed(2),
            tx.gross_amount.toFixed(2)
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csv;
    }

    /**
     * 导出申报数据（JSON格式）
     */
    exportJSON(filingId) {
        const filing = this.getFiling(filingId);
        if (!filing) {
            throw new Error(`申报不存在: ${filingId}`);
        }
        return JSON.stringify(filing, null, 2);
    }
}

module.exports = new FilingService();