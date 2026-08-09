// backend/src/models/AuditLog.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 审计日志模型
 * 记录所有API请求和系统操作
 */
const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    tenantId: {
        type: DataTypes.STRING(50),
        field: 'tenant_id',
        allowNull: true
    },
    userEmail: {
        type: DataTypes.STRING(100),
        field: 'user_email',
        allowNull: true
    },
    action: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    resource: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    resourceId: {
        type: DataTypes.STRING(100),
        field: 'resource_id',
        allowNull: true
    },
    details: {
        type: DataTypes.JSON,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        field: 'ip_address',
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        field: 'user_agent',
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('success', 'failed'),
        defaultValue: 'success'
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['action'] },
        { fields: ['created_at'] },
        { fields: ['resource', 'resource_id'] }
    ]
});

// 关联关系
AuditLog.associate = function(models) {
    AuditLog.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
    });
};

// 静态方法：记录操作
AuditLog.log = async function(data) {
    return await AuditLog.create({
        tenantId: data.tenantId,
        userEmail: data.userEmail,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: data.status || 'success'
    });
};

// 静态方法：获取最近操作
AuditLog.getRecent = async function(tenantId, limit = 10) {
    const where = {};
    if (tenantId) {
        where.tenantId = tenantId;
    }
    return await AuditLog.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit
    });
};

module.exports = AuditLog;