-- 1. 创建 countries 表
CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    region TEXT,
    vat_rate REAL DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT datetime('now')
);

-- 2. 创建 platforms 表
CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    base_url TEXT,
    api_key_required INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT datetime('now')
);

-- 3. 创建 tenant_platforms 表
CREATE TABLE IF NOT EXISTS tenant_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    platform_code TEXT NOT NULL,
    platform_account_id TEXT,
    api_key TEXT,
    is_active INTEGER DEFAULT 1,
    connected_at TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
    FOREIGN KEY (platform_code) REFERENCES platforms(code),
    UNIQUE(tenant_id, platform_code)
);

-- 4. 插入国家数据
INSERT OR IGNORE INTO countries (code, name, region, vat_rate, currency) VALUES 
('GB', '英国', '欧洲', 20, 'GBP'),
('DE', '德国', '欧洲', 19, 'EUR'),
('FR', '法国', '欧洲', 20, 'EUR'),
('IT', '意大利', '欧洲', 22, 'EUR'),
('ES', '西班牙', '欧洲', 21, 'EUR'),
('NL', '荷兰', '欧洲', 21, 'EUR'),
('BE', '比利时', '欧洲', 21, 'EUR'),
('AT', '奥地利', '欧洲', 20, 'EUR'),
('PL', '波兰', '欧洲', 23, 'PLN'),
('SE', '瑞典', '欧洲', 25, 'SEK'),
('JP', '日本', '亚洲', 10, 'JPY'),
('US', '美国', '美洲', 0, 'USD'),
('CA', '加拿大', '美洲', 5, 'CAD'),
('AU', '澳大利亚', '大洋洲', 10, 'AUD'),
('SG', '新加坡', '亚洲', 7, 'SGD');

-- 5. 插入平台数据
INSERT OR IGNORE INTO platforms (code, name, icon, base_url, is_active) VALUES 
('AMAZON', 'Amazon', 'amazon', 'https://sellercentral.amazon.com', 1),
('EBAY', 'eBay', 'ebay', 'https://www.ebay.com', 1),
('SHOPIFY', 'Shopify', 'shopify', 'https://www.shopify.com', 1),
('WISH', 'Wish', 'wish', 'https://www.wish.com', 1),
('ALIEXPRESS', 'AliExpress', 'aliexpress', 'https://www.aliexpress.com', 1),
('TIKTOK', 'TikTok Shop', 'tiktok', 'https://seller.tiktok.com', 1),
('TEMU', 'Temu', 'temu', 'https://www.temu.com', 1),
('SHEIN', 'SHEIN', 'shein', 'https://www.shein.com', 1),
('LAZADA', 'Lazada', 'lazada', 'https://sellercenter.lazada.com', 1),
('SHOPEE', 'Shopee', 'shopee', 'https://seller.shopee.com', 1),
('MERCARI', 'Mercari', 'mercari', 'https://www.mercari.com', 1),
('POSHMARK', 'Poshmark', 'poshmark', 'https://poshmark.com', 1),
('DEPOP', 'Depop', 'depop', 'https://www.depop.com', 1),
('ETSY', 'Etsy', 'etsy', 'https://www.etsy.com', 1),
('WALMART', 'Walmart', 'walmart', 'https://seller.walmart.com', 1),
('TARGET', 'Target', 'target', 'https://www.target.com', 1),
('RAKUTEN', 'Rakuten', 'rakuten', 'https://www.rakuten.com', 1),
('YAHOO', 'Yahoo Japan', 'yahoo', 'https://shopping.yahoo.co.jp', 1);