// backend/src/services/notificationService.js
/**
 * 通知服务
 * 支持邮件、短信、推送通知
 */

// =============================================
// ===== 邮件通知服务 =====
// =============================================
class EmailService {
    constructor(env) {
        // 从环境变量读取配置
        this.smtpHost = env.SMTP_HOST || 'smtp.gmail.com';
        this.smtpPort = parseInt(env.SMTP_PORT) || 587;
        this.smtpUser = env.SMTP_USER || '';
        this.smtpPass = env.SMTP_PASS || '';
        this.fromEmail = env.FROM_EMAIL || this.smtpUser;
        this.enabled = !!this.smtpUser && !!this.smtpPass;
    }

    /**
     * 发送邮件
     */
    async sendEmail(to, subject, htmlContent, textContent = '') {
        if (!this.enabled) {
            console.log('📧 邮件服务未配置，跳过发送');
            return { success: false, message: '邮件服务未配置' };
        }

        try {
            // 使用 Cloudflare Email 或第三方服务
            // 这里使用 fetch 调用外部邮件 API
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.smtpPass}`
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: [to],
                    subject: subject,
                    html: htmlContent,
                    text: textContent || htmlContent.replace(/<[^>]+>/g, '')
                })
            });

            const result = await response.json();
            console.log('📧 邮件发送结果:', result);
            return { success: true, data: result };
        } catch (error) {
            console.error('❌ 邮件发送失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 发送通知邮件
     */
    async sendNotificationEmail(to, notificationType, data) {
        const templates = {
            tax_validation: {
                subject: '✅ 税务校验完成通知',
                html: `
                    <h2>税务校验完成</h2>
                    <p>您好，您的税务校验已完成。</p>
                    <p>校验结果: ${data.status || '通过'}</p>
                    <p>VAT金额: €${data.vatAmount || 0}</p>
                    <p>校验时间: ${new Date().toLocaleString()}</p>
                    <p><a href="${data.link || 'https://vatflow.vatapex.com'}">查看详情</a></p>
                `
            },
            report_ready: {
                subject: '📄 申报报告已生成',
                html: `
                    <h2>申报报告已生成</h2>
                    <p>您好，您的申报报告已生成。</p>
                    <p>报告ID: ${data.reportId || ''}</p>
                    <p>期间: ${data.period || ''}</p>
                    <p><a href="${data.link || 'https://vatflow.vatapex.com/reports'}">查看报告</a></p>
                `
            },
            upload_complete: {
                subject: '📤 文件上传完成',
                html: `
                    <h2>文件上传完成</h2>
                    <p>您好，您的文件已成功上传。</p>
                    <p>文件名: ${data.filename || ''}</p>
                    <p>记录数: ${data.recordCount || 0}</p>
                    <p><a href="${data.link || 'https://vatflow.vatapex.com/transactions'}">查看交易</a></p>
                `
            },
            tax_due: {
                subject: '⚠️ VAT申报提醒',
                html: `
                    <h2>VAT申报提醒</h2>
                    <p>您好，您的VAT申报即将到期。</p>
                    <p>到期日期: ${data.dueDate || ''}</p>
                    <p>应缴金额: €${data.amount || 0}</p>
                    <p><a href="${data.link || 'https://vatflow.vatapex.com'}">立即申报</a></p>
                `
            }
        };

        const template = templates[notificationType] || templates.tax_validation;
        const htmlContent = template.html.replace(/\${[^}]+}/g, match => {
            const key = match.slice(2, -1);
            return data[key] || '';
        });

        return this.sendEmail(to, template.subject, htmlContent);
    }
}


// =============================================
// ===== 短信通知服务 =====
// =============================================
class SmsService {
    constructor(env) {
        this.accountSid = env.TWILIO_ACCOUNT_SID || '';
        this.authToken = env.TWILIO_AUTH_TOKEN || '';
        this.fromNumber = env.TWILIO_FROM_NUMBER || '';
        this.enabled = !!this.accountSid && !!this.authToken && !!this.fromNumber;
    }

    /**
     * 发送短信
     */
    async sendSms(to, message) {
        if (!this.enabled) {
            console.log('📱 短信服务未配置，跳过发送');
            return { success: false, message: '短信服务未配置' };
        }

        try {
            // 使用 Twilio API 发送短信
            const auth = btoa(`${this.accountSid}:${this.authToken}`);
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                },
                body: new URLSearchParams({
                    To: to,
                    From: this.fromNumber,
                    Body: message
                })
            });

            const result = await response.json();
            console.log('📱 短信发送结果:', result);
            return { success: true, data: result };
        } catch (error) {
            console.error('❌ 短信发送失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 发送通知短信
     */
    async sendNotificationSms(to, notificationType, data) {
        const messages = {
            tax_validation: `✅ 税务校验完成！VAT金额: €${data.vatAmount || 0}，状态: ${data.status || '通过'}`,
            report_ready: `📄 申报报告已生成！报告ID: ${data.reportId || ''}`,
            upload_complete: `📤 文件上传完成！记录数: ${data.recordCount || 0}`,
            tax_due: `⚠️ VAT申报提醒！到期日期: ${data.dueDate || ''}，金额: €${data.amount || 0}`
        };

        const message = messages[notificationType] || '您有新的VAT通知';
        return this.sendSms(to, message);
    }
}


// =============================================
// ===== 推送通知服务 =====
// =============================================
class PushService {
    constructor(env) {
        this.vapidPublicKey = env.VAPID_PUBLIC_KEY || '';
        this.vapidPrivateKey = env.VAPID_PRIVATE_KEY || '';
        this.enabled = !!this.vapidPublicKey && !!this.vapidPrivateKey;
        this.subscriptions = new Map(); // 存储订阅信息
    }

    /**
     * 注册推送订阅
     */
    registerSubscription(tenantId, subscription) {
        if (!this.subscriptions.has(tenantId)) {
            this.subscriptions.set(tenantId, []);
        }
        this.subscriptions.get(tenantId).push(subscription);
        console.log(`🔔 推送订阅注册成功: ${tenantId}`);
        return { success: true };
    }

    /**
     * 发送推送通知
     */
    async sendPush(tenantId, title, message, data = {}) {
        if (!this.enabled) {
            console.log('🔔 推送服务未配置，跳过发送');
            return { success: false, message: '推送服务未配置' };
        }

        const subscriptions = this.subscriptions.get(tenantId) || [];
        if (subscriptions.length === 0) {
            console.log('🔔 没有订阅用户');
            return { success: false, message: '没有订阅用户' };
        }

        let sent = 0;
        for (const subscription of subscriptions) {
            try {
                const response = await fetch(subscription.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'TTL': '86400' // 24小时
                    },
                    body: JSON.stringify({
                        title,
                        message,
                        data,
                        timestamp: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    sent++;
                } else {
                    // 如果订阅过期，移除它
                    if (response.status === 410 || response.status === 404) {
                        const index = this.subscriptions.get(tenantId).indexOf(subscription);
                        if (index !== -1) {
                            this.subscriptions.get(tenantId).splice(index, 1);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ 推送发送失败:', error);
            }
        }

        return { success: true, sent, total: subscriptions.length };
    }

    /**
     * 发送通知推送
     */
    async sendNotificationPush(tenantId, notificationType, data) {
        const titles = {
            tax_validation: '✅ 税务校验完成',
            report_ready: '📄 报告已生成',
            upload_complete: '📤 上传完成',
            tax_due: '⚠️ 申报提醒'
        };

        const messages = {
            tax_validation: `VAT金额: €${data.vatAmount || 0}`,
            report_ready: `报告ID: ${data.reportId || ''}`,
            upload_complete: `记录数: ${data.recordCount || 0}`,
            tax_due: `到期日期: ${data.dueDate || ''}`
        };

        return this.sendPush(
            tenantId,
            titles[notificationType] || '新通知',
            messages[notificationType] || '您有新的VAT通知',
            data
        );
    }
}


// =============================================
// ===== 通知管理器 =====
// =============================================
class NotificationManager {
    constructor(env) {
        this.emailService = new EmailService(env);
        this.smsService = new SmsService(env);
        this.pushService = new PushService(env);
    }

    /**
     * 获取租户的通知设置
     */
    async getNotificationSettings(env, tenantId) {
        try {
            const result = await env.DB.prepare(
                'SELECT setting_value FROM system_settings WHERE setting_key = ? AND (tenant_id = ? OR tenant_id IS NULL)'
            ).bind('notifications', tenantId).first();

            if (result && result.setting_value) {
                try {
                    return JSON.parse(result.setting_value);
                } catch {
                    return {
                        emailNotifications: false,
                        smsNotifications: false,
                        pushNotifications: false
                    };
                }
            }

            return {
                emailNotifications: false,
                smsNotifications: false,
                pushNotifications: false
            };
        } catch (error) {
            console.error('❌ 获取通知设置失败:', error);
            return {
                emailNotifications: false,
                smsNotifications: false,
                pushNotifications: false
            };
        }
    }

    /**
     * 发送通知（根据设置）
     */
    async sendNotification(env, tenantId, userEmail, userPhone, notificationType, data) {
        const settings = await this.getNotificationSettings(env, tenantId);
        const results = [];

        // 1. 邮件通知
        if (settings.emailNotifications && userEmail) {
            const result = await this.emailService.sendNotificationEmail(userEmail, notificationType, data);
            results.push({ type: 'email', ...result });
        }

        // 2. 短信通知
        if (settings.smsNotifications && userPhone) {
            const result = await this.smsService.sendNotificationSms(userPhone, notificationType, data);
            results.push({ type: 'sms', ...result });
        }

        // 3. 推送通知
        if (settings.pushNotifications) {
            const result = await this.pushService.sendNotificationPush(tenantId, notificationType, data);
            results.push({ type: 'push', ...result });
        }

        return {
            success: true,
            results,
            settings
        };
    }

    /**
     * 发送税务校验完成通知
     */
    async sendTaxValidationNotification(env, tenantId, userEmail, userPhone, data) {
        return this.sendNotification(env, tenantId, userEmail, userPhone, 'tax_validation', {
            vatAmount: data.vatAmount || 0,
            status: data.status || '通过',
            link: 'https://vatflow.vatapex.com/tax-validation'
        });
    }

    /**
     * 发送报告生成通知
     */
    async sendReportReadyNotification(env, tenantId, userEmail, userPhone, data) {
        return this.sendNotification(env, tenantId, userEmail, userPhone, 'report_ready', {
            reportId: data.reportId || '',
            period: data.period || '',
            link: 'https://vatflow.vatapex.com/reports'
        });
    }

    /**
     * 发送上传完成通知
     */
    async sendUploadCompleteNotification(env, tenantId, userEmail, userPhone, data) {
        return this.sendNotification(env, tenantId, userEmail, userPhone, 'upload_complete', {
            filename: data.filename || '',
            recordCount: data.recordCount || 0,
            link: 'https://vatflow.vatapex.com/transactions'
        });
    }

    /**
     * 发送税务到期提醒
     */
    async sendTaxDueNotification(env, tenantId, userEmail, userPhone, data) {
        return this.sendNotification(env, tenantId, userEmail, userPhone, 'tax_due', {
            dueDate: data.dueDate || '',
            amount: data.amount || 0,
            link: 'https://vatflow.vatapex.com'
        });
    }
}

module.exports = NotificationManager;