// backend/src/models/Webhook.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Webhook 模型
 * 存储Webhook配置
 */
const Webhook = sequelize.define('Webhook', {
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
    url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    secret: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    events: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastTriggeredAt: {
        type: DataTypes.DATE,
        field: 'last_triggered_at',
        allowNull: true
    },
    lastStatus: {
        type: DataTypes.INTEGER,
        field: 'last_status',
        allowNull: true
    }
}, {
    tableName: 'webhooks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['tenant_id', 'active'] }
    ]
});

// 关联关系
Webhook.associate = function(models) {
    Webhook.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
    });
};

// 实例方法：触发Webhook
Webhook.prototype.trigger = async function(payload) {
    const axios = require('axios');
    const crypto = require('crypto');

    this.lastTriggeredAt = new Date();

    try {
        const headers = {
            'Content-Type': 'application/json',
            'X-Webhook-Id': this.id,
            'X-Webhook-Event': payload.event || 'unknown'
        };

        // 如果配置了密钥，添加签名
        if (this.secret) {
            const signature = crypto
                .createHmac('sha256', this.secret)
                .update(JSON.stringify(payload))
                .digest('hex');
            headers['X-Webhook-Signature'] = signature;
        }

        const response = await axios.post(this.url, payload, {
            headers,
            timeout: 30000
        });

        this.lastStatus = response.status;

        // 更新激活状态（如果多次失败则停用）
        return {
            success: true,
            status: response.status,
            data: response.data
        };

    } catch (error) {
        this.lastStatus = error.response?.status || 500;
        
        return {
            success: false,
            error: error.message,
            status: this.lastStatus
        };
    }
};

// 实例方法：检查是否应触发
Webhook.prototype.shouldTrigger = function(event) {
    if (!this.active) return false;
    if (this.events && this.events.length > 0) {
        return this.events.includes(event) || this.events.includes('*');
    }
    return true;
};

// 静态方法：获取应触发的Webhook
Webhook.getActiveForEvent = async function(tenantId, event) {
    const webhooks = await Webhook.findAll({
        where: {
            tenantId,
            active: true
        }
    });

    return webhooks.filter(w => w.shouldTrigger(event));
};

module.exports = Webhook;