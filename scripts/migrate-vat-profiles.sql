-- scripts/migrate-vat-profiles.sql
-- =============================================
-- VAT档案多租户迁移脚本
-- 执行时间: 2026-07-30
-- =============================================

USE vatflow;

-- =============================================
-- 1. 修改 tenants 表（添加父租户支持）
-- =============================================
ALTER TABLE tenants ADD COLUMN parent_tenant_id VARCHAR(50) NULL;
ALTER TABLE tenants ADD INDEX idx_parent_tenant (parent_tenant_id);

-- =============================================
-- 2. 创建 vat_profiles 表
-- =============================================
CREATE TABLE IF NOT EXISTS vat_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    vat_number VARCHAR(50) NOT NULL,
    country CHAR(2) NOT NULL,
    company_name VARCHAR(200),
    company_address TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    UNIQUE KEY uk_tenant_vat (tenant_id, vat_number),
    INDEX idx_tenant (tenant_id),
    INDEX idx_vat_number (vat_number),
    INDEX idx_country (country)
);

-- =============================================
-- 3. 修改 transactions 表
-- =============================================
ALTER TABLE transactions ADD COLUMN vat_profile_id BIGINT NULL;
ALTER TABLE transactions ADD FOREIGN KEY (vat_profile_id) REFERENCES vat_profiles(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD INDEX idx_vat_profile (vat_profile_id);

-- =============================================
-- 4. 修改 filings 表
-- =============================================
ALTER TABLE filings ADD COLUMN vat_profile_id BIGINT NULL;
ALTER TABLE filings ADD FOREIGN KEY (vat_profile_id) REFERENCES vat_profiles(id) ON DELETE SET NULL;
ALTER TABLE filings ADD INDEX idx_vat_profile (vat_profile_id);

-- =============================================
-- 5. 更新现有数据（将现有 admin 用户设为父租户）
-- =============================================
UPDATE tenants SET parent_tenant_id = 'admin' WHERE tenant_id != 'admin';

-- =============================================
-- 6. 为 admin 创建默认 VAT 档案
-- =============================================
INSERT INTO vat_profiles (tenant_id, vat_number, country, company_name, is_default, status)
SELECT 
    'admin',
    COALESCE(vat_number, 'GB000000000') as vat_number,
    COALESCE(country, 'GB') as country,
    COALESCE(company, 'VATFlow 科技') as company_name,
    TRUE as is_default,
    'active'
FROM tenants WHERE tenant_id = 'admin'
ON DUPLICATE KEY UPDATE is_default = TRUE;

-- =============================================
-- 7. 为已有客户创建 VAT 档案（如果有数据）
-- =============================================
INSERT INTO vat_profiles (tenant_id, vat_number, country, company_name, is_default, status)
SELECT 
    t.tenant_id,
    COALESCE(t.vat_number, 'GB000000000') as vat_number,
    COALESCE(t.country, 'GB') as country,
    COALESCE(t.company, t.name) as company_name,
    TRUE as is_default,
    'active'
FROM tenants t
WHERE t.tenant_id != 'admin'
AND NOT EXISTS (
    SELECT 1 FROM vat_profiles vp WHERE vp.tenant_id = t.tenant_id
);

-- =============================================
-- 8. 验证
-- =============================================
SELECT '===== 迁移完成 =====' as status;
SELECT COUNT(*) as total_profiles FROM vat_profiles;
SELECT tenant_id, vat_number, country, is_default FROM vat_profiles;