// backend/src/api/v1/auth.js
const express = require('express');
const router = express.Router();

// 登录接口
router.post('/login', (req, res) => {
    console.log('📥 登录请求收到:', req.body);
    
    const { email, password } = req.body;
    
    // 简单测试登录
    if (email === 'admin@vatflow.com' && password === 'admin123') {
        return res.json({
            success: true,
            data: {
                token: 'test-token-' + Date.now(),
                user: {
                    tenantId: 'admin',
                    name: '系统管理员',
                    email: 'admin@vatflow.com',
                    role: 'admin'
                }
            }
        });
    }
    
    res.status(401).json({
        success: false,
        error: '邮箱或密码错误'
    });
});

// 测试接口
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Auth route is working!' });
});

// 添加一个测试 POST 接口
router.post('/test', (req, res) => {
    res.json({ success: true, message: 'Auth POST test is working!', body: req.body });
});

console.log('✅ Auth routes loaded');

module.exports = router;