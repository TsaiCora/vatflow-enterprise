// backend/src/utils/crypto.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * 加密工具类
 */
class CryptoUtils {
    /**
     * 生成随机字符串
     */
    generateRandomString(length = 32) {
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }

    /**
     * 生成 UUID
     */
    generateUUID() {
        return crypto.randomUUID();
    }

    /**
     * 生成 API Key
     */
    generateApiKey(prefix = 'vat') {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(16).toString('hex');
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * 生成 JWT Secret
     */
    generateJWTSecret() {
        return crypto.randomBytes(64).toString('hex');
    }

    /**
     * SHA256 哈希
     */
    sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * SHA512 哈希
     */
    sha512(data) {
        return crypto.createHash('sha512').update(data).digest('hex');
    }

    /**
     * HMAC-SHA256
     */
    hmacSha256(data, secret) {
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }

    /**
     * HMAC-SHA512
     */
    hmacSha512(data, secret) {
        return crypto.createHmac('sha512', secret).update(data).digest('hex');
    }

    /**
     * 加密数据 (AES-256-GCM)
     */
    encrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    /**
     * 解密数据 (AES-256-GCM)
     */
    decrypt(encryptedText, key) {
        const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * 生成盐值
     */
    generateSalt(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * 密码哈希 (bcrypt)
     */
    async hashPassword(password, rounds = 10) {
        return await bcrypt.hash(password, rounds);
    }

    /**
     * 验证密码 (bcrypt)
     */
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * 生成验证码
     */
    generateVerificationCode(length = 6) {
        const digits = '0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += digits[Math.floor(Math.random() * digits.length)];
        }
        return code;
    }

    /**
     * 生成 OTP (基于时间的一次性密码)
     */
    generateOTP(secret, counter = null) {
        const time = counter || Math.floor(Date.now() / 30000); // 30秒窗口
        const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
        const buffer = Buffer.alloc(8);
        buffer.writeBigInt64BE(BigInt(time));
        hmac.update(buffer);
        const hash = hmac.digest();
        const offset = hash[hash.length - 1] & 0xf;
        const code = ((hash[offset] & 0x7f) << 24 |
                     (hash[offset + 1] & 0xff) << 16 |
                     (hash[offset + 2] & 0xff) << 8 |
                     (hash[offset + 3] & 0xff)) % 1000000;
        return String(code).padStart(6, '0');
    }

    /**
     * 生成签名
     */
    generateSignature(data, secret) {
        const sorted = JSON.stringify(data, Object.keys(data).sort());
        return this.hmacSha256(sorted, secret);
    }

    /**
     * 验证签名
     */
    verifySignature(data, signature, secret) {
        const expected = this.generateSignature(data, secret);
        return crypto.timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(signature)
        );
    }

    /**
     * 生成随机密码
     */
    generatePassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        return password;
    }

    /**
     * 掩码敏感信息
     */
    maskSensitive(data, visible = 4) {
        if (!data) return '';
        const str = String(data);
        if (str.length <= visible) return '*'.repeat(str.length);
        return str.slice(0, visible) + '*'.repeat(str.length - visible);
    }

    /**
     * 掩码邮箱
     */
    maskEmail(email) {
        if (!email) return '';
        const parts = email.split('@');
        if (parts.length !== 2) return this.maskSensitive(email);
        const username = parts[0];
        const domain = parts[1];
        const maskedUsername = username.length <= 3 
            ? '*'.repeat(username.length)
            : username.slice(0, 2) + '*'.repeat(username.length - 2);
        return `${maskedUsername}@${domain}`;
    }

    /**
     * 掩码手机号
     */
    maskPhone(phone) {
        if (!phone) return '';
        const str = String(phone).replace(/\s/g, '');
        if (str.length <= 6) return '*'.repeat(str.length);
        return str.slice(0, 3) + '*'.repeat(str.length - 6) + str.slice(-3);
    }
}

module.exports = new CryptoUtils();