// frontend/src/modules/fileProcessor/certificates/index.js
/**
 * 证书处理 - 前端
 * C79/C88 等税务证书处理
 */

const certificates = {
    c79: require('./c79'),
    c88: require('./c88'),
};

/**
 * 获取证书处理器
 */
export const getCertificateHandler = (type) => {
    const key = type.toLowerCase();
    return certificates[key] || null;
};

export default certificates;