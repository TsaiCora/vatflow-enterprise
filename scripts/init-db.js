// scripts/init-db.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * 数据库初始化脚本
 * 创建数据库、表结构、索引和初始数据
 */
async function initDatabase() {
    console.log('🚀 开始初始化数据库...');

    // 数据库连接配置
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root123',
        multipleStatements: true
    };

    let connection;

    try {
        // 1. 连接到 MySQL（不指定数据库）
        console.log('📡 连接到 MySQL...');
        connection = await mysql.createConnection(config);

        // 2. 创建数据库（如果不存在）
        const dbName = process.env.DB_NAME || 'vatflow';
        console.log(`📁 创建数据库: ${dbName}`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        // 3. 切换到目标数据库
        await connection.changeUser({ database: dbName });

        // 4. 创建表结构
        console.log('📋 创建表结构...');

        // 4.1 客户表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tenants (
                tenant_id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                company VARCHAR(200),
                vat_number VARCHAR(50),
                country CHAR(2),
                role ENUM('admin', 'user') DEFAULT 'user',
                status ENUM('active', 'inactive', 'deleted', 'pending') DEFAULT 'pending',
                api_key VARCHAR(100) UNIQUE,
                settings JSON,
                tax_config JSON,
                last_login_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_country (country),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 4.2 交易记录表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(50) NOT NULL,
                order_id VARCHAR(100) NOT NULL,
                order_date DATE,
                country CHAR(2),
                vat_number VARCHAR(50),
                net_amount DECIMAL(15,2) DEFAULT 0,
                vat_amount DECIMAL(15,2) DEFAULT 0,
                gross_amount DECIMAL(15,2) DEFAULT 0,
                tax_rate DECIMAL(5,2) DEFAULT 0,
                customer_email VARCHAR(100),
                customer_name VARCHAR(100),
                product_sku VARCHAR(100),
                quantity INT DEFAULT 1,
                period VARCHAR(7),
                platform VARCHAR(50),
                status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
                raw_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                INDEX idx_tenant_order (tenant_id, order_id),
                INDEX idx_tenant_period (tenant_id, period),
                INDEX idx_country (country),
                INDEX idx_platform (platform),
                INDEX idx_status (status),
                INDEX idx_order_date (order_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 4.3 申报记录表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS filings (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(50) NOT NULL,
                period VARCHAR(7) NOT NULL,
                country CHAR(2),
                total_net DECIMAL(15,2) DEFAULT 0,
                total_vat DECIMAL(15,2) DEFAULT 0,
                total_gross DECIMAL(15,2) DEFAULT 0,
                transaction_count INT DEFAULT 0,
                status ENUM('draft', 'processing', 'submitted', 'filed', 'error') DEFAULT 'draft',
                submission_id VARCHAR(100),
                filed_at TIMESTAMP NULL,
                report_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                INDEX idx_tenant_period (tenant_id, period),
                INDEX idx_status (status),
                UNIQUE KEY uk_tenant_period_country (tenant_id, period, country)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 4.4 文件处理记录表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS processing_history (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(50) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500),
                file_size BIGINT DEFAULT 0,
                platform VARCHAR(50),
                status ENUM('pending', 'processing', 'success', 'failed') DEFAULT 'pending',
                transactions_count INT DEFAULT 0,
                total_vat DECIMAL(15,2) DEFAULT 0,
                error_message TEXT,
                job_id VARCHAR(100),
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                INDEX idx_tenant_status (tenant_id, status),
                INDEX idx_job_id (job_id),
                INDEX idx_processed_at (processed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 4.5 审计日志表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(50),
                user_email VARCHAR(100),
                action VARCHAR(50) NOT NULL,
                resource VARCHAR(100),
                resource_id VARCHAR(100),
                details JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                status ENUM('success', 'failed') DEFAULT 'success',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_tenant (tenant_id),
                INDEX idx_action (action),
                INDEX idx_created_at (created_at),
                INDEX idx_resource (resource, resource_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 4.6 队列任务表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS queue_tasks (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                job_id VARCHAR(100) NOT NULL UNIQUE,
                tenant_id VARCHAR(50),
                type VARCHAR(50) NOT NULL,
                status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
                priority INT DEFAULT 1,
                data JSON,
                result JSON,
                error TEXT,
                attempts INT DEFAULT 0,
                max_attempts INT DEFAULT 3,
                scheduled_at TIMESTAMP NULL,
                started_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_tenant (tenant_id),
                INDEX idx_type (type),
                INDEX idx_scheduled_at (scheduled_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 4.7 Webhook 配置表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS webhooks (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(50) NOT NULL,
                url VARCHAR(500) NOT NULL,
                secret VARCHAR(255),
                events JSON,
                active BOOLEAN DEFAULT TRUE,
                last_triggered_at TIMESTAMP NULL,
                last_status INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                INDEX idx_tenant_active (tenant_id, active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 5. 创建索引（额外优化）
        console.log('🔍 创建额外索引...');
        
        // transactions 表额外索引
        await connection.query(`
            CREATE INDEX idx_transactions_composite 
            ON transactions(tenant_id, period, country, status)
        `);

        // audit_logs 表额外索引
        await connection.query(`
            CREATE INDEX idx_audit_composite 
            ON audit_logs(tenant_id, action, created_at)
        `);

        // 6. 创建初始管理员账户
        console.log('👤 创建初始管理员账户...');
        
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

        const adminApiKey = `vat_admin_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        await connection.query(`
            INSERT INTO tenants (
                tenant_id, name, email, password_hash, company, country, 
                role, status, api_key, settings, tax_config, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                password_hash = VALUES(password_hash),
                updated_at = NOW()
        `, [
            'admin',
            '系统管理员',
            'admin@vatflow.com',
            passwordHash,
            'VATFlow 科技',
            'CN',
            'admin',
            'active',
            adminApiKey,
            JSON.stringify({
                autoProcess: true,
                emailNotifications: true,
                defaultRate: 20,
                currency: 'EUR'
            }),
            JSON.stringify({
                ossEnabled: true,
                mtdEnabled: false,
                viesValidation: true,
                defaultPeriod: 'monthly'
            })
        ]);

        console.log('✅ 数据库初始化完成！');
        console.log(`📧 管理员邮箱: admin@vatflow.com`);
        console.log(`🔑 管理员密码: ${adminPassword}`);
        console.log(`🔑 API Key: ${adminApiKey}`);

        // 7. 显示统计信息
        const [tables] = await connection.query(`
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            ORDER BY TABLE_NAME
        `, [dbName]);

        console.log('\n📊 表统计:');
        tables.forEach(table => {
            console.log(`   ${table.TABLE_NAME}: ${table.TABLE_ROWS} 行`);
        });

    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('📡 数据库连接已关闭');
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase };