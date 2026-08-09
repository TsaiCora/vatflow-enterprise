// backend/src/worker.js
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as bcrypt from 'bcryptjs'

const app = new Hono()
app.use('*', cors())

// ===== 健康检查 =====
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'VATFlow API running on Cloudflare Workers',
    timestamp: new Date().toISOString()
  })
})

// ===== 根路径 =====
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
      'GET /api/v1/settings/:key',
      'GET /api/v1/settings',
      'POST /api/v1/settings',
      'GET /api/v1/dashboard',
      'GET /api/v1/reports',
      // 税务相关接口
      'POST /api/v1/tax/validate',
      'POST /api/v1/tax/summary',
      'POST /api/v1/tax/c79/upload',
      'POST /api/v1/tax/c88/upload'
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
// ===== 租户接口 =====
// =============================================
app.get('/api/v1/tenants', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT tenant_id, name, email, company, country, vat_number, role, status, created_at FROM tenants'
    ).all()
    return c.json({
      success: true,
      data: results,
      total: results.length
    })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.get('/api/v1/tenants/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const result = await c.env.DB.prepare(
      'SELECT tenant_id, name, email, company, country, vat_number, role, status, created_at FROM tenants WHERE tenant_id = ?'
    ).bind(id).first()
    if (!result) {
      return c.json({ error: '租户不存在' }, 404)
    }
    return c.json({ success: true, data: result })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/v1/tenants', async (c) => {
  try {
    const { tenant_id, name, email, password, company, country, vat_number, role } = await c.req.json()
    if (!tenant_id || !name || !email || !password) {
      return c.json({ error: '缺少必填字段' }, 400)
    }

    const hash = await bcrypt.hash(password, 10)
    await c.env.DB.prepare(
      'INSERT INTO tenants (tenant_id, name, email, password_hash, company, country, vat_number, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(tenant_id, name, email, hash, company || '', country || 'GB', vat_number || '', role || 'user', 'active').run()

    return c.json({ success: true, message: '租户创建成功', tenant_id })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.put('/api/v1/tenants/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { name, email, company, country, vat_number, role, status } = await c.req.json()
    await c.env.DB.prepare(
      'UPDATE tenants SET name = ?, email = ?, company = ?, country = ?, vat_number = ?, role = ?, status = ? WHERE tenant_id = ?'
    ).bind(name, email, company || '', country || 'GB', vat_number || '', role || 'user', status || 'active', id).run()
    return c.json({ success: true, message: '租户更新成功' })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.delete('/api/v1/tenants/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM tenants WHERE tenant_id = ?').bind(id).run()
    return c.json({ success: true, message: '租户删除成功' })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// ===== 获取客户的平台绑定 =====
app.get('/api/v1/tenants/:id/platforms', async (c) => {
  try {
    const id = c.req.param('id')
    const { results } = await c.env.DB.prepare(
      'SELECT tp.*, p.name as platform_name, p.icon FROM tenant_platforms tp JOIN platforms p ON tp.platform_code = p.code WHERE tp.tenant_id = ?'
    ).bind(id).all()
    return c.json({ success: true, data: results })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// ===== 绑定客户平台 =====
app.post('/api/v1/tenants/:id/platforms', async (c) => {
  try {
    const id = c.req.param('id')
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
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM filings ORDER BY created_at DESC'
    ).all()
    return c.json({ success: true, data: results, total: results.length })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/v1/filings', async (c) => {
  try {
    const { tenant_id, period, country, total_net, total_vat, total_gross, transaction_count, status } = await c.req.json()
    if (!tenant_id || !period) {
      return c.json({ error: '缺少必填字段' }, 400)
    }

    await c.env.DB.prepare(
      'INSERT INTO filings (tenant_id, period, country, total_net, total_vat, total_gross, transaction_count, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))'
    ).bind(tenant_id, period, country || '', total_net || 0, total_vat || 0, total_gross || 0, transaction_count || 0, status || 'draft').run()

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
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM vat_profiles'
    ).all()
    return c.json({ success: true, data: results, total: results.length })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/v1/vat-profiles', async (c) => {
  try {
    const { tenant_id, vat_number, country, company_name, company_address, tax_rate, is_default } = await c.req.json()
    if (!tenant_id || !vat_number || !country) {
      return c.json({ error: '缺少必填字段' }, 400)
    }

    await c.env.DB.prepare(
      'INSERT INTO vat_profiles (tenant_id, vat_number, country, company_name, company_address, tax_rate, is_default, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))'
    ).bind(tenant_id, vat_number, country, company_name || '', company_address || '', tax_rate || 0, is_default || 0, 'active').run()

    return c.json({ success: true, message: 'VAT资料创建成功' })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// =============================================
// ===== 交易记录 =====
// =============================================
app.get('/api/v1/transactions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM transactions ORDER BY created_at DESC'
    ).all()
    return c.json({ success: true, data: results, total: results.length })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/v1/transactions', async (c) => {
  try {
    const { tenant_id, order_id, order_date, country, vat_number, net_amount, vat_amount, gross_amount, tax_rate, period, platform, status, product_sku, quantity } = await c.req.json()
    if (!tenant_id || !order_id) {
      return c.json({ error: '缺少必填字段' }, 400)
    }

    await c.env.DB.prepare(
      'INSERT INTO transactions (tenant_id, order_id, order_date, country, vat_number, net_amount, vat_amount, gross_amount, tax_rate, period, platform, status, product_sku, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(tenant_id, order_id, order_date || null, country || '', vat_number || '', net_amount || 0, vat_amount || 0, gross_amount || 0, tax_rate || 0, period || '', platform || '', status || 'pending', product_sku || '', quantity || 1).run()

    return c.json({ success: true, message: '交易记录创建成功' })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// =============================================
// ===== 系统设置 =====
// =============================================
app.get('/api/v1/settings/:key', async (c) => {
  try {
    const key = c.req.param('key')
    const result = await c.env.DB.prepare(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?'
    ).bind(key).first()
    return c.json({ success: true, data: result || { setting_value: null } })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.get('/api/v1/settings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT setting_key, setting_value, updated_at FROM system_settings'
    ).all()
    return c.json({ success: true, data: results })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/v1/settings', async (c) => {
  try {
    const { key, value } = await c.req.json()
    if (!key) {
      return c.json({ error: '缺少设置键' }, 400)
    }
    await c.env.DB.prepare(
      'INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, datetime("now")) ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?, updated_at = datetime("now")'
    ).bind(key, value, value).run()
    return c.json({ success: true, message: '设置更新成功' })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// =============================================
// ===== Dashboard =====
// =============================================
app.get('/api/v1/dashboard', async (c) => {
  try {
    const tenantsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM tenants').first()
    const filingsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM filings').first()
    const transactionsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM transactions').first()
    const recentActivities = await c.env.DB.prepare(
      'SELECT "交易" as type, order_id as id, created_at FROM transactions ORDER BY created_at DESC LIMIT 5'
    ).all()

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
    })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// =============================================
// ===== Reports =====
// =============================================
app.get('/api/v1/reports', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM filings ORDER BY created_at DESC LIMIT 10'
    ).all()
    return c.json({ success: true, data: results, total: results.length })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// =============================================
// ===== 税务接口 =====
// =============================================
app.post('/api/v1/tax/validate', async (c) => {
  try {
    const { importData, salesData } = await c.req.json()
    const TaxValidator = require('./modules/fileProcessor/taxValidator')
    const validator = new TaxValidator()
    const result = validator.validate(importData, salesData)
    return c.json({ success: true, data: result })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/v1/tax/summary', async (c) => {
  try {
    const { importData, salesData } = await c.req.json()
    const TaxValidator = require('./modules/fileProcessor/taxValidator')
    const validator = new TaxValidator()
    const summary = validator._generateSummary(importData, salesData)
    return c.json({ success: true, data: summary })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/v1/tax/c79/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']
    // 处理 C79 文件解析
    const C79Parser = require('./modules/fileProcessor/parsers/c79')
    const parser = new C79Parser()
    // 假设 file 是文本内容
    const result = parser.parse(file)
    return c.json({ success: true, data: result })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/v1/tax/c88/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']
    const C88Parser = require('./modules/fileProcessor/parsers/c88')
    const parser = new C88Parser()
    const result = parser.parse(file)
    return c.json({ success: true, data: result })
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