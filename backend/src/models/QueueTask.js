// backend/src/models/QueueTask.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 队列任务模型
 * 存储后台任务状态
 */
const QueueTask = sequelize.define('QueueTask', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    jobId: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        field: 'job_id'
    },
    tenantId: {
        type: DataTypes.STRING(50),
        field: 'tenant_id',
        allowNull: true
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            isIn: [['file_processing', 'notification', 'report_generation', 'cleanup']]
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    data: {
        type: DataTypes.JSON,
        allowNull: true
    },
    result: {
        type: DataTypes.JSON,
        allowNull: true
    },
    error: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    maxAttempts: {
        type: DataTypes.INTEGER,
        field: 'max_attempts',
        defaultValue: 3
    },
    scheduledAt: {
        type: DataTypes.DATE,
        field: 'scheduled_at',
        allowNull: true
    },
    startedAt: {
        type: DataTypes.DATE,
        field: 'started_at',
        allowNull: true
    },
    completedAt: {
        type: DataTypes.DATE,
        field: 'completed_at',
        allowNull: true
    }
}, {
    tableName: 'queue_tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['status'] },
        { fields: ['tenant_id'] },
        { fields: ['type'] },
        { fields: ['scheduled_at'] }
    ]
});

// 关联关系
QueueTask.associate = function(models) {
    QueueTask.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
    });
};

// 实例方法：开始处理
QueueTask.prototype.start = function() {
    this.status = 'processing';
    this.startedAt = new Date();
    this.attempts += 1;
    return this;
};

// 实例方法：完成处理
QueueTask.prototype.complete = function(result) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.result = result;
    return this;
};

// 实例方法：标记失败
QueueTask.prototype.fail = function(error) {
    this.status = 'failed';
    this.completedAt = new Date();
    this.error = error.message || String(error);
    return this;
};

// 实例方法：重试
QueueTask.prototype.retry = function() {
    if (this.attempts >= this.maxAttempts) {
        throw new Error('超过最大重试次数');
    }
    this.status = 'pending';
    this.error = null;
    this.startedAt = null;
    this.completedAt = null;
    return this;
};

// 实例方法：是否可重试
QueueTask.prototype.isRetryable = function() {
    return this.status === 'failed' && this.attempts < this.maxAttempts;
};

module.exports = QueueTask;