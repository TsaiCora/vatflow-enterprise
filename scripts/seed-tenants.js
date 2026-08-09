// scripts/seed-tenants.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

/**
 * 生成测试客户数据
 */
function generateTenant(index) {
    const countries = ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE'];
    const country = countries[index % countries.length];
    
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    
    return {
        tenantId: `client_${String(index + 1).padStart(3, '0')}`,
        name: name,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        company: faker.company.name(),
        vatNumber: `${country}${faker.string.numeric(9)}`,
        country: country,
        password: 'password123',
        status: ['active', 'active', 'active', 'active', 'inactive'][index % 5] || 'active',
        settings: {
            autoProcess: Math.random() > 0.3,
            emailNotifications: Math.random() > 0.2,
            defaultRate: [19, 20, 21, 22, 23, 24, 25][Math.floor(Math.random() * 7)],
            currency: 'EUR'
        },
        taxConfig: {
            ossEnabled: Math.random() > 0.3,
            mtdEnabled: country === 'GB' && Math.random() > 0.5,
            viesValidation: true,
            defaultPeriod: ['monthly', 'quarterly'][Math.floor(Math.random() * 2)]
        }
    };
}

/**
 * 生成测试交易数据
 */
function generateTransactions(tenantId, count = 50) {
    const transactions = [];
    const countries = ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT'];
    const platforms = ['amazon', 'ebay', 'shopify', 'wish', 'etsy'];
    const statuses = ['completed', 'pending', 'completed', 'completed', 'failed'];
    const rates = { 'GB': 0.20, 'FR': 0.20, 'DE': 0.19, 'IT': 0.22, 'ES': 0.21, 'NL': 0.21, 'BE': 0.21, 'AT': 0.20 };

    for (let i = 0; i < count; i++) {
        const country = countries[Math.floor(Math.random() * countries.length)];
        const netAmount = parseFloat((Math.random() * 500 + 10).toFixed(2));
        const taxRate = rates[country] || 0.20;
        const vatAmount = parseFloat((netAmount * taxRate).toFixed(2));
        
        const date = faker.date.between({
            from: '2024-01-01',
            to: '2024-07-20'
        });
        
        transactions.push({
            tenantId,
            orderId: `ORD-${String(i + 1).padStart(6, '0')}`,
            orderDate: date.toISOString().split('T')[0],
            country,
            vatNumber: `${country}${faker.string.numeric(9)}`,
            netAmount,
            vatAmount,
            grossAmount: netAmount + vatAmount,
            taxRate,
            customerEmail: faker.internet.email(),
            customerName: faker.person.fullName(),
            productSku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
            quantity: Math.floor(Math.random() * 5) + 1,
            period: date.toISOString().slice(0, 7),
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            rawData: JSON.stringify({
                source: 'seed_data',
                generatedAt: new Date().toISOString()
            })
        });
    }
    
    return transactions;
}

/**
 * 生成测试申报记录
 */
function generateFilings(tenantId, count = 6) {
    const filings = [];
    const countries = ['GB', 'FR', 'DE', 'IT', 'ES'];
    const statuses = ['filed', 'filed', 'draft', 'submitted', 'filed', 'error'];
    
    for (let i = 0; i < count; i++) {
        const month = String(i + 1).padStart(2, '0');
        const period = `2024-${month}`;
        const country = countries[i % countries.length];
        const totalNet = parseFloat((Math.random() * 10000 + 1000).toFixed(2));
        const taxRate = 0.20;
        const totalVat = parseFloat((totalNet * taxRate).toFixed(2));
        
        filings.push({
            tenantId,
            period,
            country,
            totalNet,
            totalVat,
            totalGross: totalNet + totalVat,
            transactionCount: Math.floor(Math.random() * 100) + 10,
            status: statuses[i % statuses.length],
            submissionId: statuses[i % statuses.length] === 'filed' || statuses[i % statuses.length] === 'submitted'
                ? `SUB-${Date.now()}-${String(i + 1).padStart(3, '0')}`
                : null,
            filedAt: statuses[i % statuses.length] === 'filed' 
                ? faker.date.between({ from: '2024-01-01', to: '2024-07-20' }).toISOString()
                : null
        });
    }
    
    return filings;
}

/**
 * 填充测试数据
 */
async function seedTenants() {
    console.log('🌱 开始填充测试数据...');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root123',
        database: process.env.DB_NAME || 'vatflow'
    };

    let connection;

    try {
        connection = await mysql.createConnection(config);
        console.log('📡 连接到数据库...');

        // 1. 清空现有数据（可选）
        const cleanExisting = process.argv.includes('--clean');
        if (cleanExisting) {
            console.log('🧹 清空现有数据...');
            await connection.query('SET FOREIGN_KEY_CHECKS = 0');
            await connection.query('TRUNCATE TABLE transactions');
            await connection.query('TRUNCATE TABLE filings');
            await connection.query('TRUNCATE TABLE processing_history');
            await connection.query('TRUNCATE TABLE audit_logs');
            await connection.query('TRUNCATE TABLE queue_tasks');
            await connection.query('TRUNCATE TABLE webhooks');
            await connection.query('TRUNCATE TABLE tenants');
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        }

        // 2. 创建测试客户
        console.log('👥 创建测试客户...');
        const saltRounds = 10;
        const tenantCount = parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 20;
        
        const tenants = [];
        for (let i = 0; i < tenantCount; i++) {
            const tenant = generateTenant(i);
            const passwordHash = await bcrypt.hash(tenant.password, saltRounds);
            const apiKey = `vat_${tenant.tenantId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
            
            await connection.query(`
                INSERT INTO tenants (
                    tenant_id, name, email, password_hash, company, vat_number,
                    country, status, api_key, settings, tax_config, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                tenant.tenantId,
                tenant.name,
                tenant.email,
                passwordHash,
                tenant.company,
                tenant.vatNumber,
                tenant.country,
                tenant.status,
                apiKey,
                JSON.stringify(tenant.settings),
                JSON.stringify(tenant.taxConfig)
            ]);
            
            tenants.push(tenant);
            console.log(`   ✅ 创建客户: ${tenant.tenantId} (${tenant.name})`);
        }

        // 3. 创建测试交易
        console.log('📊 创建测试交易...');
        let totalTransactions = 0;
        
        for (const tenant of tenants) {
            const count = Math.floor(Math.random() * 80) + 20;
            const transactions = generateTransactions(tenant.tenantId, count);
            
            for (const tx of transactions) {
                await connection.query(`
                    INSERT INTO transactions (
                        tenant_id, order_id, order_date, country, vat_number,
                        net_amount, vat_amount, gross_amount, tax_rate,
                        customer_email, customer_name, product_sku, quantity,
                        period, platform, status, raw_data, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    tx.tenantId,
                    tx.orderId,
                    tx.orderDate,
                    tx.country,
                    tx.vatNumber,
                    tx.netAmount,
                    tx.vatAmount,
                    tx.grossAmount,
                    tx.taxRate,
                    tx.customerEmail,
                    tx.customerName,
                    tx.productSku,
                    tx.quantity,
                    tx.period,
                    tx.platform,
                    tx.status,
                    tx.rawData
                ]);
                totalTransactions++;
            }
            console.log(`   ✅ ${tenant.tenantId}: ${count} 条交易`);
        }

        // 4. 创建测试申报记录
        console.log('📄 创建测试申报记录...');
        let totalFilings = 0;
        
        for (const tenant of tenants) {
            const count = Math.floor(Math.random() * 8) + 3;
            const filings = generateFilings(tenant.tenantId, count);
            
            for (const filing of filings) {
                await connection.query(`
                    INSERT INTO filings (
                        tenant_id, period, country, total_net, total_vat,
                        total_gross, transaction_count, status, submission_id,
                        filed_at, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    filing.tenantId,
                    filing.period,
                    filing.country,
                    filing.totalNet,
                    filing.totalVat,
                    filing.totalGross,
                    filing.transactionCount,
                    filing.status,
                    filing.submissionId,
                    filing.filedAt
                ]);
                totalFilings++;
            }
            console.log(`   ✅ ${tenant.tenantId}: ${count} 条申报记录`);
        }

        // 5. 输出统计
        console.log('\n📊 数据填充完成统计:');
        console.log(`   👥 客户: ${tenants.length}`);
        console.log(`   📊 交易: ${totalTransactions}`);
        console.log(`   📄 申报: ${totalFilings}`);

        // 显示测试账号
        console.log('\n🔑 测试账号:');
        console.log(`   管理员: admin@vatflow.com / admin123`);
        for (const tenant of tenants.slice(0, 5)) {
            console.log(`   ${tenant.email} / password123 (${tenant.tenantId})`);
        }
        if (tenants.length > 5) {
            console.log(`   ... 还有 ${tenants.length - 5} 个测试账号`);
        }

    } catch (error) {
        console.error('❌ 数据填充失败:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    seedTenants();
}

module.exports = { seedTenants, generateTenant, generateTransactions, generateFilings };