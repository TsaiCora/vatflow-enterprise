// backend/src/models/Filing.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 申报模型
 * 存储VAT申报记录
 */
const Filing = sequelize.define('Filing', {
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
    period: {
        type: DataTypes.STRING(7),
        allowNull: false,
        validate: {
            is: /^\d{4}-\d{2}$/
        }
    },
    country: {
        type: DataTypes.CHAR(2),
        allowNull: true
    },
    totalNet: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'total_net',
        defaultValue: 0
    },
    totalVat: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'total_vat',
        defaultValue: 0
    },
    totalGross: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'total_gross',
        defaultValue: 0
    },
    transactionCount: {
        type: DataTypes.INTEGER,
        field: 'transaction_count',
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('draft', 'processing', 'submitted', 'filed', 'error'),
        defaultValue: 'draft'
    },
    submissionId: {
        type: DataTypes.STRING(100),
        field: 'submission_id'
    },
    filedAt: {
        type: DataTypes.DATE,
        field: 'filed_at'
    },
    reportData: {
        type: DataTypes.JSON,
        field: 'report_data'
    }
}, {
    tableName: 'filings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['tenant_id', 'period'] },
        { fields: ['status'] }
    ],
    uniqueKeys: {
        uk_tenant_period_country: {
            fields: ['tenant_id', 'period', 'country']
        }
    }
});

// 关联关系
Filing.associate = function(models) {
    Filing.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
    });
};

// 实例方法：计算汇总
Filing.prototype.calculateSummary = function() {
    this.totalNet = this.totalNet || 0;
    this.totalVat = this.totalVat || 0;
    this.totalGross = this.totalNet + this.totalVat;
    return this;
};

// 实例方法：提交申报
Filing.prototype.submit = function() {
    if (this.status === 'filed') {
        throw new Error('申报已提交，不能重复提交');
    }
    this.status = 'submitted';
    this.submissionId = `SUB-${Date.now()}-${this.id}`;
    return this;
};

// 实例方法：完成申报
Filing.prototype.complete = function() {
    this.status = 'filed';
    this.filedAt = new Date();
    return this;
};

// 实例方法：标记错误
Filing.prototype.markError = function(error) {
    this.status = 'error';
    if (this.reportData) {
        this.reportData.error = error;
    } else {
        this.reportData = { error };
    }
    return this;
};

module.exports = Filing;