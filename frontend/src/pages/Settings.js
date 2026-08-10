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
    Divider
} from '@mui/material';
import { Refresh as RefreshIcon, Save as SaveIcon } from '@mui/icons-material';
import { settingsAPI } from '../services/api';

function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await settingsAPI.getSettings();
            console.log('⚙️ 设置数据:', result);
            if (result && result.success) {
                setSettings(result.data || {});
            } else if (result && result.data) {
                setSettings(result.data);
            } else {
                setSettings(result || {});
            }
        } catch (err) {
            console.error('❌ 加载失败:', err);
            setError(typeof err === 'string' ? err : '加载设置失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const result = await settingsAPI.updateSettings(settings);
            if (result && result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            setError(typeof err === 'string' ? err : '保存设置失败');
        } finally {
            setSaving(false);
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    ⚙️ 系统设置
                </Typography>
                <Box>
                    <Button 
                        variant="outlined" 
                        startIcon={<RefreshIcon />} 
                        onClick={loadData}
                        sx={{ mr: 1 }}
                    >
                        刷新
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '保存中...' : '保存设置'}
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    设置保存成功！
                </Alert>
            )}

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    基本设置
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="系统名称"
                            value={settings.systemName || 'VATFlow'}
                            onChange={(e) => setSettings({...settings, systemName: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="默认货币"
                            value={settings.currency || 'EUR'}
                            onChange={(e) => setSettings({...settings, currency: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="VAT税率 (%)"
                            type="number"
                            value={settings.vatRate || 20}
                            onChange={(e) => setSettings({...settings, vatRate: parseFloat(e.target.value)})}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={settings.maintenanceMode || false}
                                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                                />
                            }
                            label="维护模式"
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    税务设置
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="税务申报周期"
                            value={settings.taxPeriod || 'quarterly'}
                            onChange={(e) => setSettings({...settings, taxPeriod: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="默认国家"
                            value={settings.defaultCountry || 'UK'}
                            onChange={(e) => setSettings({...settings, defaultCountry: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={settings.autoValidate || false}
                                    onChange={(e) => setSettings({...settings, autoValidate: e.target.checked})}
                                />
                            }
                            label="自动校验"
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    通知设置
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={settings.emailNotifications || false}
                                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                                />
                            }
                            label="邮件通知"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={settings.smsNotifications || false}
                                    onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                                />
                            }
                            label="短信通知"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={settings.pushNotifications || false}
                                    onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                                />
                            }
                            label="推送通知"
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

export default Settings;