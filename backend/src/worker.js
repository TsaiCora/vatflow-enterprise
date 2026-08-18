// backend/src/worker.js
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as bcrypt from 'bcryptjs'
import { buildPushHTTPRequest } from '@pushforge/builder';
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
// ===== 密码重置接口 =====
// =============================================

// 1. 请求重置密码 - 发送重置邮件
app.post('/api/v1/auth/forgot-password', async (c) => {
    try {
        const { email } = await c.req.json();

        if (!email) {
            return c.json({ error: '请输入邮箱地址' }, 400);
        }

        // 查找用户
        const user = await c.env.DB.prepare(
            'SELECT tenant_id, name, email FROM tenants WHERE email = ?'
        ).bind(email).first();

        if (!user) {
            // 为了安全，不暴露用户是否存在
            return c.json({
                success: true,
                message: '如果该邮箱已注册，您将收到重置密码的邮件'
            });
        }

        // 生成重置令牌
        const token = btoa(`${user.tenant_id}:${Date.now()}`);
        const resetLink = `https://vatflow.vatapex.com/reset-password?token=${token}&email=${email}`;

        // 发送重置邮件
        const resendApiKey = c.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('❌ RESEND_API_KEY 未配置');
            return c.json({ error: '邮件服务未配置' }, 500);
        }

        const emailResult = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: c.env.FROM_EMAIL || 'noreply@vatflow.com',
                to: [email],
                template: {
                    id: '908b04c3-2b06-4135-9a95-712d872da7f6',  // Password Reset 模板ID
                    variables: {
                        userName: user.name,
                        resetLink: resetLink
                    }
                }
            })
        });

        if (!emailResult.ok) {
            const errorText = await emailResult.text();
            console.error('❌ 邮件发送失败:', errorText);
            return c.json({ error: '邮件发送失败，请稍后重试' }, 500);
        }

        console.log(`📧 重置邮件已发送到: ${email}`);
        return c.json({
            success: true,
            message: '重置邮件已发送，请检查您的邮箱'
        });

    } catch (error) {
        console.error('❌ 请求重置密码失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

// 2. 验证令牌并重置密码
app.post('/api/v1/auth/reset-password', async (c) => {
    try {
        const { token, email, newPassword } = await c.req.json();

        if (!token || !email || !newPassword) {
            return c.json({ error: '缺少必要参数' }, 400);
        }

        if (newPassword.length < 6) {
            return c.json({ error: '密码长度至少为6位' }, 400);
        }

        // 验证 token
        try {
            const decoded = atob(token);
            const [tenantId, timestamp] = decoded.split(':');
            const tokenTime = parseInt(timestamp);
            const currentTime = Date.now();

            // 检查是否过期（1小时）
            if (currentTime - tokenTime > 3600000) {
                return c.json({ error: '重置链接已过期，请重新请求' }, 400);
            }

            // 验证邮箱是否匹配
            const user = await c.env.DB.prepare(
                'SELECT tenant_id FROM tenants WHERE email = ? AND tenant_id = ?'
            ).bind(email, tenantId).first();

            if (!user) {
                return c.json({ error: '无效的重置链接' }, 400);
            }

            // 加密新密码
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // 更新密码
            await c.env.DB.prepare(
                'UPDATE tenants SET password_hash = ? WHERE tenant_id = ?'
            ).bind(hashedPassword, tenantId).run();

            console.log(`✅ 密码重置成功: ${email}`);
            return c.json({
                success: true,
                message: '密码重置成功，请使用新密码登录'
            });

        } catch (decodeError) {
            console.error('❌ Token 解码失败:', decodeError);
            return c.json({ error: '无效的重置链接' }, 400);
        }

    } catch (error) {
        console.error('❌ 重置密码失败:', error);
        return c.json({ error: error.message }, 500);
    }
});
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
// ===== 租户接口（权限控制 + VAT到期日期） =====
// =============================================

// 获取所有租户（管理员看全部，普通租户只看自己）
app.get('/api/v1/tenants', async (c) => {
    try {
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        let query = 'SELECT tenant_id, name, email, company, country, vat_number, role, status, created_at, vat_expiry_date, last_vat_reminder_sent FROM tenants';
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
});

// 获取单个租户
app.get('/api/v1/tenants/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const role = getUserRole(c);
        const tenantId = getTenantId(c);
        
        if (role !== 'admin' && id !== tenantId) {
            return c.json({ error: '无权访问其他租户数据' }, 403);
        }
        
        const result = await c.env.DB.prepare(
            'SELECT tenant_id, name, email, company, country, vat_number, role, status, created_at, vat_expiry_date, last_vat_reminder_sent FROM tenants WHERE tenant_id = ?'
        ).bind(id).first();
        
        if (!result) {
            return c.json({ error: '租户不存在' }, 404);
        }
        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 创建租户
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
});

// 更新租户
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
});

// 删除租户
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
});

// 获取租户平台
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
});

// 绑定租户平台
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
});

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
// ===== 系统设置接口（完整版） =====
// =============================================

// ===== 获取所有设置 =====
app.get('/api/v1/settings', async (c) => {
    try {
        const tenantId = getTenantId(c);
        
        let query = 'SELECT setting_key, setting_value, updated_at FROM system_settings';
        const params = [];
        
        if (tenantId) {
            query += ' WHERE tenant_id = ? OR tenant_id IS NULL';
            params.push(tenantId);
        }
        
        const { results } = await c.env.DB.prepare(query).bind(...params).all();
        
        const settings = {};
        results.forEach(row => {
            try {
                settings[row.setting_key] = JSON.parse(row.setting_value);
            } catch {
                settings[row.setting_key] = row.setting_value;
            }
        });
        
        const defaultSettings = {
            systemName: 'VATFlow',
            currency: 'EUR',
            vatRate: 20,
            maintenanceMode: false,
            taxPeriod: 'quarterly',
            defaultCountry: 'GB',
            autoValidate: false,
            emailNotifications: false,
            smsNotifications: false,
            pushNotifications: false,
            language: 'zh-CN',
            timezone: 'UTC+8',
            dateFormat: 'YYYY-MM-DD'
        };
        
        return c.json({ 
            success: true, 
            data: { ...defaultSettings, ...settings } 
        });
    } catch (error) {
        console.error('❌ 获取设置失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ===== 保存设置 =====
app.post('/api/v1/settings', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const body = await c.req.json();
        
        // 支持两种格式
        let settingsToSave = {};
        if (body.key && body.value) {
            settingsToSave = body.value;
        } else {
            settingsToSave = body;
        }
        
        for (const [key, value] of Object.entries(settingsToSave)) {
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            
            await c.env.DB.prepare(
                `INSERT INTO system_settings (setting_key, setting_value, tenant_id, updated_at) 
                 VALUES (?, ?, ?, datetime("now")) 
                 ON CONFLICT(setting_key, tenant_id) DO UPDATE SET 
                 setting_value = ?, updated_at = datetime("now")`
            ).bind(key, valueStr, tenantId, valueStr).run();
        }
        
        return c.json({ 
            success: true, 
            message: '设置保存成功',
            data: settingsToSave
        });
    } catch (error) {
        console.error('❌ 保存设置失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ===== 获取单个设置 =====
app.get('/api/v1/settings/:key', async (c) => {
    try {
        const key = c.req.param('key');
        const tenantId = getTenantId(c);
        
        const result = await c.env.DB.prepare(
            'SELECT setting_value FROM system_settings WHERE setting_key = ? AND (tenant_id = ? OR tenant_id IS NULL)'
        ).bind(key, tenantId).first();
        
        if (result && result.setting_value) {
            try {
                const value = JSON.parse(result.setting_value);
                return c.json({ success: true, data: { [key]: value } });
            } catch {
                return c.json({ success: true, data: { [key]: result.setting_value } });
            }
        }
        
        return c.json({ success: true, data: { [key]: null } });
    } catch (error) {
        console.error('❌ 获取设置失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ===== 通知设置接口 =====

// ===== 获取通知设置（移除短信） =====
app.get('/api/v1/settings/notifications', async (c) => {
    try {
        const tenantId = getTenantId(c);
        
        const result = await c.env.DB.prepare(
            'SELECT setting_value FROM system_settings WHERE setting_key = ? AND (tenant_id = ? OR tenant_id IS NULL)'
        ).bind('notifications', tenantId).first();
        
        const defaultSettings = {
            emailNotifications: false,
            pushNotifications: false
        };
        
        if (result && result.setting_value) {
            try {
                const settings = JSON.parse(result.setting_value);
                return c.json({ 
                    success: true, 
                    data: { ...defaultSettings, ...settings } 
                });
            } catch (e) {
                return c.json({ success: true, data: defaultSettings });
            }
        }
        
        return c.json({ success: true, data: defaultSettings });
    } catch (error) {
        console.error('❌ 获取通知设置失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ===== 保存通知设置（移除短信） =====
app.post('/api/v1/settings/notifications', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const settings = await c.req.json();
        
        await c.env.DB.prepare(
            `INSERT INTO system_settings (setting_key, setting_value, tenant_id, updated_at) 
             VALUES (?, ?, ?, datetime("now")) 
             ON CONFLICT(setting_key, tenant_id) DO UPDATE SET 
             setting_value = ?, updated_at = datetime("now")`
        ).bind('notifications', JSON.stringify(settings), tenantId, JSON.stringify(settings)).run();
        
        return c.json({ 
            success: true, 
            message: '通知设置更新成功',
            data: settings
        });
    } catch (error) {
        console.error('❌ 保存通知设置失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ===== 发送测试通知（移除短信） =====
app.post('/api/v1/notifications/test', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const { email } = await c.req.json();
        
        // 获取用户信息
        const user = await c.env.DB.prepare(
            'SELECT email FROM tenants WHERE tenant_id = ?'
        ).bind(tenantId).first();
        
        const toEmail = email || user?.email || 'admin@vatflow.com';
        
        // 获取通知设置
        const settingsResult = await c.env.DB.prepare(
            'SELECT setting_value FROM system_settings WHERE setting_key = ? AND (tenant_id = ? OR tenant_id IS NULL)'
        ).bind('notifications', tenantId).first();
        
        let settings = {
            emailNotifications: false,
            pushNotifications: false
        };
        
        if (settingsResult && settingsResult.setting_value) {
            try {
                settings = JSON.parse(settingsResult.setting_value);
            } catch (e) {}
        }
        
        const results = {
            email: {
                enabled: settings.emailNotifications,
                sent: false,
                to: toEmail,
                message: settings.emailNotifications ? '邮件已发送' : '邮件通知未开启'
            },
            push: {
                enabled: settings.pushNotifications,
                sent: false,
                message: settings.pushNotifications ? '推送已发送' : '推送通知未开启'
            }
        };
        
        // 如果开启了邮件通知，尝试发送
        if (settings.emailNotifications) {
            try {
                const resendApiKey = c.env.RESEND_API_KEY;
                if (resendApiKey) {
                    const emailResult = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${resendApiKey}`
                        },
                        body: JSON.stringify({
                            from: c.env.FROM_EMAIL || 'noreply@vatflow.com',
                            to: [toEmail],
                            subject: '🧪 VATFlow 测试通知',
                            html: `
                                <h2>🧪 测试通知</h2>
                                <p>您好，这是一条来自 VATFlow 系统的测试通知。</p>
                                <p>如果您收到此邮件，说明邮件通知功能配置正确。</p>
                                <p>发送时间: ${new Date().toLocaleString()}</p>
                                <hr>
                                <p><a href="https://vatflow.vatapex.com">访问 VATFlow</a></p>
                            `
                        })
                    });
                    
                    if (emailResult.ok) {
                        results.email.sent = true;
                        results.email.message = '✅ 测试邮件已发送';
                    } else {
                        const errorText = await emailResult.text();
                        results.email.message = '❌ 邮件发送失败: ' + errorText;
                    }
                } else {
                    results.email.message = '⚠️ 邮件服务未配置 (缺少 RESEND_API_KEY)';
                }
            } catch (emailError) {
                results.email.message = '❌ 邮件发送失败: ' + emailError.message;
            }
        }
        
        return c.json({ 
            success: true, 
            message: '测试通知完成',
            data: {
                settings,
                results,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ 测试通知失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

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

// backend/src/worker.js
// =============================================
// ===== 报告接口（含邮件通知） =====
// =============================================

// 获取报告列表
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

// 生成报告
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

        // =============================================
        // ===== 发送报告生成通知邮件 =====
        // =============================================
        try {
            // 获取租户邮箱
            const tenant = await c.env.DB.prepare(
                'SELECT email, name FROM tenants WHERE tenant_id = ?'
            ).bind(tenantId).first();

            if (tenant && tenant.email) {
                const resendApiKey = c.env.RESEND_API_KEY;
                if (resendApiKey) {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${resendApiKey}`
                        },
                        body: JSON.stringify({
                            from: c.env.FROM_EMAIL || 'noreply@vatflow.com',
                            to: [tenant.email],
                            template: {
                                id: '43792e0e-dc3e-4098-bf2a-220a8c78a7ca',  // Report Ready Notification 模板ID
                                variables: {
                                    userName: tenant.name || '用户',
                                    reportId: reportId,
                                    period: filters?.period || 'N/A',
                                    totalVat: totalVat.toFixed(2),
                                    transactionCount: results.length,
                                    link: 'https://vatflow.vatapex.com/reports'
                                }
                            }
                        })
                    });
                    console.log(`📧 报告生成通知已发送到: ${tenant.email}`);
                }
            }
        } catch (emailError) {
            console.error('❌ 发送报告通知邮件失败:', emailError);
        }

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

// backend/src/worker.js
// =============================================
// ===== 税务接口（含 PVA 递延增值税支持 + 邮件通知） =====
// =============================================
app.post('/api/v1/tax/validate', async (c) => {
    try {
        const body = await c.req.json()
        const { vatNumber, amount, country, period, taxType, pvaReason, pvaReference } = body

        console.log('📤 税务校验请求:', { vatNumber, amount, country, period, taxType })

        if (!vatNumber || !country) {
            return c.json({ success: false, error: 'VAT号码和国家为必填项' }, 400)
        }

        const countryCode = country.toUpperCase()
        const taxRate = TAX_RATES[countryCode] || 20
        const currency = CURRENCY_MAP[countryCode] || 'EUR'
        const countryName = COUNTRY_NAME_MAP[countryCode] || countryCode

        const netAmount = amount || 0
        let vatAmount = netAmount * (taxRate / 100)
        let grossAmount = netAmount + vatAmount
        let taxTypeLabel = '标准VAT'

        // ===== PVA 递延增值税处理 =====
        if (taxType === 'pva') {
            vatAmount = 0
            grossAmount = netAmount
            taxTypeLabel = '递延增值税 (PVA)'
            console.log(`📋 PVA 递延: ${pvaReason || '未指定'}, 参考号: ${pvaReference || '无'}`)
        }

        if (taxType === 'import') {
            taxTypeLabel = '进口VAT'
        }

        // VAT 号码格式验证
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

        const additionalInfo = {}
        if (taxType === 'pva') {
            additionalInfo.pvaReason = pvaReason || '未指定'
            additionalInfo.pvaReference = pvaReference || '无'
            additionalInfo.taxType = 'pva'
            additionalInfo.deferredVAT = vatAmount
        }

        // =============================================
        // ===== 发送税务校验通知邮件 =====
        // =============================================
        try {
            const tenantId = getTenantId(c);
            
            // 获取租户邮箱
            const tenant = await c.env.DB.prepare(
                'SELECT email, name FROM tenants WHERE tenant_id = ?'
            ).bind(tenantId).first();

            if (tenant && tenant.email) {
                const resendApiKey = c.env.RESEND_API_KEY;
                if (resendApiKey) {
                    const statusText = valid ? '✅ 通过' : '⚠️ 需复核';
                    
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${resendApiKey}`
                        },
                        body: JSON.stringify({
                            from: c.env.FROM_EMAIL || 'noreply@vatflow.com',
                            to: [tenant.email],
                            template: {
                                id: '7239cbb6-8965-4883-82f7-b9685fd3b558',  // Tax Validation Notification 模板ID
                                variables: {
                                    userName: tenant.name || '用户',
                                    vatNumber: vatNumber,
                                    country: countryName,
                                    status: statusText,
                                    vatAmount: vatAmount.toFixed(2),
                                    link: 'https://vatflow.vatapex.com/tax-validation'
                                }
                            }
                        })
                    });
                    console.log(`📧 税务校验通知已发送到: ${tenant.email}`);
                }
            }
        } catch (emailError) {
            // 邮件发送失败不影响主流程
            console.error('❌ 发送税务校验通知邮件失败:', emailError);
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
                taxType: taxTypeLabel,
                timestamp: new Date().toISOString(),
                ...additionalInfo
            }
        })
    } catch (error) {
        console.error('❌ 税务校验错误:', error)
        return c.json({ success: false, error: error.message || '税务校验失败' }, 500)
    }
})

// =============================================
// ===== 税务平台列表（完整版） =====
// =============================================
app.get('/api/v1/tax/platforms', async (c) => {
    try {
        const platforms = [
            // 电商平台（20个）
            { id: 'amazon', name: 'Amazon', icon: 'amazon' },
            { id: 'ebay', name: 'eBay', icon: 'ebay' },
            { id: 'aliexpress', name: 'AliExpress', icon: 'aliexpress' },
            { id: 'allegro', name: 'Allegro', icon: 'allegro' },
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
            { id: 'depop', name: 'Depop', icon: 'depop' },
            { id: 'mercari', name: 'Mercari', icon: 'mercari' },
            { id: 'poshmark', name: 'Poshmark', icon: 'poshmark' },
            { id: 'rakuten', name: 'Rakuten', icon: 'rakuten' },
            { id: 'wish', name: 'Wish', icon: 'wish' },
            { id: 'yahoo', name: 'Yahoo Shopping', icon: 'yahoo' },
        ]
        return c.json({ success: true, data: platforms })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 电商平台与支持的国家列表（完整版） =====
// =============================================
app.get('/api/v1/tax/ecommerce-platforms', async (c) => {
    try {
        const platforms = [
            { id: 'amazon', name: 'Amazon', countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE', 'BE', 'AT'] },
            { id: 'ebay', name: 'eBay', countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT'] },
            { id: 'aliexpress', name: 'AliExpress', countries: ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'PL', 'SE'] },
            { id: 'allegro', name: 'Allegro', countries: ['PL', 'CZ', 'SK', 'HU'] },
            { id: 'shopify', name: 'Shopify', countries: ['GB', 'US', 'CA', 'AU', 'NZ', 'DE', 'FR', 'IT', 'ES'] },
            { id: 'etsy', name: 'Etsy', countries: ['GB', 'FR', 'DE', 'IT', 'NL', 'SE', 'PL', 'US', 'CA', 'AU'] },
            { id: 'walmart', name: 'Walmart', countries: ['US', 'CA', 'MX'] },
            { id: 'target', name: 'Target', countries: ['US'] },
            { id: 'zalando', name: 'Zalando', countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE', 'BE', 'AT', 'GB'] },
            { id: 'lazada', name: 'Lazada', countries: ['SG', 'MY', 'TH', 'VN', 'PH', 'ID'] },
            { id: 'shopee', name: 'Shopee', countries: ['SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'TW'] },
            { id: 'temu', name: 'Temu', countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'] },
            { id: 'shein', name: 'SHEIN', countries: ['US', 'GB', 'FR', 'DE', 'IT', 'ES', 'AU', 'MX'] },
            { id: 'tiktok', name: 'TikTok Shop', countries: ['GB', 'US', 'SG', 'TH', 'VN', 'PH', 'MY', 'ID'] },
            { id: 'depop', name: 'Depop', countries: ['GB', 'US', 'AU', 'FR', 'DE', 'IT', 'ES'] },
            { id: 'mercari', name: 'Mercari', countries: ['JP', 'US'] },
            { id: 'poshmark', name: 'Poshmark', countries: ['US', 'CA', 'AU'] },
            { id: 'rakuten', name: 'Rakuten', countries: ['JP'] },
            { id: 'wish', name: 'Wish', countries: ['US', 'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'SE', 'PL'] },
            { id: 'yahoo', name: 'Yahoo Shopping', countries: ['JP'] },
        ]
        return c.json({ success: true, data: platforms })
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

// =============================================
// ===== 平台配置 =====
// =============================================
const PLATFORM_CONFIG = {
    amazon: { countryMode: 'auto', defaultCountry: null },
    ebay: { countryMode: 'auto', defaultCountry: null },
    aliexpress: { countryMode: 'auto', defaultCountry: null },
    etsy: { countryMode: 'auto', defaultCountry: null },
    wish: { countryMode: 'auto', defaultCountry: null },
    temu: { countryMode: 'auto', defaultCountry: null },
    shein: { countryMode: 'auto', defaultCountry: null },
    depop: { countryMode: 'auto', defaultCountry: null },
    zalando: { countryMode: 'auto', defaultCountry: null },
    tiktok: { countryMode: 'auto', defaultCountry: null },
    lazada: { countryMode: 'auto', defaultCountry: null },
    shopee: { countryMode: 'auto', defaultCountry: null },
    shopify: { countryMode: 'manual', defaultCountry: 'GB' },
    walmart: { countryMode: 'manual', defaultCountry: 'US' },
    target: { countryMode: 'manual', defaultCountry: 'US' },
    allegro: { countryMode: 'manual', defaultCountry: 'PL' },
    rakuten: { countryMode: 'manual', defaultCountry: 'JP' },
    yahoo: { countryMode: 'manual', defaultCountry: 'JP' },
    mercari: { countryMode: 'manual', defaultCountry: 'JP' },
    poshmark: { countryMode: 'manual', defaultCountry: 'US' },
};

// =============================================
// ===== 国家映射表 =====
// =============================================
const COUNTRY_MAP = {
    'UK': 'GB', 'UNITED KINGDOM': 'GB', 'GB': 'GB',
    'FRANCE': 'FR', 'FR': 'FR',
    'GERMANY': 'DE', 'DE': 'DE',
    'ITALY': 'IT', 'IT': 'IT',
    'SPAIN': 'ES', 'ES': 'ES',
    'NETHERLANDS': 'NL', 'NL': 'NL',
    'BELGIUM': 'BE', 'BE': 'BE',
    'POLAND': 'PL', 'PL': 'PL',
    'SWEDEN': 'SE', 'SE': 'SE',
    'DENMARK': 'DK', 'DK': 'DK',
    'FINLAND': 'FI', 'FI': 'FI',
    'IRELAND': 'IE', 'IE': 'IE',
    'PORTUGAL': 'PT', 'PT': 'PT',
    'AUSTRIA': 'AT', 'AT': 'AT',
    'NORWAY': 'NO', 'NO': 'NO',
    'SWITZERLAND': 'CH', 'CH': 'CH',
    'JAPAN': 'JP', 
    'SINGAPORE': 'SG', 'SG': 'SG',
    'MALAYSIA': 'MY', 'MY': 'MY',
    'THAILAND': 'TH', 'TH': 'TH',
    'VIETNAM': 'VN', 'VN': 'VN',
    'INDONESIA': 'ID', 'ID': 'ID',
    'PHILIPPINES': 'PH', 'PH': 'PH',
    'USA': 'US', 'UNITED STATES': 'US', 'US': 'US',
    'CANADA': 'CA', 'CA': 'CA',
    'AUSTRALIA': 'AU', 'AU': 'AU',
    'NEW ZEALAND': 'NZ', 'NZ': 'NZ'
};

// =============================================
// ===== 文件上传接口 =====
// =============================================
app.post('/api/v1/files/upload', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const body = await c.req.parseBody();
        const files = body['files'];
        const platform = body['platform'] || 'amazon';
        const year = body['year'] || new Date().getFullYear().toString();
        const month = body['month'] || '01';
        const userCountry = body['country'] || 'GB';

        if (!files) {
            return c.json({ error: '没有文件' }, 400);
        }

        const platformConfig = PLATFORM_CONFIG[platform] || { countryMode: 'manual', defaultCountry: 'GB' };
        const isAutoCountry = platformConfig.countryMode === 'auto';

        const fileArray = Array.isArray(files) ? files : [files];
        const transactions = [];
        const countrySummary = {};

        for (const file of fileArray) {
            const content = await file.text();
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) continue;

            const header = lines[0]?.split(',') || [];
            const countryIndex = header.findIndex(h => 
                h.toLowerCase().includes('country') || 
                h.toLowerCase().includes('nation') ||
                h.toLowerCase().includes('marketplace') ||
                h.toLowerCase().includes('ship_country')
            );
            const vatIndex = header.findIndex(h => 
                h.toLowerCase().includes('vat') || 
                h.toLowerCase().includes('tax')
            );
            const amountIndex = header.findIndex(h => 
                h.toLowerCase().includes('amount') || 
                h.toLowerCase().includes('total') ||
                h.toLowerCase().includes('price') ||
                h.toLowerCase().includes('net')
            );
            const orderIdIndex = header.findIndex(h => 
                h.toLowerCase().includes('order') || 
                h.toLowerCase().includes('id') ||
                h.toLowerCase().includes('transaction') ||
                h.toLowerCase().includes('ref')
            );

            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length < 2) continue;
                
                let country = userCountry;
                if (isAutoCountry && countryIndex >= 0 && parts[countryIndex]) {
                    const detectedCountry = parts[countryIndex].trim().toUpperCase();
                    country = COUNTRY_MAP[detectedCountry] || detectedCountry;
                }

                if (!TAX_RATES[country]) {
                    country = userCountry;
                }

                const orderId = orderIdIndex >= 0 && parts[orderIdIndex] 
                    ? parts[orderIdIndex].trim() 
                    : `ORD-${Date.now()}-${i}`;
                
                let netAmount = 0;
                let vatAmount = 0;
                let grossAmount = 0;
                
                if (amountIndex >= 0 && parts[amountIndex]) {
                    const rawAmount = parseFloat(parts[amountIndex].replace(/[^0-9.-]/g, '')) || 0;
                    
                    if (vatIndex >= 0 && parts[vatIndex]) {
                        vatAmount = parseFloat(parts[vatIndex].replace(/[^0-9.-]/g, '')) || 0;
                        netAmount = rawAmount - vatAmount;
                    } else {
                        const taxRate = TAX_RATES[country] || 20;
                        netAmount = rawAmount;
                        vatAmount = netAmount * (taxRate / 100);
                    }
                    grossAmount = netAmount + vatAmount;
                }

                if (netAmount === 0 && vatAmount === 0) continue;

                const transaction = {
                    tenant_id: tenantId,
                    order_id: orderId,
                    order_date: new Date().toISOString().split('T')[0],
                    country: country,
                    vat_number: '',
                    net_amount: netAmount,
                    vat_amount: vatAmount,
                    gross_amount: grossAmount,
                    tax_rate: TAX_RATES[country] || 20,
                    period: `${year}-${month}`,
                    platform: platform,
                    status: 'pending',
                    product_sku: '',
                    quantity: 1
                };
                transactions.push(transaction);

                if (!countrySummary[country]) {
                    countrySummary[country] = { count: 0, net: 0, vat: 0, gross: 0 };
                }
                countrySummary[country].count++;
                countrySummary[country].net += netAmount;
                countrySummary[country].vat += vatAmount;
                countrySummary[country].gross += grossAmount;
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
                saved: created,
                countries: countrySummary,
                transactions: transactions
            }
        });
    } catch (error) {
        console.error('❌ 文件上传错误:', error);
        return c.json({ error: error.message }, 500);
    }
});

// =============================================
// ===== 获取文件列表 =====
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

        return c.json({ success: true, data: results, total: results.length });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

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
        return c.json({ success: true, message: '删除成功' });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// =============================================
// ===== 推送订阅接口 =====
// =============================================

// 保存推送订阅
app.post('/api/v1/push/subscribe', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const subscription = await c.req.json();

        if (!subscription || !subscription.endpoint) {
            return c.json({ error: '无效的订阅信息' }, 400);
        }

        await c.env.DB.prepare(
            `INSERT INTO push_subscriptions (tenant_id, endpoint, keys, created_at) 
             VALUES (?, ?, ?, datetime("now")) 
             ON CONFLICT(tenant_id, endpoint) DO UPDATE SET keys = ?, updated_at = datetime("now")`
        ).bind(
            tenantId,
            subscription.endpoint,
            JSON.stringify(subscription.keys),
            JSON.stringify(subscription.keys)
        ).run();

        return c.json({
            success: true,
            message: '订阅成功'
        });
    } catch (error) {
        console.error('❌ 订阅保存失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

// 取消订阅
app.post('/api/v1/push/unsubscribe', async (c) => {
    try {
        const tenantId = getTenantId(c);
        const { endpoint } = await c.req.json();

        if (!endpoint) {
            return c.json({ error: '缺少 endpoint' }, 400);
        }

        await c.env.DB.prepare(
            'DELETE FROM push_subscriptions WHERE tenant_id = ? AND endpoint = ?'
        ).bind(tenantId, endpoint).run();

        return c.json({
            success: true,
            message: '取消订阅成功'
        });
    } catch (error) {
        console.error('❌ 取消订阅失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

// 发送测试推送
app.post('/api/v1/push/test', async (c) => {
    try {
        const tenantId = getTenantId(c);

        const { results } = await c.env.DB.prepare(
            'SELECT endpoint, keys FROM push_subscriptions WHERE tenant_id = ?'
        ).bind(tenantId).all();

        if (!results || results.length === 0) {
            return c.json({
                success: false,
                message: '没有订阅用户',
                data: { sent: 0 }
            });
        }

        const vapidPrivateKey = c.env.VAPID_PRIVATE_KEY;
        if (!vapidPrivateKey) {
            return c.json({
                success: false,
                message: 'VAPID_PRIVATE_KEY 未配置'
            }, 500);
        }

        let sent = 0;
        let failed = 0;

        for (const sub of results) {
            try {
                const subscription = {
                    endpoint: sub.endpoint,
                    keys: JSON.parse(sub.keys)
                };

                const { endpoint, headers, body } = await buildPushHTTPRequest({
                    privateJWK: vapidPrivateKey,
                    subscription: subscription,
                    message: {
                        payload: {
                            title: '🧪 测试推送',
                            body: `这是来自 VATFlow 的测试推送通知！时间: ${new Date().toLocaleString()}`,
                            icon: '/favicon.ico',
                            url: '/dashboard'
                        },
                        adminContact: 'mailto:admin@vatapex.com',
                        options: {
                            urgency: 'high',
                            ttl: 3600
                        }
                    }
                });

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body
                });

                if (response.ok) {
                    sent++;
                } else {
                    failed++;
                    if (response.status === 410) {
                        await c.env.DB.prepare(
                            'DELETE FROM push_subscriptions WHERE tenant_id = ? AND endpoint = ?'
                        ).bind(tenantId, sub.endpoint).run();
                    }
                }
            } catch (err) {
                console.error('❌ 推送发送失败:', err);
                failed++;
            }
        }

        return c.json({
            success: true,
            message: '推送测试完成',
            data: { sent, failed, total: results.length }
        });
    } catch (error) {
        console.error('❌ 测试推送失败:', error);
        return c.json({ error: error.message }, 500);
    }
});

// backend/src/worker.js

// =============================================
// ===== VAT 到期日期管理接口 =====
// =============================================

// 获取 VAT 到期日期
app.get('/api/v1/tenants/:id/vat-expiry', async (c) => {
    try {
        const tenantId = c.req.param('id');
        const currentTenantId = getTenantId(c);
        const role = getUserRole(c);
        
        if (role !== 'admin' && tenantId !== currentTenantId) {
            return c.json({ error: '无权查看其他租户信息' }, 403);
        }
        
        const result = await c.env.DB.prepare(
            'SELECT tenant_id, vat_expiry_date FROM tenants WHERE tenant_id = ?'
        ).bind(tenantId).first();
        
        return c.json({
            success: true,
            data: {
                vatExpiryDate: result?.vat_expiry_date || null,
                tenantId: tenantId
            }
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 设置 VAT 到期日期（仅管理员 - 首次设置）
app.put('/api/v1/tenants/:id/vat-expiry/set', async (c) => {
    try {
        const tenantId = c.req.param('id');
        const role = getUserRole(c);
        
        if (role !== 'admin') {
            return c.json({ error: '权限不足，仅管理员可设置' }, 403);
        }
        
        const { vatExpiryDate } = await c.req.json();
        
        if (!vatExpiryDate) {
            return c.json({ error: '请输入到期日期' }, 400);
        }
        
        await c.env.DB.prepare(
            'UPDATE tenants SET vat_expiry_date = ?, last_vat_reminder_sent = NULL WHERE tenant_id = ?'
        ).bind(vatExpiryDate, tenantId).run();
        
        return c.json({
            success: true,
            message: 'VAT到期日期设置成功',
            data: { vatExpiryDate }
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 续期（仅管理员，记录合同/转账信息）
app.put('/api/v1/tenants/:id/vat-extend', async (c) => {
    try {
        const tenantId = c.req.param('id');
        const role = getUserRole(c);
        
        if (role !== 'admin') {
            return c.json({ error: '权限不足，仅管理员可续期' }, 403);
        }
        
        const { extendYears = 1, contractNumber, paymentDate, paymentAmount } = await c.req.json();
        
        const current = await c.env.DB.prepare(
            'SELECT vat_expiry_date FROM tenants WHERE tenant_id = ?'
        ).bind(tenantId).first();
        
        const today = new Date();
        let baseDate = today;
        if (current?.vat_expiry_date) {
            const expiryDate = new Date(current.vat_expiry_date);
            if (expiryDate > today) {
                baseDate = expiryDate;
            }
        }
        
        const newDate = new Date(baseDate);
        newDate.setFullYear(newDate.getFullYear() + extendYears);
        const newExpiryDate = newDate.toISOString().split('T')[0];
        
        await c.env.DB.prepare(
            `UPDATE tenants SET 
                vat_expiry_date = ?, 
                last_vat_reminder_sent = NULL,
                last_extend_date = ?,
                last_extend_years = ?,
                last_contract_number = ?,
                last_payment_date = ?,
                last_payment_amount = ?
             WHERE tenant_id = ?`
        ).bind(
            newExpiryDate,
            new Date().toISOString().split('T')[0],
            extendYears,
            contractNumber || null,
            paymentDate || null,
            paymentAmount || null,
            tenantId
        ).run();
        
        return c.json({
            success: true,
            message: `✅ VAT已续期 ${extendYears} 年`,
            data: {
                oldExpiryDate: current?.vat_expiry_date || null,
                newExpiryDate: newExpiryDate,
                extendYears: extendYears,
                contractNumber: contractNumber || null,
                paymentDate: paymentDate || null,
                paymentAmount: paymentAmount || null
            }
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});
// =============================================
// ===== 发送 VAT 到期提醒邮件（使用 Resend 模板） =====
// =============================================
async function sendVatExpiryEmail(env, tenant, daysRemaining) {
    try {
        const resendApiKey = env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.log('⚠️ RESEND_API_KEY 未配置');
            return;
        }

        // 判断紧急程度
        let urgency = '';
        if (daysRemaining <= 1) {
            urgency = '🔴 紧急';
        } else if (daysRemaining <= 7) {
            urgency = '🟠 即将到期';
        } else if (daysRemaining <= 30) {
            urgency = '🟡 需要注意';
        } else {
            urgency = '🟢 准备中';
        }

        const fromEmail = env.FROM_EMAIL || 'noreply@vatflow.com';
        
        // ===== 使用 Resend 模板发送 =====
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [tenant.email],
                template: {
                    id: '690766c3-17cc-4dc8-9d81-d15e898418d5',  // VAT Expiry Reminder 模板ID
                    variables: {
                        tenantName: tenant.name || '租户',
                        companyName: tenant.company || '-',
                        daysRemaining: daysRemaining,
                        urgency: urgency,
                        expiryDate: tenant.vat_expiry_date || '未设置',
                        link: 'https://vatflow.vatapex.com/tenants'
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 邮件发送失败:', errorText);
        } else {
            console.log(`📧 VAT到期提醒已发送到: ${tenant.email} (${daysRemaining}天后到期)`);
        }
    } catch (error) {
        console.error('❌ 发送VAT到期提醒邮件失败:', error);
    }
}
// =============================================
// ===== 定时任务函数（放在这里） =====
// =============================================
async function checkVatExpiry(env) {
    console.log('🔍 开始检查VAT到期日期...');
    
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
        const { results } = await env.DB.prepare(
            `SELECT tenant_id, name, email, company, vat_expiry_date, last_vat_reminder_sent 
             FROM tenants 
             WHERE vat_expiry_date IS NOT NULL 
             AND vat_expiry_date BETWEEN ? AND ?`
        ).bind(today, ninetyDaysLater).all();

        console.log(`📊 找到 ${results.length} 个即将到期的租户`);

        const reminderDays = [90, 60, 30, 15, 7, 3, 1];

        for (const tenant of results) {
            const expiryDate = new Date(tenant.vat_expiry_date);
            const todayDate = new Date();
            const daysRemaining = Math.ceil((expiryDate - todayDate) / (1000 * 60 * 60 * 24));

            let shouldSend = false;
            if (reminderDays.includes(daysRemaining) && daysRemaining >= 0) {
                const reminderKey = `${daysRemaining}d`;
                const lastReminder = tenant.last_vat_reminder_sent || '';
                if (!lastReminder.includes(reminderKey)) {
                    shouldSend = true;
                }
            }

            if (daysRemaining === 0 && !(tenant.last_vat_reminder_sent || '').includes('today')) {
                shouldSend = true;
            }

            if (shouldSend) {
                await sendVatExpiryEmail(env, tenant, daysRemaining);
                
                const newLastReminder = tenant.last_vat_reminder_sent 
                    ? `${tenant.last_vat_reminder_sent},${daysRemaining}d` 
                    : `${daysRemaining}d`;
                await env.DB.prepare(
                    'UPDATE tenants SET last_vat_reminder_sent = ? WHERE tenant_id = ?'
                ).bind(newLastReminder, tenant.tenant_id).run();
                
                console.log(`✅ 已发送提醒给 ${tenant.name} (${daysRemaining}天后到期)`);
            }
        }

        console.log('✅ VAT到期检查完成');
    } catch (error) {
        console.error('❌ VAT到期检查失败:', error);
    }
}

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

// =============================================
// ===== 导出（定时任务触发） =====
// =============================================
export default {
    fetch: app.fetch,
    async scheduled(event, env, ctx) {
        console.log(`🕐 定时任务触发: ${event.cron}`);
        await checkVatExpiry(env);
    }
};