// backend/test-tax-engine.js
/**
 * 税务引擎测试脚本
 */

const taxRulesEngine = require('./src/services/taxRulesEngine');
const invoiceService = require('./src/services/invoiceService');
const filingService = require('./src/services/filingService');

async function testTaxEngine() {
    console.log('🧪 测试税务引擎...\n');

    // 1. 测试国家规则
    console.log('📋 测试国家规则:');
    const gbRules = taxRulesEngine.getCountryRules('GB');
    console.log(`  英国: 税率 ${gbRules.rates.standard}%, 货币 ${gbRules.currency}`);
    console.log(`  发票格式: ${gbRules.invoiceRules.numberFormat}`);
    console.log(`  申报周期: ${gbRules.filingRules.period}\n`);

    // 2. 测试 VAT 计算
    console.log('🧮 测试 VAT 计算:');
    const vatResult = taxRulesEngine.calculateVAT('GB', 1000);
    console.log(`  净额: ${vatResult.netAmount} ${vatResult.currency}`);
    console.log(`  VAT: ${vatResult.vatAmount} ${vatResult.currency}`);
    console.log(`  总额: ${vatResult.grossAmount} ${vatResult.currency}\n`);

    // 3. 测试 PVA 计算
    console.log('📦 测试 PVA 递延计算:');
    const pvaResult = taxRulesEngine.calculatePVA('GB', 1000);
    console.log(`  净额: ${pvaResult.netAmount} ${pvaResult.currency}`);
    console.log(`  VAT (递延): ${pvaResult.vatAmount} ${pvaResult.currency}`);
    console.log(`  递延 VAT: ${pvaResult.deferredVAT} ${pvaResult.currency}\n`);

    // 4. 测试发票生成
    console.log('📄 测试发票生成:');
    const invoice = invoiceService.createInvoice({
        tenantId: 'test_tenant',
        countryCode: 'GB',
        buyerName: '测试客户',
        buyerAddress: '伦敦',
        buyerVATNumber: 'GB123456789',
        items: [
            { description: '商品A', amount: 500 },
            { description: '商品B', amount: 300 },
            { description: '服务费', amount: 200 }
        ]
    });
    console.log(`  发票编号: ${invoice.invoiceNumber}`);
    console.log(`  总额: ${invoice.summary.totalGross} ${invoice.currency}`);
    console.log(`  项目数: ${invoice.items.length}\n`);

    // 5. 测试申报数据
    console.log('📊 测试申报数据:');
    const transactions = [
        { id: 1, order_id: 'ORD-001', country: 'GB', net_amount: 500, vat_amount: 100 },
        { id: 2, order_id: 'ORD-002', country: 'GB', net_amount: 300, vat_amount: 60 },
        { id: 3, order_id: 'ORD-003', country: 'DE', net_amount: 200, vat_amount: 38 }
    ];
    const filing = filingService.generateFilingData('test_tenant', 'GB', '2026-Q3', transactions);
    console.log(`  申报ID: ${filing.filingId}`);
    console.log(`  总净额: ${filing.summary.totalNet} ${filing.currency}`);
    console.log(`  总VAT: ${filing.summary.totalVAT} ${filing.currency}`);
    console.log(`  交易数: ${filing.summary.transactionCount}`);
    console.log(`  税率分组: ${Object.keys(filing.byRate).length} 组`);

    // 6. 测试所有国家
    console.log('\n🌍 所有支持的国家:');
    const countries = taxRulesEngine.getCountriesList();
    console.log(`  共 ${countries.length} 个国家`);
    countries.slice(0, 10).forEach(c => {
        console.log(`  ${c.code}: ${c.name} (${c.standardRate}%)`);
    });
    console.log('  ...\n');

    console.log('✅ 测试完成!');
}

testTaxEngine().catch(console.error);