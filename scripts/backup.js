// scripts/backup.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const archiver = require('archiver');
const nodemailer = require('nodemailer');
require('dotenv').config();

// 配置
const CONFIG = {
    backupDir: process.env.BACKUP_DIR || './backups',
    dataDir: process.env.DATA_DIR || './data',
    logsDir: process.env.LOGS_DIR || './logs',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    compress: true,
    emailOnSuccess: process.env.EMAIL_ON_BACKUP === 'true',
    emailOnFailure: true,
    maxBackupSize: 500 * 1024 * 1024 // 500MB
};

/**
 * 确保目录存在
 */
function ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * 格式化日期
 */
function getDateStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getTimestampStr() {
    const now = new Date();
    return `${getDateStr()}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

/**
 * 获取文件大小
 */
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch {
        return 0;
    }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * 备份数据库
 */
async function backupDatabase() {
    console.log('💾 开始备份数据库...');
    
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root123',
        database: process.env.DB_NAME || 'vatflow'
    };

    const timestamp = getTimestampStr();
    const backupFile = path.join(CONFIG.backupDir, `database_${timestamp}.sql`);

    try {
        // 使用 mysqldump 导出
        const dumpCmd = `mysqldump --host=${config.host} --port=${config.port} --user=${config.user} --password=${config.password} --databases ${config.database} --single-transaction --routines --triggers --events --add-drop-database > "${backupFile}"`;
        
        await new Promise((resolve, reject) => {
            exec(dumpCmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        const size = getFileSize(backupFile);
        console.log(`   ✅ 数据库备份完成: ${backupFile} (${formatFileSize(size)})`);
        
        return backupFile;

    } catch (error) {
        console.error('   ❌ 数据库备份失败:', error.message);
        throw error;
    }
}

/**
 * 备份文件数据
 */
async function backupFiles() {
    console.log('📁 开始备份文件数据...');

    const timestamp = getTimestampStr();
    const backupFile = path.join(CONFIG.backupDir, `files_${timestamp}.tar.gz`);
    
    try {
        // 检查数据目录是否存在
        if (!fs.existsSync(CONFIG.dataDir)) {
            console.log('   ⚠️ 数据目录不存在，跳过');
            return null;
        }

        // 创建压缩文件
        const output = fs.createWriteStream(backupFile);
        const archive = archiver('tar', {
            gzip: true,
            gzipOptions: { level: 9 }
        });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                const size = getFileSize(backupFile);
                console.log(`   ✅ 文件备份完成: ${backupFile} (${formatFileSize(size)})`);
                resolve(backupFile);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(CONFIG.dataDir, 'data');
            archive.finalize();
        });

    } catch (error) {
        console.error('   ❌ 文件备份失败:', error.message);
        return null;
    }
}

/**
 * 备份日志文件
 */
async function backupLogs() {
    console.log('📝 开始备份日志...');

    const timestamp = getTimestampStr();
    const backupFile = path.join(CONFIG.backupDir, `logs_${timestamp}.tar.gz`);

    try {
        if (!fs.existsSync(CONFIG.logsDir)) {
            console.log('   ⚠️ 日志目录不存在，跳过');
            return null;
        }

        const output = fs.createWriteStream(backupFile);
        const archive = archiver('tar', {
            gzip: true,
            gzipOptions: { level: 9 }
        });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                const size = getFileSize(backupFile);
                console.log(`   ✅ 日志备份完成: ${backupFile} (${formatFileSize(size)})`);
                resolve(backupFile);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(CONFIG.logsDir, 'logs');
            archive.finalize();
        });

    } catch (error) {
        console.error('   ❌ 日志备份失败:', error.message);
        return null;
    }
}

/**
 * 清理旧备份
 */
function cleanOldBackups() {
    console.log('🧹 清理旧备份...');
    
    const files = fs.readdirSync(CONFIG.backupDir);
    const now = Date.now();
    const retentionMs = CONFIG.retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
        const filePath = path.join(CONFIG.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > retentionMs) {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(`   🗑️ 删除旧备份: ${file}`);
        }
    }

    if (deletedCount > 0) {
        console.log(`   ✅ 清理了 ${deletedCount} 个旧备份文件`);
    } else {
        console.log('   ✅ 没有需要清理的旧备份');
    }
}

/**
 * 创建备份摘要
 */
function createBackupSummary(files) {
    const summary = {
        timestamp: new Date().toISOString(),
        files: files.filter(f => f !== null),
        totalSize: 0,
        database: files[0] ? getFileSize(files[0]) : 0,
        files_backup: files[1] ? getFileSize(files[1]) : 0,
        logs: files[2] ? getFileSize(files[2]) : 0
    };
    summary.totalSize = summary.database + summary.files_backup + summary.logs;
    
    return summary;
}

/**
 * 发送邮件通知
 */
async function sendEmail(summary, success, error = null) {
    if (!CONFIG.emailOnSuccess && success) return;
    if (!CONFIG.emailOnFailure && !success) return;

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const subject = success 
            ? '✅ 数据库备份成功' 
            : '❌ 数据库备份失败';

        const html = `
            <h2>${subject}</h2>
            <p>备份时间: ${summary.timestamp}</p>
            ${success ? `
                <h3>📊 备份摘要</h3>
                <ul>
                    <li>数据库备份: ${formatFileSize(summary.database)}</li>
                    <li>文件备份: ${formatFileSize(summary.files_backup)}</li>
                    <li>日志备份: ${formatFileSize(summary.logs)}</li>
                    <li>总计: ${formatFileSize(summary.totalSize)}</li>
                    <li>备份文件数: ${summary.files.length}</li>
                </ul>
            ` : `
                <p style="color: red;">错误信息: ${error}</p>
            `}
            <p><small>此邮件由 VATFlow 备份系统自动发送</small></p>
        `;

        await transporter.sendMail({
            from: `"VATFlow 备份" <${process.env.SMTP_USER}>`,
            to: process.env.NOTIFY_EMAIL || process.env.SMTP_USER,
            subject,
            html
        });

        console.log(`   ✅ 邮件通知已发送`);

    } catch (error) {
        console.error('   ❌ 邮件发送失败:', error.message);
    }
}

/**
 * 执行完整备份
 */
async function performBackup() {
    console.log('\n🔄 开始执行备份...\n');
    const startTime = Date.now();

    // 确保备份目录存在
    ensureDirectory(CONFIG.backupDir);

    let success = true;
    let error = null;
    const backupFiles = [];

    try {
        // 1. 备份数据库
        const dbBackup = await backupDatabase();
        backupFiles.push(dbBackup);

        // 2. 备份文件
        const fileBackup = await backupFiles();
        backupFiles.push(fileBackup);

        // 3. 备份日志
        const logBackup = await backupLogs();
        backupFiles.push(logBackup);

        // 4. 清理旧备份
        cleanOldBackups();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ 备份完成! 耗时: ${duration} 秒`);

        // 5. 创建摘要
        const summary = createBackupSummary(backupFiles);
        summary.duration = duration;

        // 6. 保存摘要
        const summaryPath = path.join(CONFIG.backupDir, `summary_${getTimestampStr()}.json`);
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

        // 7. 发送邮件
        await sendEmail(summary, true);

        return { success: true, summary, files: backupFiles };

    } catch (err) {
        success = false;
        error = err.message;
        console.error('\n❌ 备份失败:', error);
        
        // 发送失败邮件
        await sendEmail({ timestamp: new Date().toISOString() }, false, error);
        
        return { success: false, error };
    }
}

// 命令行参数解析
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        clean: false,
        count: 20
    };

    for (const arg of args) {
        if (arg === '--clean') options.clean = true;
        if (arg.startsWith('--count=')) {
            options.count = parseInt(arg.split('=')[1]) || 20;
        }
    }

    return options;
}

// 如果直接运行此脚本
if (require.main === module) {
    const options = parseArgs();
    
    // 检查依赖
    try {
        require.resolve('archiver');
    } catch (e) {
        console.log('📦 正在安装依赖 archiver...');
        exec('npm install archiver --save-dev', (error) => {
            if (error) {
                console.error('❌ 安装失败:', error);
                process.exit(1);
            }
            performBackup();
        });
        return;
    }

    performBackup();
}

module.exports = { 
    performBackup, 
    backupDatabase, 
    backupFiles, 
    backupLogs, 
    cleanOldBackups 
};