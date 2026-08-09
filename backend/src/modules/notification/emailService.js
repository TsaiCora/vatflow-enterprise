// backend/src/modules/notification/emailService.js
const nodemailer = require('nodemailer');
const { logger } = require('../../utils/logger');
const { email } = require('../../config');

/**
 * 邮件服务类
 * 支持：普通邮件、模板邮件、附件、批量发送
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.defaultFrom = email.from || 'VATFlow系统 <noreply@vatflow.com>';
        this.isConfigured = false;
        this.init();
    }

    /**
     * 初始化邮件服务
     */
    init() {
        try {
            if (!email.enabled) {
                logger.info('📧 邮件服务已禁用');
                return;
            }

            if (!email.user || !email.pass) {
                logger.warn('📧 邮件服务未配置 (缺少用户名或密码)');
                return;
            }

            this.transporter = nodemailer.createTransport({
                host: email.host || 'smtp.gmail.com',
                port: email.port || 587,
                secure: email.secure || false,
                auth: {
                    user: email.user,
                    pass: email.pass
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            this.isConfigured = true;
            logger.info('📧 邮件服务初始化成功');
        } catch (error) {
            logger.error('📧 邮件服务初始化失败:', error.message);
            this.isConfigured = false;
        }
    }

    /**
     * 发送邮件
     */
    async send(options) {
        if (!this.isConfigured || !this.transporter) {
            logger.warn('📧 邮件服务未配置，跳过发送');
            return { success: false, error: '邮件服务未配置' };
        }

        try {
            const mailOptions = {
                from: options.from || this.defaultFrom,
                to: this.normalizeRecipients(options.to),
                cc: this.normalizeRecipients(options.cc),
                bcc: this.normalizeRecipients(options.bcc),
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments || [],
                headers: options.headers || {}
            };

            // 验证收件人
            if (!mailOptions.to && !mailOptions.cc && !mailOptions.bcc) {
                throw new Error('至少需要一个收件人');
            }

            const info = await this.transporter.sendMail(mailOptions);

            logger.info(`📧 邮件发送成功: ${mailOptions.to}`, {
                messageId: info.messageId,
                subject: mailOptions.subject
            });

            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };

        } catch (error) {
            logger.error('📧 邮件发送失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发送模板邮件
     */
    async sendTemplate(to, templateName, data, options = {}) {
        const templates = this.getTemplates();
        const template = templates[templateName];

        if (!template) {
            throw new Error(`模板不存在: ${templateName}`);
        }

        // 渲染模板
        let html = template.html;
        let text = template.text;

        // 简单模板变量替换
        for (const [key, value] of Object.entries(data)) {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
            text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        return this.send({
            to,
            subject: template.subject ? this.renderTemplate(template.subject, data) : options.subject,
            html,
            text,
            ...options
        });
    }

    /**
     * 获取邮件模板
     */
    getTemplates() {
        return {
            // 欢迎邮件
            welcome: {
                subject: '欢迎加入 VATFlow',
                html: `
                    <h2>欢迎加入 VATFlow！</h2>
                    <p>您好 {{name}}，</p>
                    <p>感谢您注册 VATFlow 批量申报系统。</p>
                    <p>您可以使用以下信息登录系统：</p>
                    <ul>
                        <li><strong>邮箱：</strong>{{email}}</li>
                        <li><strong>密码：</strong>您设置的密码</li>
                    </ul>
                    <p>如有任何问题，请随时联系我们。</p>
                    <br>
                    <p>VATFlow 团队</p>
                `,
                text: `
                    欢迎加入 VATFlow！
                    
                    您好 {{name}}，
                    
                    感谢您注册 VATFlow 批量申报系统。
                    
                    您可以使用以下信息登录系统：
                    邮箱：{{email}}
                    密码：您设置的密码
                    
                    如有任何问题，请随时联系我们。
                    
                    VATFlow 团队
                `
            },

            // 文件处理完成
            fileProcessed: {
                subject: '文件处理完成 - {{filename}}',
                html: `
                    <h2>文件处理完成</h2>
                    <p>您好 {{name}}，</p>
                    <p>您的文件 <strong>{{filename}}</strong> 已处理完成。</p>
                    <h3>处理结果：</h3>
                    <ul>
                        <li>平台：{{platform}}</li>
                        <li>交易记录：{{transactionCount}} 条</li>
                        <li>涉及国家：{{countries}}</li>
                        <li>VAT总额：€{{totalVAT}}</li>
                    </ul>
                    <p>请登录系统查看详细报告。</p>
                    <br>
                    <p>VATFlow 团队</p>
                `,
                text: `
                    文件处理完成
                    
                    您好 {{name}}，
                    
                    您的文件 {{filename}} 已处理完成。
                    
                    处理结果：
                    平台：{{platform}}
                    交易记录：{{transactionCount}} 条
                    涉及国家：{{countries}}
                    VAT总额：€{{totalVAT}}
                    
                    请登录系统查看详细报告。
                    
                    VATFlow 团队
                `
            },

            // 处理失败
            processingFailed: {
                subject: '文件处理失败 - {{filename}}',
                html: `
                    <h2>文件处理失败</h2>
                    <p>您好 {{name}}，</p>
                    <p>您的文件 <strong>{{filename}}</strong> 处理失败。</p>
                    <h3>错误信息：</h3>
                    <p style="color: red;">{{error}}</p>
                    <p>请检查文件格式后重新上传。</p>
                    <br>
                    <p>VATFlow 团队</p>
                `,
                text: `
                    文件处理失败
                    
                    您好 {{name}}，
                    
                    您的文件 {{filename}} 处理失败。
                    
                    错误信息：{{error}}
                    
                    请检查文件格式后重新上传。
                    
                    VATFlow 团队
                `
            },

            // 报告生成完成
            reportReady: {
                subject: 'VAT申报报告已生成 - {{period}}',
                html: `
                    <h2>VAT申报报告已生成</h2>
                    <p>您好 {{name}}，</p>
                    <p>您的 VAT 申报报告已生成完成。</p>
                    <h3>报告信息：</h3>
                    <ul>
                        <li>申报期间：{{period}}</li>
                        <li>国家：{{country}}</li>
                        <li>总交易数：{{transactionCount}}</li>
                        <li>VAT总额：€{{totalVAT}}</li>
                    </ul>
                    <p>请登录系统下载完整报告。</p>
                    <br>
                    <p>VATFlow 团队</p>
                `,
                text: `
                    VAT申报报告已生成
                    
                    您好 {{name}}，
                    
                    您的 VAT 申报报告已生成完成。
                    
                    报告信息：
                    申报期间：{{period}}
                    国家：{{country}}
                    总交易数：{{transactionCount}}
                    VAT总额：€{{totalVAT}}
                    
                    请登录系统下载完整报告。
                    
                    VATFlow 团队
                `
            },

            // 密码重置
            passwordReset: {
                subject: '密码重置请求',
                html: `
                    <h2>密码重置请求</h2>
                    <p>您好 {{name}}，</p>
                    <p>我们收到了您的密码重置请求。</p>
                    <p>请点击以下链接重置您的密码：</p>
                    <p><a href="{{resetLink}}">{{resetLink}}</a></p>
                    <p>此链接有效期为 {{expiresIn}} 分钟。</p>
                    <p>如果您没有请求重置密码，请忽略此邮件。</p>
                    <br>
                    <p>VATFlow 团队</p>
                `,
                text: `
                    密码重置请求
                    
                    您好 {{name}}，
                    
                    我们收到了您的密码重置请求。
                    
                    请访问以下链接重置您的密码：
                    {{resetLink}}
                    
                    此链接有效期为 {{expiresIn}} 分钟。
                    
                    如果您没有请求重置密码，请忽略此邮件。
                    
                    VATFlow 团队
                `
            },

            // 系统通知
            systemNotification: {
                subject: '系统通知 - {{title}}',
                html: `
                    <h2>{{title}}</h2>
                    <p>您好 {{name}}，</p>
                    <p>{{message}}</p>
                    {{#if actionUrl}}
                    <p><a href="{{actionUrl}}">{{actionText}}</a></p>
                    {{/if}}
                    <br>
                    <p>VATFlow 团队</p>
                `,
                text: `
                    {{title}}
                    
                    您好 {{name}}，
                    
                    {{message}}
                    
                    {{#if actionUrl}}
                    {{actionText}}: {{actionUrl}}
                    {{/if}}
                    
                    VATFlow 团队
                `
            }
        };
    }

    /**
     * 渲染模板
     */
    renderTemplate(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return result;
    }

    /**
     * 规范化收件人列表
     */
    normalizeRecipients(recipients) {
        if (!recipients) return undefined;
        if (Array.isArray(recipients)) {
            return recipients.filter(Boolean).join(',');
        }
        return recipients;
    }

    /**
     * 发送批量邮件
     */
    async sendBatch(recipients, options) {
        const results = [];

        // 分批发送，每批50个
        const batchSize = 50;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            const emails = batch.map(email => ({ ...options, to: email }));

            const promises = emails.map(async (opts) => {
                try {
                    const result = await this.send(opts);
                    return { email: opts.to, ...result };
                } catch (error) {
                    return { email: opts.to, success: false, error: error.message };
                }
            });

            const batchResults = await Promise.all(promises);
            results.push(...batchResults);

            // 延迟避免速率限制
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const summary = {
            total: results.length,
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        };

        logger.info(`📧 批量邮件发送完成: ${summary.success}/${summary.total}`);
        return { results, summary };
    }

    /**
     * 发送带附件的邮件
     */
    async sendWithAttachment(to, subject, content, attachments, options = {}) {
        const attachmentList = Array.isArray(attachments) ? attachments : [attachments];

        return this.send({
            to,
            subject,
            html: content,
            attachments: attachmentList.map(file => ({
                filename: file.filename || file.name,
                path: file.path,
                content: file.content,
                contentType: file.contentType
            })),
            ...options
        });
    }

    /**
     * 验证邮件配置
     */
    async verifyConnection() {
        if (!this.isConfigured || !this.transporter) {
            return { success: false, error: '邮件服务未配置' };
        }

        try {
            await this.transporter.verify();
            logger.info('📧 邮件服务连接验证成功');
            return { success: true };
        } catch (error) {
            logger.error('📧 邮件服务连接验证失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取邮件服务状态
     */
    getStatus() {
        return {
            configured: this.isConfigured,
            enabled: email.enabled,
            host: email.host,
            port: email.port,
            secure: email.secure,
            from: this.defaultFrom
        };
    }
}

// 导出单例
module.exports = new EmailService();