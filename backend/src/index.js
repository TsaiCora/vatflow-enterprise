// backend/src/index.js
require('dotenv').config();

const { startServer } = require('./server');

const fs = require('fs');
const path = require('path');

// 确保日志目录存在
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`📁 创建日志目录: ${logDir}`);
}

// 确保数据目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁 创建数据目录: ${dataDir}`);
}

// 确保租户数据目录存在
const tenantsDir = path.join(dataDir, 'tenants');
if (!fs.existsSync(tenantsDir)) {
    fs.mkdirSync(tenantsDir, { recursive: true });
    console.log(`📁 创建租户数据目录: ${tenantsDir}`);
}

// 设置环境变量禁用 Redis
process.env.WORKER_ENABLED = 'false';

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║   📦 VATFlow 批量申报系统 v3.0                           ║');
console.log('║                                                           ║');
console.log('║   正在启动服务...                                        ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

try {
    startServer();
} catch (error) {
    console.error('❌ 应用启动失败:', error);
    process.exit(1);
}