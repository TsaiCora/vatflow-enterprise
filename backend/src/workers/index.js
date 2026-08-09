// backend/src/workers/index.js
const fileProcessor = require('./fileProcessor');
const notificationWorker = require('./notificationWorker');
const cleanupWorker = require('./cleanupWorker');

/**
 * 启动所有 Workers
 */
async function startAllWorkers() {
    await fileProcessor.start();
    await notificationWorker.start();
    await cleanupWorker.start();
    console.log('✅ 所有 Workers 已启动');
}

/**
 * 停止所有 Workers
 */
async function stopAllWorkers() {
    await fileProcessor.stop();
    await notificationWorker.stop();
    await cleanupWorker.stop();
    console.log('✅ 所有 Workers 已停止');
}

/**
 * 获取所有 Workers 状态
 */
function getWorkersStatus() {
    return {
        fileProcessor: fileProcessor.getStatus(),
        notification: notificationWorker.getStatus(),
        cleanup: cleanupWorker.getStatus()
    };
}

module.exports = {
    fileProcessor,
    notificationWorker,
    cleanupWorker,
    startAllWorkers,
    stopAllWorkers,
    getWorkersStatus
};