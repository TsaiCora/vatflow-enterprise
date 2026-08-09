// backend/src/config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

/**
 * 数据库配置
 */
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vatflow',
    dialect: 'mysql',
    dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    },
    pool: {
        max: parseInt(process.env.DB_POOL_SIZE) || 10,
        min: 2,
        acquire: 30000,
        idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' 
        ? (msg) => console.log(msg) 
        : false,
    timezone: '+08:00',
    define: {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true
    }
};

/**
 * 创建 Sequelize 实例
 */
const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
);

/**
 * 测试数据库连接
 */
async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');
        return sequelize;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        throw error;
    }
}

/**
 * 关闭数据库连接
 */
async function closeDatabase() {
    try {
        await sequelize.close();
        console.log('✅ 数据库连接已关闭');
    } catch (error) {
        console.error('❌ 关闭数据库连接失败:', error.message);
    }
}

module.exports = {
    sequelize,
    config,
    initDatabase,
    closeDatabase,
    Sequelize
};