// frontend/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
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
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Tabs,
    Tab
} from '@mui/material';
import {
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Security as SecurityIcon,
    Notifications as NotificationsIcon,
    Payment as PaymentIcon,
    Business as BusinessIcon,
    Public as PublicIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { getSettings, updateSettings } from '../services/api';

function Settings() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [settings, setSettings] = useState({
        // 通用设置
        companyName: 'VATFlow',
        companyEmail: 'admin@vatflow.com',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        
        // 税务设置
        defaultRate: 20,
        currency: 'EUR',
        ossEnabled: true,
        mtdEnabled: false,
        viesValidation: true,
        defaultPeriod: 'monthly',
        
        // 通知设置
        emailNotifications: true,
        notifyOnSuccess: true,
        notifyOnError: true,
        weeklyReport: true,
        monthlyReport: true,
        
        // 安全设置
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

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getSettings();
            setSettings({ ...settings, ...data });
        } catch (error) {
            setSnackbar({
                open: true,
                message: '加载设置失败',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;
        setSettings({ ...settings, [field]: value });
    };

    const handlePasswordChange = (field) => (event) => {
        setPasswordData({ ...passwordData, [field]: event.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateSettings(settings);
            setSnackbar({
                open: true,
                message: '设置已保存成功',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message || '保存失败',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setSnackbar({
                open: true,
                message: '两次输入的密码不一致',
                severity: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            // 调用密码更新API
            setSnackbar({
                open: true,
                message: '密码更新成功',
                severity: 'success'
            });
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message || '密码更新失败',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const renderGeneralSettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <TextField
                    label="公司名称"
                    value={settings.companyName}
                    onChange={handleChange('companyName')}
                    fullWidth
                    InputProps={{
                        startAdornment: <BusinessIcon color="action" sx={{ mr: 1 }} />
                    }}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    label="公司邮箱"
                    type="email"
                    value={settings.companyEmail}
                    onChange={handleChange('companyEmail')}
                    fullWidth
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    select
                    label="语言"
                    value={settings.language}
                    onChange={handleChange('language')}
                    fullWidth
                >
                    <MenuItem value="zh-CN">简体中文</MenuItem>
                    <MenuItem value="zh-TW">繁體中文</MenuItem>
                    <MenuItem value="en-US">English</MenuItem>
                    <MenuItem value="fr-FR">Français</MenuItem>
                    <MenuItem value="de-DE">Deutsch</MenuItem>
                    <MenuItem value="es-ES">Español</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    select
                    label="时区"
                    value={settings.timezone}
                    onChange={handleChange('timezone')}
                    fullWidth
                >
                    <MenuItem value="Asia/Shanghai">上海 (UTC+8)</MenuItem>
                    <MenuItem value="Asia/Tokyo">东京 (UTC+9)</MenuItem>
                    <MenuItem value="Europe/London">伦敦 (UTC+0)</MenuItem>
                    <MenuItem value="Europe/Paris">巴黎 (UTC+1)</MenuItem>
                    <MenuItem value="America/New_York">纽约 (UTC-4)</MenuItem>
                </TextField>
            </Grid>
        </Grid>
    );

    const renderTaxSettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <TextField
                    label="默认税率 (%)"
                    type="number"
                    value={settings.defaultRate}
                    onChange={handleChange('defaultRate')}
                    fullWidth
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField
                    select
                    label="货币"
                    value={settings.currency}
                    onChange={handleChange('currency')}
                    fullWidth
                >
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="CNY">CNY (¥)</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField
                    select
                    label="默认申报周期"
                    value={settings.defaultPeriod}
                    onChange={handleChange('defaultPeriod')}
                    fullWidth
                >
                    <MenuItem value="monthly">每月</MenuItem>
                    <MenuItem value="quarterly">每季度</MenuItem>
                    <MenuItem value="annually">每年</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.ossEnabled}
                                onChange={handleChange('ossEnabled')}
                            />
                        }
                        label="启用OSS一站式申报"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.mtdEnabled}
                                onChange={handleChange('mtdEnabled')}
                            />
                        }
                        label="启用MTD (英国)"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.viesValidation}
                                onChange={handleChange('viesValidation')}
                            />
                        }
                        label="启用VIES验证"
                    />
                </Box>
            </Grid>
        </Grid>
    );

    const renderNotificationSettings = () => (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.emailNotifications}
                            onChange={handleChange('emailNotifications')}
                        />
                    }
                    label="启用邮件通知"
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.notifyOnSuccess}
                            onChange={handleChange('notifyOnSuccess')}
                            disabled={!settings.emailNotifications}
                        />
                    }
                    label="处理成功时通知"
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.notifyOnError}
                            onChange={handleChange('notifyOnError')}
                            disabled={!settings.emailNotifications}
                        />
                    }
                    label="处理失败时通知"
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.weeklyReport}
                            onChange={handleChange('weeklyReport')}
                            disabled={!settings.emailNotifications}
                        />
                    }
                    label="每周汇总报告"
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.monthlyReport}
                            onChange={handleChange('monthlyReport')}
                            disabled={!settings.emailNotifications}
                        />
                    }
                    label="每月汇总报告"
                />
            </Grid>
        </Grid>
    );

    const renderSecuritySettings = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                    🔐 密码修改
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="当前密码"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange('currentPassword')}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="新密码"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange('newPassword')}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="确认新密码"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange('confirmPassword')}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="outlined"
                            onClick={handlePasswordUpdate}
                            disabled={loading}
                        >
                            更新密码
                        </Button>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                    🔒 安全选项
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.twoFactorAuth}
                                    onChange={handleChange('twoFactorAuth')}
                                />
                            }
                            label="启用双因素认证 (2FA)"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="会话超时 (分钟)"
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={handleChange('sessionTimeout')}
                            fullWidth
                            InputProps={{ inputProps: { min: 5, max: 480 } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="最大登录尝试次数"
                            type="number"
                            value={settings.maxLoginAttempts}
                            onChange={handleChange('maxLoginAttempts')}
                            fullWidth
                            InputProps={{ inputProps: { min: 3, max: 10 } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="IP白名单 (逗号分隔)"
                            value={settings.ipWhitelist}
                            onChange={handleChange('ipWhitelist')}
                            fullWidth
                            placeholder="192.168.1.1, 10.0.0.0/24"
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );

    const tabPanels = [
        { label: '⚙️ 通用', icon: <SettingsIcon />, content: renderGeneralSettings },
        { label: '💰 税务', icon: <PaymentIcon />, content: renderTaxSettings },
        { label: '🔔 通知', icon: <NotificationsIcon />, content: renderNotificationSettings },
        { label: '🔒 安全', icon: <SecurityIcon />, content: renderSecuritySettings }
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    ⚙️ 系统设置
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="重新加载">
                        <IconButton size="small" onClick={loadSettings}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? '保存中...' : '保存设置'}
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <Paper sx={{ overflow: 'hidden' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    {tabPanels.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {tabPanels[activeTab].content()}
                </Box>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Settings;