// backend/src/models/Tenant.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 客户模型
 * 存储所有租户/客户信息
 */
const Tenant = sequelize.define('Tenant', {
    tenantId: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
        field: 'tenant_id',
        validate: {
            is: /^[a-zA-Z0-9_]+$/
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
    },
    company: {
        type: DataTypes.STRING(200),
        allowNull: true,
        defaultValue: ''
    },
    vatNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'vat_number'
    },
    country: {
        type: DataTypes.CHAR(2),
        allowNull: false,
        defaultValue: 'GB'
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'deleted', 'pending'),
        defaultValue: 'pending'
    },
    apiKey: {
        type: DataTypes.STRING(100),
        unique: true,
        field: 'api_key'
    },
    settings: {
        type: DataTypes.JSON,
        defaultValue: {
            autoProcess: true,
            emailNotifications: true,
            defaultRate: 20,
            currency: 'EUR'
        },
        get() {
            const raw = this.getDataValue('settings');
            return raw || {
                autoProcess: true,
                emailNotifications: true,
                defaultRate: 20,
                currency: 'EUR'
            };
        }
    },
    taxConfig: {
        type: DataTypes.JSON,
        field: 'tax_config',
        defaultValue: {
            ossEnabled: true,
            mtdEnabled: false,
            viesValidation: true,
            defaultPeriod: 'monthly'
        },
        get() {
            const raw = this.getDataValue('taxConfig');
            return raw || {
                ossEnabled: true,
                mtdEnabled: false,
                viesValidation: true,
                defaultPeriod: 'monthly'
            };
        }
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        field: 'last_login_at',
        allowNull: true
    },
    deletedAt: {
        type: DataTypes.DATE,
        field: 'deleted_at',
        allowNull: true
    }
}, {
    tableName: 'tenants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['status'] },
        { fields: ['country'] },
        { fields: ['created_at'] }
    ]
});

// 关联关系
Tenant.associate = function(models) {
    Tenant.hasMany(models.Transaction, {
        foreignKey: 'tenantId',
        as: 'transactions'
    });
    Tenant.hasMany(models.Filing, {
        foreignKey: 'tenantId',
        as: 'filings'
    });
    Tenant.hasMany(models.AuditLog, {
        foreignKey: 'tenantId',
        as: 'auditLogs'
    });
    Tenant.hasMany(models.Webhook, {
        foreignKey: 'tenantId',
        as: 'webhooks'
    });
};

module.exports = Tenant;