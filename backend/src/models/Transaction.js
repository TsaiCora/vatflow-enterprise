// backend/src/models/Transaction.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 交易模型
 * 存储所有VAT交易记录
 */
const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    tenantId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'tenant_id'
    },
    orderId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'order_id'
    },
    orderDate: {
        type: DataTypes.DATEONLY,
        field: 'order_date'
    },
    country: {
        type: DataTypes.CHAR(2),
        allowNull: true
    },
    vatNumber: {
        type: DataTypes.STRING(50),
        field: 'vat_number'
    },
    netAmount: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'net_amount',
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    vatAmount: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'vat_amount',
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    grossAmount: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'gross_amount',
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'tax_rate',
        defaultValue: 0
    },
    customerEmail: {
        type: DataTypes.STRING(100),
        field: 'customer_email'
    },
    customerName: {
        type: DataTypes.STRING(100),
        field: 'customer_name'
    },
    productSku: {
        type: DataTypes.STRING(100),
        field: 'product_sku'
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    period: {
        type: DataTypes.STRING(7),
        allowNull: true
    },
    platform: {
        type: DataTypes.STRING(50)
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    rawData: {
        type: DataTypes.JSON,
        field: 'raw_data'
    }
}, {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
        { fields: ['tenant_id', 'order_id'] },
        { fields: ['tenant_id', 'period'] },
        { fields: ['country'] },
        { fields: ['platform'] },
        { fields: ['status'] },
        { fields: ['order_date'] }
    ]
});

// 关联关系
Transaction.associate = function(models) {
    Transaction.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
    });
};

// 实例方法：计算毛利润
Transaction.prototype.calculateGross = function() {
    this.grossAmount = (this.netAmount || 0) + (this.vatAmount || 0);
    return this.grossAmount;
};

// 实例方法：验证交易数据
Transaction.prototype.validate = function() {
    if (this.netAmount < 0) {
        throw new Error('净销售额不能为负数');
    }
    if (this.vatAmount < 0) {
        throw new Error('VAT税额不能为负数');
    }
    if (this.taxRate < 0 || this.taxRate > 1) {
        throw new Error('税率必须在0到1之间');
    }
    return true;
};

module.exports = Transaction;