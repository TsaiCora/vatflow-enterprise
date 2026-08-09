// backend/src/models/index.js
const Tenant = require('./Tenant');
const Transaction = require('./Transaction');
const Filing = require('./Filing');
const AuditLog = require('./AuditLog');
const QueueTask = require('./QueueTask');
const Webhook = require('./Webhook');

// 定义关联关系
function associate() {
    Tenant.associate({
        Transaction,
        Filing,
        AuditLog,
        Webhook
    });
    Transaction.associate({ Tenant });
    Filing.associate({ Tenant });
    AuditLog.associate({ Tenant });
    QueueTask.associate({ Tenant });
    Webhook.associate({ Tenant });
}

// 执行关联
associate();

module.exports = {
    sequelize: require('../config/database').sequelize,
    Sequelize: require('sequelize'),
    Tenant,
    Transaction,
    Filing,
    AuditLog,
    QueueTask,
    Webhook
};