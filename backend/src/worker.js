// backend/src/worker.js
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as bcrypt from 'bcryptjs'

const app = new Hono()
app.use('*', cors())

// =============================================
// ===== 国家税率映射 =====
// =============================================
const TAX_RATES = {
    GB: 20, FR: 20, DE: 19, IT: 22, ES: 21,
    NL: 21, BE: 21, PL: 23, SE: 25, DK: 25,
    FI: 24, IE: 23, PT: 23, AT: 20, NO: 25,
    CH: 7.7, RU: 20, JP: 10, KR: 10, SG: 9,
    MY: 8, TH: 7, VN: 10, ID: 11, PH: 12,
    IN: 18, AU: 10, NZ: 15, CA: 5, US: 0,
    MX: 16, BR: 17, TR: 18, AE: 5, ZA: 15
};

const CURRENCY_MAP = {
    GB: 'GBP', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR',
    NL: 'EUR', BE: 'EUR', PL: 'PLN', SE: 'SEK', DK: 'DKK',
    FI: 'EUR', IE: 'EUR', PT: 'EUR', AT: 'EUR', NO: 'NOK',
    CH: 'CHF', RU: 'RUB', JP: 'JPY', KR: 'KRW', SG: 'SGD',
    MY: 'MYR', TH: 'THB', VN: 'VND', ID: 'IDR', PH: 'PHP',
    IN: 'INR', AU: 'AUD', NZ: 'NZD', CA: 'CAD', US: 'USD',
    MX: 'MXN', BR: 'BRL', TR: 'TRY', AE: 'AED', ZA: 'ZAR'
};

const COUNTRY_NAME_MAP = {
    GB: '英国', FR: '法国', DE: '德国', IT: '意大利', ES: '西班牙',
    NL: '荷兰', BE: '比利时', PL: '波兰', SE: '瑞典', DK: '丹麦',
    FI: '芬兰', IE: '爱尔兰', PT: '葡萄牙', AT: '奥地利', NO: '挪威',
    CH: '瑞士', RU: '俄罗斯', JP: '日本', KR: '韩国', SG: '新加坡',
    MY: '马来西亚', TH: '泰国', VN: '越南', ID: '印度尼西亚', PH: '菲律宾',
    IN: '印度', AU: '澳大利亚', NZ: '新西兰', CA: '加拿大', US: '美国',
    MX: '墨西哥', BR: '巴西', TR: '土耳其', AE: '阿联酋', ZA: '南非'
};

// =============================================
// ===== 租户中间件（增强版） =====
// =============================================
app.use('*', async (c, next) => {
    const path = c.req.path;
    
    if (path === '/api/v1/auth/login' || path === '/health' || path === '/') {
        return next();
    }

    let tenantId = c.req.header('X-Tenant-ID') || c.req.query('tenantId');
    const userRole = c.req.header('X-User-Role') || 'user';
    const userTenantId = c.req.header('X-User-Tenant-ID') || tenantId;

    if (!tenantId) {
        tenantId = 'admin_tenant';
    }

    c.set('tenantId', tenantId);
    c.set('userRole', userRole);
    c.set('userTenantId', userTenantId);
    
    return next();
});

const getTenantId = (c) => {
    return c.get('tenantId') || 'admin_tenant';
};

const getUserRole = (c) => {
    return c.get('userRole') || 'user';
};

const isAdmin = (c) => {
    return getUserRole(c) === 'admin';
};

// =============================================
// ===== 健康检查 =====
// =============================================
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        message: 'VATFlow API running on Cloudflare Workers',
        timestamp: new Date().toISOString()
    })
})

app.get('/', (c) => {
    return c.json({
        message: 'VATFlow API running on Cloudflare Workers',
        docs: '/health',
        endpoints: [
            'POST /api/v1/auth/login',
            'GET /api/v1/tenants',
            'POST /api/v1/tenants',
            'PUT /api/v1/tenants/:id',
            'DELETE /api/v1/tenants/:id',
            'GET /api/v1/countries',
            'GET /api/v1/platforms',
            'GET /api/v1/filings',
            'POST /api/v1/filings',
            'GET /api/v1/vat-profiles',
            'POST /api/v1/vat-profiles',
            'GET /api/v1/transactions',
            'POST /api/v1/transactions',
            'POST /api/v1/transactions/batch',
            'GET /api/v1/transactions/stats',
            'GET /api/v1/settings',
            'POST /api/v1/settings',
            'GET /api/v1/dashboard',
            'GET /api/v1/reports',
            'POST /api/v1/reports/generate',
            'POST /api/v1/tax/validate',
            'POST /api/v1/tax/validate-batch',
            'POST /api/v1/tax/summary',
            'GET /api/v1/tax/countries',
            'GET /api/v1/tax/platforms',
            'GET /api/v1/tax/ecommerce-platforms',
            'POST /api/v1/files/upload',
            'GET /api/v1/files',
            'DELETE /api/v1/files/:id'
        ]
    })
})

// =============================================
// ===== 认证接口 =====
// =============================================
app.post('/api/v1/auth/login', async (c) => {
    try {
        const { email, password } = await c.req.json()
        if (!email || !password) {
            return c.json({ error: '邮箱和密码不能为空' }, 400)
        }

        const user = await c.env.DB.prepare(
            'SELECT tenant_id, name, email, password_hash, company, role, status FROM tenants WHERE email = ?'
        ).bind(email).first()

        if (!user) {
            return c.json({ error: '邮箱或密码错误' }, 401)
        }

        if (user.status !== 'active') {
            return c.json({ error: '账号已被禁用' }, 401)
        }

        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) {
            return c.json({ error: '邮箱或密码错误' }, 401)
        }

        delete user.password_hash
        return c.json({
            success: true,
            message: '登录成功',
            data: {
                user,
                token: 'dummy-token-' + Date.now()
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        return c.json({ error: '登录失败' }, 500)
    }
})

// =============================================
// ===== 国家接口 =====
// =============================================
app.get('/api/v1/countries', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            'SELECT code, name, region, vat_rate, currency FROM countries WHERE is_active = 1 ORDER BY name'
        ).all()
        return c.json({ success: true, data: results })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 平台接口 =====
// =============================================
app.get('/api/v1/platforms', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            'SELECT code, name, icon, base_url, is_active FROM platforms WHERE is_active = 1 ORDER BY name'
        ).all()
        return c.json({ success: true, data: results })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 租户接口（权限控制） =====
// =============================================
app.get('/api/v1/tenants', async (c) => {
    try {
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        let query = 'SELECT tenant_id, name, email, company, country, vat_number, role, status, created_at FROM tenants';
        const params = [];
        
        if (role !== 'admin') {
            query += ' WHERE tenant_id = ?';
            params.push(tenantId);
        }
        
        const { results } = await c.env.DB.prepare(query).bind(...params).all();
        return c.json({
            success: true,
            data: results,
            total: results.length
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
})

app.get('/api/v1/tenants/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        if (role !== 'admin' && id !== tenantId) {
            return c.json({ error: '无权访问其他租户数据' }, 403);
        }
        
        const result = await c.env.DB.prepare(
            'SELECT tenant_id, name, email, company, country, vat_number, role, status, created_at FROM tenants WHERE tenant_id = ?'
        ).bind(id).first();
        
        if (!result) {
            return c.json({ error: '租户不存在' }, 404);
        }
        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
})

app.post('/api/v1/tenants', async (c) => {
    try {
        const role = getUserRole(c);
        
        if (role !== 'admin') {
            return c.json({ error: '权限不足，仅管理员可创建租户' }, 403);
        }
        
        const { tenant_id, name, email, password, company, country, vat_number, role: userRole } = await c.req.json();
        if (!tenant_id || !name || !email || !password) {
            return c.json({ error: '缺少必填字段' }, 400)
        }

        const hash = await bcrypt.hash(password, 10)
        await c.env.DB.prepare(
            'INSERT INTO tenants (tenant_id, name, email, password_hash, company, country, vat_number, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
        ).bind(tenant_id, name, email, hash, company || '', country || 'GB', vat_number || '', userRole || 'user', 'active').run()

        return c.json({ success: true, message: '租户创建成功', tenant_id })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.put('/api/v1/tenants/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        if (role !== 'admin' && id !== tenantId) {
            return c.json({ error: '无权修改其他租户数据' }, 403);
        }
        
        const { name, email, company, country, vat_number, role: userRole, status } = await c.req.json()
        await c.env.DB.prepare(
            'UPDATE tenants SET name = ?, email = ?, company = ?, country = ?, vat_number = ?, role = ?, status = ? WHERE tenant_id = ?'
        ).bind(name, email, company || '', country || 'GB', vat_number || '', userRole || 'user', status || 'active', id).run()
        return c.json({ success: true, message: '租户更新成功' })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.delete('/api/v1/tenants/:id', async (c) => {
    try {
        const role = getUserRole(c);
        
        if (role !== 'admin') {
            return c.json({ error: '权限不足，仅管理员可删除租户' }, 403);
        }
        
        const id = c.req.param('id');
        await c.env.DB.prepare('DELETE FROM tenants WHERE tenant_id = ?').bind(id).run();
        return c.json({ success: true, message: '租户删除成功' })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.get('/api/v1/tenants/:id/platforms', async (c) => {
    try {
        const id = c.req.param('id')
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        if (role !== 'admin' && id !== tenantId) {
            return c.json({ error: '无权访问其他租户数据' }, 403)
        }
        
        const { results } = await c.env.DB.prepare(
            'SELECT tp.*, p.name as platform_name, p.icon FROM tenant_platforms tp JOIN platforms p ON tp.platform_code = p.code WHERE tp.tenant_id = ?'
        ).bind(id).all()
        return c.json({ success: true, data: results })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.post('/api/v1/tenants/:id/platforms', async (c) => {
    try {
        const id = c.req.param('id')
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        if (role !== 'admin' && id !== tenantId) {
            return c.json({ error: '无权修改其他租户数据' }, 403)
        }
        
        const { platform_code, platform_account_id, api_key } = await c.req.json()
        await c.env.DB.prepare(
            'INSERT INTO tenant_platforms (tenant_id, platform_code, platform_account_id, api_key, is_active, connected_at) VALUES (?, ?, ?, ?, ?, datetime("now")) ON CONFLICT(tenant_id, platform_code) DO UPDATE SET platform_account_id = ?, api_key = ?, connected_at = datetime("now")'
        ).bind(id, platform_code, platform_account_id || '', api_key || '', 1, platform_account_id || '', api_key || '').run()
        return c.json({ success: true, message: '平台绑定成功' })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 申报记录 =====
// =============================================
app.get('/api/v1/filings', async (c) => {
    try {
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        let query = 'SELECT * FROM filings';
        const params = [];
        
        if (role !== 'admin') {
            query += ' WHERE tenant_id = ?';
            params.push(tenantId);
        }
        
        query += ' ORDER BY created_at DESC';
        const { results } = await c.env.DB.prepare(query).bind(...params).all();
        return c.json({ success: true, data: results, total: results.length })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.post('/api/v1/filings', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const { period, country, total_net, total_vat, total_gross, transaction_count, status } = await c.req.json()
        if (!period) {
            return c.json({ error: '缺少必填字段' }, 400)
        }
        await c.env.DB.prepare(
            'INSERT INTO filings (tenant_id, period, country, total_net, total_vat, total_gross, transaction_count, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))'
        ).bind(tenantId, period, country || '', total_net || 0, total_vat || 0, total_gross || 0, transaction_count || 0, status || 'draft').run()
        return c.json({ success: true, message: '申报记录创建成功' })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== VAT 资料 =====
// =============================================
app.get('/api/v1/vat-profiles', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const { results } = await c.env.DB.prepare(
            'SELECT * FROM vat_profiles WHERE tenant_id = ?'
        ).bind(tenantId).all()
        return c.json({ success: true, data: results, total: results.length })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.post('/api/v1/vat-profiles', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const { vat_number, country, company_name, company_address, tax_rate, is_default } = await c.req.json()
        if (!vat_number || !country) {
            return c.json({ error: '缺少必填字段' }, 400)
        }
        await c.env.DB.prepare(
            'INSERT INTO vat_profiles (tenant_id, vat_number, country, company_name, company_address, tax_rate, is_default, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))'
        ).bind(tenantId, vat_number, country, company_name || '', company_address || '', tax_rate || 0, is_default || 0, 'active').run()
        return c.json({ success: true, message: 'VAT资料创建成功' })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 交易记录（权限控制） =====
// =============================================
app.get('/api/v1/transactions', async (c) => {
    try {
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        const country = c.req.query('country');
        const platform = c.req.query('platform');
        const status = c.req.query('status');
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');

        let query = 'SELECT * FROM transactions';
        const params = [];
        
        if (role !== 'admin') {
            query += ' WHERE tenant_id = ?';
            params.push(tenantId);
        } else {
            query += ' WHERE 1=1';
        }

        if (country) { query += ' AND country = ?'; params.push(country); }
        if (platform) { query += ' AND platform = ?'; params.push(platform); }
        if (status) { query += ' AND status = ?'; params.push(status); }
        if (startDate) { query += ' AND order_date >= ?'; params.push(startDate); }
        if (endDate) { query += ' AND order_date <= ?'; params.push(endDate); }

        query += ' ORDER BY created_at DESC LIMIT 1000';
        const { results } = await c.env.DB.prepare(query).bind(...params).all();
        
        return c.json({ success: true, data: results, total: results.length });
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.post('/api/v1/transactions', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const { order_id, order_date, country, vat_number, net_amount, vat_amount, gross_amount, tax_rate, period, platform, status, product_sku, quantity } = await c.req.json()
        if (!order_id) {
            return c.json({ error: '缺少必填字段' }, 400)
        }
        await c.env.DB.prepare(
            'INSERT INTO transactions (tenant_id, order_id, order_date, country, vat_number, net_amount, vat_amount, gross_amount, tax_rate, period, platform, status, product_sku, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
        ).bind(tenantId, order_id, order_date || null, country || '', vat_number || '', net_amount || 0, vat_amount || 0, gross_amount || 0, tax_rate || 0, period || '', platform || '', status || 'pending', product_sku || '', quantity || 1).run()
        return c.json({ success: true, message: '交易记录创建成功' })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 批量创建交易 =====
// =============================================
app.post('/api/v1/transactions/batch', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const transactions = await c.req.json();
        if (!transactions || !transactions.length) {
            return c.json({ error: '没有数据' }, 400);
        }

        let created = 0;
        for (const item of transactions) {
            await c.env.DB.prepare(
                `INSERT INTO transactions 
                (tenant_id, order_id, order_date, country, vat_number, net_amount, vat_amount, gross_amount, tax_rate, period, platform, status, product_sku, quantity, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`
            ).bind(
                tenantId,
                item.order_id || `ORD-${Date.now()}-${created}`,
                item.order_date || new Date().toISOString().split('T')[0],
                item.country, item.vat_number || '',
                item.net_amount || 0, item.vat_amount || 0,
                (item.net_amount || 0) + (item.vat_amount || 0),
                item.tax_rate || 20,
                item.period || '',
                item.platform || '',
                item.status || 'pending',
                item.product_sku || '',
                item.quantity || 1
            ).run();
            created++;
        }

        return c.json({
            success: true,
            message: `成功创建 ${created} 条交易记录`,
            count: created
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// =============================================
// ===== 交易统计（权限控制） =====
// =============================================
app.get('/api/v1/transactions/stats', async (c) => {
    try {
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        let query = `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error,
            SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END) as reported,
            SUM(net_amount) as total_net,
            SUM(vat_amount) as total_vat
            FROM transactions`;
        const params = [];
        
        if (role !== 'admin') {
            query += ' WHERE tenant_id = ?';
            params.push(tenantId);
        }
        
        const { results } = await c.env.DB.prepare(query).bind(...params).all();

        return c.json({
            success: true,
            data: results[0] || { total: 0, pending: 0, validated: 0, error: 0, reported: 0, total_net: 0, total_vat: 0 }
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// =============================================
// ===== 系统设置 =====
// =============================================
app.get('/api/v1/settings', async (c) => {
    try {
        const tenantId = getTenantId(c);
        
        let query = 'SELECT setting_key, setting_value, updated_at FROM system_settings';
        const params = [];
        
        if (tenantId) {
            query += ' WHERE tenant_id = ? OR tenant_id IS NULL';
            params.push(tenantId);
        }
        
        const { results } = await c.env.DB.prepare(query).bind(...params).all()
        
        const settings = {};
        results.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        
        return c.json({ success: true, data: settings })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.post('/api/v1/settings', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const { key, value } = await c.req.json()
        if (!key) {
            return c.json({ error: '缺少设置键' }, 400)
        }
        await c.env.DB.prepare(
            `INSERT INTO system_settings (setting_key, setting_value, tenant_id, updated_at) 
             VALUES (?, ?, ?, datetime("now")) 
             ON CONFLICT(setting_key, tenant_id) DO UPDATE SET setting_value = ?, updated_at = datetime("now")`
        ).bind(key, value, tenantId, value).run()
        return c.json({ success: true, message: '设置更新成功' })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== Dashboard（权限控制） =====
// =============================================
app.get('/api/v1/dashboard', async (c) => {
    try {
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        if (role === 'admin') {
            const tenantsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM tenants').first();
            const filingsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM filings').first();
            const transactionsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM transactions').first();
            const recentActivities = await c.env.DB.prepare(
                'SELECT "交易" as type, order_id as id, created_at FROM transactions ORDER BY created_at DESC LIMIT 5'
            ).all();

            return c.json({
                success: true,
                data: {
                    totalTenants: tenantsCount?.count || 0,
                    totalFilings: filingsCount?.count || 0,
                    totalTransactions: transactionsCount?.count || 0,
                    recentActivities: recentActivities.results || [],
                    vatTrend: [],
                    countryDistribution: []
                }
            });
        } else {
            const filingsCount = await c.env.DB.prepare(
                'SELECT COUNT(*) as count FROM filings WHERE tenant_id = ?'
            ).bind(tenantId).first();
            
            const transactionsCount = await c.env.DB.prepare(
                'SELECT COUNT(*) as count FROM transactions WHERE tenant_id = ?'
            ).bind(tenantId).first();
            
            const recentActivities = await c.env.DB.prepare(
                'SELECT "交易" as type, order_id as id, created_at FROM transactions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5'
            ).bind(tenantId).all();

            return c.json({
                success: true,
                data: {
                    totalTenants: 1,
                    totalFilings: filingsCount?.count || 0,
                    totalTransactions: transactionsCount?.count || 0,
                    recentActivities: recentActivities.results || [],
                    vatTrend: [],
                    countryDistribution: []
                }
            });
        }
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
})

// =============================================
// ===== 报告接口（权限控制） =====
// =============================================
app.get('/api/v1/reports', async (c) => {
    try {
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        let query = 'SELECT * FROM filings';
        const params = [];
        
        if (role !== 'admin') {
            query += ' WHERE tenant_id = ?';
            params.push(tenantId);
        }
        
        query += ' ORDER BY created_at DESC LIMIT 10';
        const { results } = await c.env.DB.prepare(query).bind(...params).all();
        
        return c.json({ success: true, data: results, total: results.length })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.post('/api/v1/reports/generate', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const { transactionIds, filters } = await c.req.json();
        
        let query = 'SELECT * FROM transactions WHERE tenant_id = ?';
        const params = [tenantId];
        
        if (transactionIds && transactionIds.length) {
            query += ` AND id IN (${transactionIds.map(() => '?').join(',')})`;
            params.push(...transactionIds);
        }
        if (filters?.country) {
            query += ' AND country = ?';
            params.push(filters.country);
        }
        if (filters?.platform) {
            query += ' AND platform = ?';
            params.push(filters.platform);
        }
        if (filters?.startDate) {
            query += ' AND order_date >= ?';
            params.push(filters.startDate);
        }
        if (filters?.endDate) {
            query += ' AND order_date <= ?';
            params.push(filters.endDate);
        }

        const { results } = await c.env.DB.prepare(query).bind(...params).all();
        
        let totalNet = 0, totalVat = 0, totalGross = 0;
        results.forEach(t => {
            totalNet += t.net_amount || 0;
            totalVat += t.vat_amount || 0;
            totalGross += t.gross_amount || 0;
        });

        const reportId = 'RPT-' + Date.now();
        
        await c.env.DB.prepare(
            `INSERT INTO filings 
            (filing_id, tenant_id, country, platform, period, total_net, total_vat, total_gross, transaction_count, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`
        ).bind(
            reportId,
            tenantId,
            filters?.country || '',
            filters?.platform || '',
            filters?.period || '',
            totalNet, totalVat, totalGross,
            results.length,
            'draft'
        ).run();

        return c.json({
            success: true,
            message: '报告生成成功',
            reportId,
            data: {
                id: reportId,
                totalNet,
                totalVat,
                totalGross,
                transactionCount: results.length
            }
        })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 税务接口 =====
// =============================================
app.post('/api/v1/tax/validate', async (c) => {
    try {
        const body = await c.req.json()
        const { vatNumber, amount, country, period } = body
        
        if (!vatNumber || !country) {
            return c.json({ success: false, error: 'VAT号码和国家为必填项' }, 400)
        }

        const countryCode = country.toUpperCase()
        const taxRate = TAX_RATES[countryCode] || 20
        const currency = CURRENCY_MAP[countryCode] || 'EUR'
        const countryName = COUNTRY_NAME_MAP[countryCode] || countryCode

        const netAmount = amount || 0
        const vatAmount = netAmount * (taxRate / 100)
        const grossAmount = netAmount + vatAmount

        let valid = true
        let message = 'VAT 号码有效'

        const patterns = {
            'GB': /^GB\d{9,12}$/,
            'DE': /^DE\d{9}$/,
            'FR': /^FR[A-Z0-9]{2}\d{9}$/,
            'IT': /^IT\d{11}$/,
            'ES': /^ES[A-Z0-9]\d{8}$/,
            'NL': /^NL[A-Z0-9]{9}[A-Z]{1,2}$/,
            'BE': /^BE\d{10}$/,
            'PL': /^PL\d{10}$/,
            'SE': /^SE\d{12}$/,
            'DK': /^DK\d{8}$/,
            'FI': /^FI\d{8}$/,
            'IE': /^IE\d{7}[A-Z]{1,2}$/,
            'PT': /^PT\d{9}$/,
            'AT': /^ATU\d{8}$/,
            'JP': /^[A-Z0-9]{12,13}$/,
            'SG': /^[A-Z]\d{8}[A-Z]$/,
            'AU': /^\d{11}$/,
            'CA': /^[A-Z0-9]{9}$/,
            'KR': /^[0-9]{10}$/,
            'MX': /^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
            'BR': /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
            'IN': /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/,
            'ZA': /^\d{10}$/,
            'TR': /^TR\d{10}$/,
            'AE': /^AE\d{15}$/,
            'NZ': /^NZ\d{8,9}$/,
            'MY': /^[A-Z]{2}\d{8}$/,
            'TH': /^\d{13}$/,
            'VN': /^\d{10}$/,
            'ID': /^\d{15}$/,
            'PH': /^\d{12}$/,
            'RU': /^\d{10}$/,
            'NO': /^NO\d{9}$/,
            'CH': /^CHE-?\d{3}\.\d{3}\.\d{3}$/,
            'US': /^\d{2}-\d{7}$/
        }

        const pattern = patterns[countryCode]
        if (pattern && !pattern.test(vatNumber)) {
            valid = false
            message = `VAT 号码格式无效，请使用 ${countryCode} 格式`
        }

        return c.json({
            success: true,
            data: {
                vatNumber,
                country: countryCode,
                countryName,
                valid,
                message,
                taxRate,
                netAmount,
                vatAmount,
                grossAmount,
                currency,
                period: period || null,
                timestamp: new Date().toISOString()
            }
        })
    } catch (error) {
        console.error('❌ 税务校验错误:', error)
        return c.json({ success: false, error: error.message || '税务校验失败' }, 500)
    }
})

app.post('/api/v1/tax/validate-batch', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const { transactionIds } = await c.req.json();
        const { results } = await c.env.DB.prepare(
            `SELECT * FROM transactions WHERE tenant_id = ? AND id IN (${transactionIds.map(() => '?').join(',')})`
        ).bind(tenantId, ...transactionIds).all();

        let validCount = 0;
        let invalidCount = 0;

        for (const transaction of results) {
            const taxRate = TAX_RATES[transaction.country] || 20;
            const expectedVAT = transaction.net_amount * (taxRate / 100);
            const isValid = Math.abs(transaction.vat_amount - expectedVAT) < 1;
            
            await c.env.DB.prepare(
                `UPDATE transactions SET status = ?, tax_validated = ? WHERE tenant_id = ? AND id = ?`
            ).bind(isValid ? 'validated' : 'error', isValid ? 1 : 0, tenantId, transaction.id).run();

            if (isValid) validCount++;
            else invalidCount++;
        }

        return c.json({
            success: true,
            validCount,
            invalidCount,
            total: results.length
        });
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.post('/api/v1/tax/summary', async (c) => {
    try {
        const { importData, salesData } = await c.req.json()
        const totalImportVat = importData?.reduce((sum, item) => sum + (item.totalImportVat || 0), 0) || 0
        const totalSalesVat = salesData?.reduce((sum, item) => sum + (item.vatAmount || 0), 0) || 0
        return c.json({
            success: true,
            data: {
                totalImportVat,
                totalSalesVat,
                totalPayableVAT: totalSalesVat - totalImportVat,
                importCount: importData?.length || 0,
                salesCount: salesData?.length || 0
            }
        })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.get('/api/v1/tax/countries', async (c) => {
    try {
        const countries = Object.keys(TAX_RATES).map(code => ({
            code,
            name: COUNTRY_NAME_MAP[code] || code,
            taxRate: TAX_RATES[code],
            currency: CURRENCY_MAP[code] || 'EUR'
        }))
        return c.json({ success: true, data: countries })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.get('/api/v1/tax/platforms', async (c) => {
    try {
        const platforms = [
            { id: 'amazon', name: 'Amazon', icon: 'amazon' },
            { id: 'ebay', name: 'eBay', icon: 'ebay' },
            { id: 'aliexpress', name: 'AliExpress', icon: 'aliexpress' },
            { id: 'shopify', name: 'Shopify', icon: 'shopify' },
            { id: 'etsy', name: 'Etsy', icon: 'etsy' },
            { id: 'walmart', name: 'Walmart', icon: 'walmart' },
            { id: 'target', name: 'Target', icon: 'target' },
            { id: 'zalando', name: 'Zalando', icon: 'zalando' },
            { id: 'lazada', name: 'Lazada', icon: 'lazada' },
            { id: 'shopee', name: 'Shopee', icon: 'shopee' },
            { id: 'temu', name: 'Temu', icon: 'temu' },
            { id: 'shein', name: 'SHEIN', icon: 'shein' },
            { id: 'tiktok', name: 'TikTok Shop', icon: 'tiktok' },
        ]
        return c.json({ success: true, data: platforms })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

app.get('/api/v1/tax/ecommerce-platforms', async (c) => {
    try {
        const platforms = [
            { id: 'amazon', name: 'Amazon', countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'] },
            { id: 'ebay', name: 'eBay', countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT'] },
            { id: 'aliexpress', name: 'AliExpress', countries: ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'PL', 'SE'] },
            { id: 'shopify', name: 'Shopify', countries: ['GB', 'US', 'CA', 'AU', 'NZ'] },
            { id: 'etsy', name: 'Etsy', countries: ['GB', 'FR', 'DE', 'IT', 'NL', 'SE', 'PL'] },
            { id: 'walmart', name: 'Walmart', countries: ['US', 'CA', 'MX'] },
            { id: 'lazada', name: 'Lazada', countries: ['SG', 'MY', 'TH', 'VN', 'PH', 'ID'] },
            { id: 'shopee', name: 'Shopee', countries: ['SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'TW'] },
            { id: 'temu', name: 'Temu', countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES'] },
            { id: 'shein', name: 'SHEIN', countries: ['US', 'GB', 'FR', 'DE', 'IT', 'ES', 'AU'] },
            { id: 'tiktok', name: 'TikTok Shop', countries: ['GB', 'US', 'SG', 'TH', 'VN', 'PH', 'MY'] },
        ]
        return c.json({ success: true, data: platforms })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 文件上传接口 =====
// =============================================
app.post('/api/v1/files/upload', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const body = await c.req.parseBody();
        const files = body['files'];
        const country = body['country'] || 'GB';
        const platform = body['platform'] || 'amazon';
        const year = body['year'] || new Date().getFullYear().toString();
        const month = body['month'] || '01';

        if (!files) {
            return c.json({ error: '没有文件' }, 400);
        }

        const fileArray = Array.isArray(files) ? files : [files];
        const transactions = [];

        for (const file of fileArray) {
            const content = await file.text();
            const lines = content.split('\n').filter(line => line.trim());
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length >= 3) {
                    const netAmount = parseFloat(parts[1]) || 0;
                    const vatAmount = parseFloat(parts[2]) || 0;
                    transactions.push({
                        tenant_id: tenantId,
                        order_id: parts[0] || `ORD-${Date.now()}-${i}`,
                        order_date: new Date().toISOString().split('T')[0],
                        country: country,
                        vat_number: `VAT-${country}${Date.now()}`,
                        net_amount: netAmount,
                        vat_amount: vatAmount,
                        gross_amount: netAmount + vatAmount,
                        tax_rate: TAX_RATES[country] || 20,
                        period: `${year}-${month}`,
                        platform: platform,
                        status: 'pending',
                        product_sku: parts[3] || '',
                        quantity: parseInt(parts[4]) || 1
                    });
                }
            }
        }

        let created = 0;
        for (const item of transactions) {
            await c.env.DB.prepare(
                `INSERT INTO transactions 
                (tenant_id, order_id, order_date, country, vat_number, net_amount, vat_amount, gross_amount, tax_rate, period, platform, status, product_sku, quantity, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`
            ).bind(
                item.tenant_id, item.order_id, item.order_date,
                item.country, item.vat_number,
                item.net_amount, item.vat_amount, item.gross_amount,
                item.tax_rate, item.period, item.platform,
                item.status, item.product_sku, item.quantity
            ).run();
            created++;
        }

        return c.json({
            success: true,
            message: `上传成功，解析 ${transactions.length} 条记录，保存 ${created} 条`,
            data: {
                processed: transactions.length,
                saved: created
            }
        })
    } catch (error) {
        console.error('❌ 文件上传错误:', error);
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 获取文件列表（权限控制） =====
// =============================================
app.get('/api/v1/files', async (c) => {
    try {
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        const country = c.req.query('country');
        const platform = c.req.query('platform');
        const year = c.req.query('year');
        const month = c.req.query('month');

        let query = 'SELECT * FROM transactions';
        const params = [];
        
        if (role !== 'admin') {
            query += ' WHERE tenant_id = ?';
            params.push(tenantId);
        } else {
            query += ' WHERE 1=1';
        }

        if (country) { query += ' AND country = ?'; params.push(country); }
        if (platform) { query += ' AND platform = ?'; params.push(platform); }
        if (year) { query += ' AND substr(period, 1, 4) = ?'; params.push(year); }
        if (month) { query += ' AND substr(period, 6, 2) = ?'; params.push(month); }

        query += ' ORDER BY created_at DESC LIMIT 1000';
        const { results } = await c.env.DB.prepare(query).bind(...params).all();

        return c.json({ success: true, data: results, total: results.length })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 删除文件/交易 =====
// =============================================
app.delete('/api/v1/files/:id', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const id = c.req.param('id');
        
        const file = await c.env.DB.prepare(
            'SELECT tenant_id FROM transactions WHERE id = ?'
        ).bind(id).first();
        
        if (!file) {
            return c.json({ error: '文件不存在' }, 404);
        }
        
        if (file.tenant_id !== tenantId) {
            return c.json({ error: '无权删除此文件' }, 403);
        }
        
        await c.env.DB.prepare('DELETE FROM transactions WHERE tenant_id = ? AND id = ?').bind(tenantId, id).run();
        return c.json({ success: true, message: '删除成功' })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 404 =====
// =============================================
app.notFound((c) => {
    return c.json({ error: '接口不存在' }, 404)
})

// =============================================
// ===== 错误处理 =====
// =============================================
app.onError((err, c) => {
    console.error('Error:', err)
    return c.json({ error: err.message || '服务器错误' }, 500)
})

export default app