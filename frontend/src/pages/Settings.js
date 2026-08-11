// frontend/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    TextField,
    Grid,
    Switch,
    FormControlLabel,
    Divider,
    Snackbar,
    Card,
    CardContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Save as SaveIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon
} from '@mui/icons-material';

function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        systemName: 'VATFlow',
        currency: 'EUR',
        vatRate: 20,
        maintenanceMode: false,
        taxPeriod: 'quarterly',
        defaultCountry: 'GB',
        autoValidate: false,
        emailNotifications: false,
        smsNotifications: false,
        pushNotifications: false,
        language: 'zh-CN',
        timezone: 'UTC+8',
        dateFormat: 'YYYY-MM-DD'
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // ===== 加载设置 =====
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            
            const response = await fetch('https://api.vatapex.com/api/v1/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || ''
                }
            });
            
            if (!response.ok) {
                console.log('使用默认设置');
                setSettings({
                    systemName: 'VATFlow',
                    currency: 'EUR',
                    vatRate: 20,
                    maintenanceMode: false,
                    taxPeriod: 'quarterly',
                    defaultCountry: 'GB',
                    autoValidate: false,
                    emailNotifications: false,
                    smsNotifications: false,
                    pushNotifications: false,
                    language: 'zh-CN',
                    timezone: 'UTC+8',
                    dateFormat: 'YYYY-MM-DD'
                });
                setLoading(false);
                return;
            }
            
            const result = await response.json();
            console.log('⚙️ 设置数据:', result);
            
            if (result && result.success) {
                const data = result.data || {};
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    maintenanceMode: data.maintenanceMode === true || data.maintenanceMode === 'true',
                    autoValidate: data.autoValidate === true || data.autoValidate === 'true',
                    emailNotifications: data.emailNotifications === true || data.emailNotifications === 'true',
                    smsNotifications: data.smsNotifications === true || data.smsNotifications === 'true',
                    pushNotifications: data.pushNotifications === true || data.pushNotifications === 'true'
                }));
            } else {
                setSettings({
                    systemName: 'VATFlow',
                    currency: 'EUR',
                    vatRate: 20,
                    maintenanceMode: false,
                    taxPeriod: 'quarterly',
                    defaultCountry: 'GB',
                    autoValidate: false,
                    emailNotifications: false,
                    smsNotifications: false,
                    pushNotifications: false,
                    language: 'zh-CN',
                    timezone: 'UTC+8',
                    dateFormat: 'YYYY-MM-DD'
                });
            }
        } catch (err) {
            console.error('❌ 加载设置失败:', err);
            setError('加载设置失败，使用默认配置');
            setSettings({
                systemName: 'VATFlow',
                currency: 'EUR',
                vatRate: 20,
                maintenanceMode: false,
                taxPeriod: 'quarterly',
                defaultCountry: 'GB',
                autoValidate: false,
                emailNotifications: false,
                smsNotifications: false,
                pushNotifications: false,
                language: 'zh-CN',
                timezone: 'UTC+8',
                dateFormat: 'YYYY-MM-DD'
            });
        } finally {
            setLoading(false);
        }
    };

    // ===== 保存设置 =====
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            
            const response = await fetch('https://api.vatapex.com/api/v1/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || ''
                },
                body: JSON.stringify(settings)
            });
            
            const result = await response.json();
            console.log('💾 保存设置结果:', result);
            
            if (result && result.success) {
                setSuccess(true);
                setSnackbar({
                    open: true,
                    message: '✅ 设置保存成功！',
                    severity: 'success'
                });
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(result?.error || '保存失败');
                setSnackbar({
                    open: true,
                    message: result?.error || '保存失败',
                    severity: 'error'
                });
            }
        } catch (err) {
            console.error('❌ 保存设置失败:', err);
            setError('保存设置失败');
            setSnackbar({
                open: true,
                message: '保存设置失败',
                severity: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    // ===== 切换开关 =====
    const handleToggle = (field) => {
        setSettings(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // ===== 输入变更 =====
    const handleChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // ===== 重置设置 =====
    const handleReset = () => {
        if (confirm('确定要重置所有设置为默认值吗？')) {
            setSettings({
                systemName: 'VATFlow',
                currency: 'EUR',
                vatRate: 20,
                maintenanceMode: false,
                taxPeriod: 'quarterly',
                defaultCountry: 'GB',
                autoValidate: false,
                emailNotifications: false,
                smsNotifications: false,
                pushNotifications: false,
                language: 'zh-CN',
                timezone: 'UTC+8',
                dateFormat: 'YYYY-MM-DD'
            });
            setSnackbar({
                open: true,
                message: '已重置为默认设置',
                severity: 'info'
            });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>加载设置...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    ⚙️ 系统设置
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                        variant="outlined" 
                        startIcon={<RefreshIcon />} 
                        onClick={loadSettings}
                    >
                        刷新
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        color="primary"
                    >
                        {saving ? '保存中...' : '保存设置'}
                    </Button>
                </Box>
            </Box>

            {/* 状态提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
                    ✅ 设置保存成功！
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* ===== 基本设置 ===== */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            📋 基本设置
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="系统名称"
                                    value={settings.systemName}
                                    onChange={(e) => handleChange('systemName', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>默认货币</InputLabel>
                                    <Select
                                        value={settings.currency}
                                        onChange={(e) => handleChange('currency', e.target.value)}
                                        label="默认货币"
                                    >
                                        <MenuItem value="EUR">€ EUR</MenuItem>
                                        <MenuItem value="GBP">£ GBP</MenuItem>
                                        <MenuItem value="USD">$ USD</MenuItem>
                                        <MenuItem value="CNY">¥ CNY</MenuItem>
                                        <MenuItem value="JPY">¥ JPY</MenuItem>
                                        <MenuItem value="SGD">$ SGD</MenuItem>
                                        <MenuItem value="AUD">$ AUD</MenuItem>
                                        <MenuItem value="CAD">$ CAD</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="VAT税率 (%)"
                                    type="number"
                                    value={settings.vatRate}
                                    onChange={(e) => handleChange('vatRate', parseFloat(e.target.value) || 0)}
                                    size="small"
                                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={settings.maintenanceMode}
                                            onChange={() => handleToggle('maintenanceMode')}
                                            color="warning"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2">维护模式</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {settings.maintenanceMode ? '🔴 已开启，仅管理员可访问' : '🟢 已关闭，所有用户可访问'}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                {settings.maintenanceMode && (
                                    <Chip label="维护中" color="warning" size="small" sx={{ ml: 2 }} />
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* ===== 税务设置 ===== */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            📊 税务设置
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>税务申报周期</InputLabel>
                                    <Select
                                        value={settings.taxPeriod}
                                        onChange={(e) => handleChange('taxPeriod', e.target.value)}
                                        label="税务申报周期"
                                    >
                                        <MenuItem value="monthly">月度</MenuItem>
                                        <MenuItem value="quarterly">季度</MenuItem>
                                        <MenuItem value="semi-annual">半年度</MenuItem>
                                        <MenuItem value="annual">年度</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>默认国家</InputLabel>
                                    <Select
                                        value={settings.defaultCountry}
                                        onChange={(e) => handleChange('defaultCountry', e.target.value)}
                                        label="默认国家"
                                    >
                                        <MenuItem value="GB">🇬🇧 英国</MenuItem>
                                        <MenuItem value="FR">🇫🇷 法国</MenuItem>
                                        <MenuItem value="DE">🇩🇪 德国</MenuItem>
                                        <MenuItem value="IT">🇮🇹 意大利</MenuItem>
                                        <MenuItem value="ES">🇪🇸 西班牙</MenuItem>
                                        <MenuItem value="NL">🇳🇱 荷兰</MenuItem>
                                        <MenuItem value="BE">🇧🇪 比利时</MenuItem>
                                        <MenuItem value="PL">🇵🇱 波兰</MenuItem>
                                        <MenuItem value="SE">🇸🇪 瑞典</MenuItem>
                                        <MenuItem value="JP">🇯🇵 日本</MenuItem>
                                        <MenuItem value="SG">🇸🇬 新加坡</MenuItem>
                                        <MenuItem value="US">🇺🇸 美国</MenuItem>
                                        <MenuItem value="CA">🇨🇦 加拿大</MenuItem>
                                        <MenuItem value="AU">🇦🇺 澳大利亚</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={settings.autoValidate}
                                            onChange={() => handleToggle('autoValidate')}
                                            color="success"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2">自动校验</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {settings.autoValidate ? '✅ 已开启，上传后自动校验' : '⏸️ 已关闭，需手动校验'}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* ===== 通知设置 ===== */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            🔔 通知设置
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={settings.emailNotifications}
                                            onChange={() => handleToggle('emailNotifications')}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2">📧 邮件通知</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {settings.emailNotifications ? '✅ 已开启' : '⏸️ 已关闭'}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={settings.smsNotifications}
                                            onChange={() => handleToggle('smsNotifications')}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2">📱 短信通知</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {settings.smsNotifications ? '✅ 已开启' : '⏸️ 已关闭'}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={settings.pushNotifications}
                                            onChange={() => handleToggle('pushNotifications')}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2">🔔 推送通知</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {settings.pushNotifications ? '✅ 已开启' : '⏸️ 已关闭'}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* ===== 高级设置 ===== */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            🔧 高级设置
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>语言</InputLabel>
                                    <Select
                                        value={settings.language || 'zh-CN'}
                                        onChange={(e) => handleChange('language', e.target.value)}
                                        label="语言"
                                    >
                                        <MenuItem value="zh-CN">简体中文</MenuItem>
                                        <MenuItem value="zh-TW">繁體中文</MenuItem>
                                        <MenuItem value="en-US">English</MenuItem>
                                        <MenuItem value="ja-JP">日本語</MenuItem>
                                        <MenuItem value="ko-KR">한국어</MenuItem>
                                        <MenuItem value="fr-FR">Français</MenuItem>
                                        <MenuItem value="de-DE">Deutsch</MenuItem>
                                        <MenuItem value="es-ES">Español</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>时区</InputLabel>
                                    <Select
                                        value={settings.timezone || 'UTC+8'}
                                        onChange={(e) => handleChange('timezone', e.target.value)}
                                        label="时区"
                                    >
                                        <MenuItem value="UTC+0">UTC+0 (伦敦)</MenuItem>
                                        <MenuItem value="UTC+1">UTC+1 (巴黎)</MenuItem>
                                        <MenuItem value="UTC+2">UTC+2 (雅典)</MenuItem>
                                        <MenuItem value="UTC+8">UTC+8 (北京/新加坡)</MenuItem>
                                        <MenuItem value="UTC+9">UTC+9 (东京)</MenuItem>
                                        <MenuItem value="UTC-5">UTC-5 (纽约)</MenuItem>
                                        <MenuItem value="UTC-8">UTC-8 (洛杉矶)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>日期格式</InputLabel>
                                    <Select
                                        value={settings.dateFormat || 'YYYY-MM-DD'}
                                        onChange={(e) => handleChange('dateFormat', e.target.value)}
                                        label="日期格式"
                                    >
                                        <MenuItem value="YYYY-MM-DD">2026-08-11</MenuItem>
                                        <MenuItem value="DD/MM/YYYY">11/08/2026</MenuItem>
                                        <MenuItem value="MM/DD/YYYY">08/11/2026</MenuItem>
                                        <MenuItem value="DD-MM-YYYY">11-08-2026</MenuItem>
                                        <MenuItem value="YYYY/MM/DD">2026/08/11</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* ===== 重置按钮 ===== */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="outlined" color="error" onClick={handleReset}>
                            恢复默认设置
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Settings;