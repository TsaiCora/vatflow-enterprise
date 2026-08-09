// backend/src/server.js
const app = require('./app');

const PORT = process.env.APP_PORT || 3000;

function startServer() {
    try {
        console.log('🚀 启动 VATFlow 后端服务...');
        console.log(`📌 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📌 端口: ${PORT}`);

        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
            console.log(`✅ 健康检查: http://localhost:${PORT}/health`);
            console.log(`✅ 外网可通过 Tunnel 访问`);
        });

        // =============================================
        // 增加超时时间（支持大文件上传）
        // =============================================
        server.timeout = 600000; // 10 分钟
        server.keepAliveTimeout = 600000;
        server.headersTimeout = 600000;

        return server;
    } catch (error) {
        console.error('❌ 启动失败:', error.message);
        process.exit(1);
    }
}

module.exports = { startServer };