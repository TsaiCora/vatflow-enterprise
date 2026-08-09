// frontend/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Divider,
    MenuItem,
    Snackbar,
    Alert,
    LinearProgress,
    Tabs,
    Tab,
    InputAdornment,
    IconButton,
    CircularProgress,
    Chip,
    Tooltip,
    Card,
    CardContent
} from '@mui/material';
import {
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Security as SecurityIcon,
    Notifications as NotificationsIcon,
    Payment as PaymentIcon,
    Business as BusinessIcon,
    Settings as SettingsIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Email as EmailIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    CloudUpload as CloudUploadIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';

function Settings() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [testEmail, setTestEmail] = useState('');
    const [testingEmail, setTestingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null);
    
    const [settings, setSettings] = useState({
        companyName: 'VATFlow',
        companyEmail: 'admin@vatapex.com',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        defaultRate: 20,
        currency: 'EUR',
        ossEnabled: true,
        mtdEnabled: false,
        viesValidation: true,
        defaultPeriod: 'monthly',
        emailNotifications: true,
        notifyOnSuccess: true,
        notifyOnError: true,
        weeklyReport: true,
        monthlyReport: true,
        twoFactorAuth: false,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        ipWhitelist: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    // =============================================
    // 加载设置
    // =============================================
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/settings');
            const result = await response.json();
            if (result.success) {
                setSettings(result.data);
                if (result.data.companyEmail) {
                    setTestEmail(result.data.companyEmail);
                }
                setEmailStatus('loaded');
            }
        } catch (error) {
            console.error('❌ 加载设置失败:', error);
            setSnackbar({
                open: true,
                message: '加载设置失败，请刷新重试',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // =============================================
    // 保存设置
    // =============================================
    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/v1/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const result = await response.json();
            if (result.success) {
                setSnackbar({
                    open: true,
                    message: '✅ 设置已保存成功',
                    severity: 'success'
                });
            } else {
                setSnackbar({
                    open: true,
                    message: result.error || '保存失败',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('❌ 保存设置失败:', error);
            setSnackbar({
                open: true,
                message: '网络错误，请检查后端',
                severity: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    // =============================================
    // 发送测试邮件
    // =============================================
    const sendTestEmail = async () => {
        if (!testEmail) {
            setSnackbar({
                open: true,
                message: '请输入测试邮箱地址',
                severity: 'warning'
            });
            return;
        }

        setTestingEmail(true);
        setEmailStatus('sending');
        try {
            const response = await fetch('/api/v1/notifications/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail })
            });
            const result = await response.json();
            if (result.success) {
                setEmailStatus('success');
                setSnackbar({
                    open: true,
                    message: '✅ 测试邮件已发送到 ' + testEmail,
                    severity: 'success'
                });
            } else {
                setEmailStatus('error');
                setSnackbar({
                    open: true,
                    message: result.error || '邮件发送失败',
                    severity: 'error'
                });
            }
        } catch (error) {
            setEmailStatus('error');
            setSnackbar({
                open: true,
                message: '网络错误，请检查后端',
                severity: 'error'
            });
        } finally {
            setTestingEmail(false);
        }
    };

    // =============================================
    // 更新密码
    // =============================================
    const handleUpdatePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setSnackbar({
                open: true,
                message: '两次输入的密码不一致',
                severity: 'error'
            });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setSnackbar({
                open: true,
                message: '新密码至少6位',
                severity: 'error'
            });
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/v1/auth/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            const result = await response.json();
            if (result.success) {
                setSnackbar({
                    open: true,
                    message: '✅ 密码更新成功',
                    severity: 'success'
                });
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setSnackbar({
                    open: true,
                    message: result.error || '密码更新失败',
                    severity: 'error'
                });
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: '网络错误，请检查后端',
                severity: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    // =============================================
    // 切换 Tab
    // =============================================
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // =============================================
    // 通用设置
    // =============================================
    const renderGeneralSettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <TextField
                    label="公司名称"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <BusinessIcon color="action" />
                            </InputAdornment>
                        )
                    }}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    label="公司邮箱"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                    fullWidth
                    helperText="邮件通知将发送到此邮箱"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <EmailIcon color="action" />
                            </InputAdornment>
                        )
                    }}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    select
                    label="语言"
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    fullWidth
                >
                    <MenuItem value="zh-CN">简体中文</MenuItem>
                    <MenuItem value="zh-TW">繁體中文</MenuItem>
                    <MenuItem value="en-US">English</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    select
                    label="时区"
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    fullWidth
                >
                    <MenuItem value="Asia/Shanghai">上海 (UTC+8)</MenuItem>
                    <MenuItem value="Asia/Tokyo">东京 (UTC+9)</MenuItem>
                    <MenuItem value="Europe/London">伦敦 (UTC+0)</MenuItem>
                    <MenuItem value="Europe/Paris">巴黎 (UTC+1)</MenuItem>
                </TextField>
            </Grid>
        </Grid>
    );

    // =============================================
    // 税务设置
    // =============================================
    const renderTaxSettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <TextField
                    label="默认税率 (%)"
                    type="number"
                    value={settings.defaultRate}
                    onChange={(e) => setSettings({ ...settings, defaultRate: parseFloat(e.target.value) || 0 })}
                    fullWidth
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField
                    select
                    label="货币"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    fullWidth
                >
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="USD">USD ($)</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField
                    select
                    label="默认申报周期"
                    value={settings.defaultPeriod}
                    onChange={(e) => setSettings({ ...settings, defaultPeriod: e.target.value })}
                    fullWidth
                >
                    <MenuItem value="monthly">每月</MenuItem>
                    <MenuItem value="quarterly">每季度</MenuItem>
                    <MenuItem value="annually">每年</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        ⚙️ 税务功能开关
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.ossEnabled}
                                    onChange={(e) => setSettings({ ...settings, ossEnabled: e.target.checked })}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2">OSS一站式申报</Typography>
                                    <Typography variant="caption" color="text.secondary">欧盟多国VAT申报</Typography>
                                </Box>
                            }
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.mtdEnabled}
                                    onChange={(e) => setSettings({ ...settings, mtdEnabled: e.target.checked })}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2">MTD (英国)</Typography>
                                    <Typography variant="caption" color="text.secondary">英国数字化申报</Typography>
                                </Box>
                            }
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.viesValidation}
                                    onChange={(e) => setSettings({ ...settings, viesValidation: e.target.checked })}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2">VIES验证</Typography>
                                    <Typography variant="caption" color="text.secondary">VAT号有效性验证</Typography>
                                </Box>
                            }
                        />
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );

    // =============================================
    // 通知设置
    // =============================================
    const renderNotificationSettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            📧 邮件通知
                        </Typography>
                        <Chip
                            label={settings.emailNotifications ? '已启用' : '已禁用'}
                            color={settings.emailNotifications ? 'success' : 'default'}
                            size="small"
                        />
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                            />
                        }
                        label="启用邮件通知"
                    />
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.notifyOnSuccess}
                                        onChange={(e) => setSettings({ ...settings, notifyOnSuccess: e.target.checked })}
                                        disabled={!settings.emailNotifications}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2">✅ 处理成功时通知</Typography>
                                        <Typography variant="caption" color="text.secondary">文件上传成功时发送</Typography>
                                    </Box>
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.notifyOnError}
                                        onChange={(e) => setSettings({ ...settings, notifyOnError: e.target.checked })}
                                        disabled={!settings.emailNotifications}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2">❌ 处理失败时通知</Typography>
                                        <Typography variant="caption" color="text.secondary">文件处理失败时发送</Typography>
                                    </Box>
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.weeklyReport}
                                        onChange={(e) => setSettings({ ...settings, weeklyReport: e.target.checked })}
                                        disabled={!settings.emailNotifications}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2">📊 每周汇总报告</Typography>
                                        <Typography variant="caption" color="text.secondary">每周一发送</Typography>
                                    </Box>
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.monthlyReport}
                                        onChange={(e) => setSettings({ ...settings, monthlyReport: e.target.checked })}
                                        disabled={!settings.emailNotifications}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2">📈 每月汇总报告</Typography>
                                        <Typography variant="caption" color="text.secondary">每月1日发送</Typography>
                                    </Box>
                                }
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    );

    // =============================================
    // 安全设置
    // =============================================
    const renderSecuritySettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                        🔐 密码修改
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="当前密码"
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="新密码"
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                fullWidth
                                helperText="密码至少6位"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="确认新密码"
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                fullWidth
                                error={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}
                                helperText={
                                    passwordData.confirmPassword !== '' && 
                                    passwordData.newPassword !== passwordData.confirmPassword ? 
                                    '密码不一致' : ''
                                }
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="outlined"
                                onClick={handleUpdatePassword}
                                disabled={saving || !passwordData.currentPassword || !passwordData.newPassword}
                            >
                                更新密码
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>

            <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                        🔒 安全选项
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.twoFactorAuth}
                                        onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2">双因素认证 (2FA)</Typography>
                                        <Typography variant="caption" color="text.secondary">增强账户安全</Typography>
                                    </Box>
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="会话超时 (分钟)"
                                type="number"
                                value={settings.sessionTimeout}
                                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 60 })}
                                fullWidth
                                InputProps={{ inputProps: { min: 5, max: 480 } }}
                                helperText="5-480 分钟"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="最大登录尝试次数"
                                type="number"
                                value={settings.maxLoginAttempts}
                                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                                fullWidth
                                InputProps={{ inputProps: { min: 3, max: 10 } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="IP白名单"
                                value={settings.ipWhitelist}
                                onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                                fullWidth
                                placeholder="192.168.1.1, 10.0.0.0/24"
                                helperText="多个IP用逗号分隔，留空表示允许所有"
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    );

    // =============================================
    // Tab 配置
    // =============================================
    const tabPanels = [
        { label: '⚙️ 通用', icon: <SettingsIcon />, content: renderGeneralSettings },
        { label: '💰 税务', icon: <PaymentIcon />, content: renderTaxSettings },
        { label: '🔔 通知', icon: <NotificationsIcon />, content: renderNotificationSettings },
        { label: '🔒 安全', icon: <SecurityIcon />, content: renderSecuritySettings }
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面头部 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        ⚙️ 系统设置
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        管理系统配置和偏好设置
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadSettings}
                        disabled={loading || saving}
                        size="small"
                    >
                        重新加载
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={loading || saving}
                    >
                        {saving ? '保存中...' : '保存设置'}
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* 主内容 */}
            <Paper sx={{ overflow: 'hidden' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#fafafa' }}
                >
                    {tabPanels.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            sx={{ textTransform: 'none', fontWeight: 500 }}
                        />
                    ))}
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {tabPanels[activeTab].content()}
                    
                    {/* 底部保存按钮 */}
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={loading || saving}
                            sx={{ px: 4 }}
                        >
                            {saving ? '保存中...' : '💾 保存所有设置'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* 消息提示 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Settings;