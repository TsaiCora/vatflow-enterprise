// backend/src/modules/fileProcessor/certificates/index.js
/**
 * 证书处理模块
 * C79/C88/PVA 等税务证书处理
 */

const certificates = {
    c79: require('./c79'),
    c88: require('./c88'),
    pva: require('./pva'),  // ← 新增 PVA
};

/**
 * 获取证书处理器
 */
const getCertificateHandler = (type) => {
    const key = type.toLowerCase();
    return certificates[key] || null;
};

module.exports = {
    ...certificates,
    certificates,
    getCertificateHandler
};