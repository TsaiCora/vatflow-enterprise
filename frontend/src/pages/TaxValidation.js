// frontend/src/pages/TaxValidation.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Snackbar,
    IconButton
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Send as SendIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { taxAPI } from '../services/api';

// ===== 完整国家列表（与 VATProfileSelector 保持一致）=====
const ALL_COUNTRIES = [
    // 欧洲
    { code: 'GB', name: '英国', flag: '🇬🇧', taxRate: 20, currency: 'GBP' },
    { code: 'FR', name: '法国', flag: '🇫🇷', taxRate: 20, currency: 'EUR' },
    { code: 'DE', name: '德国', flag: '🇩🇪', taxRate: 19, currency: 'EUR' },
    { code: 'IT', name: '意大利', flag: '🇮🇹', taxRate: 22, currency: 'EUR' },
    { code: 'ES', name: '西班牙', flag: '🇪🇸', taxRate: 21, currency: 'EUR' },
    { code: 'NL', name: '荷兰', flag: '🇳🇱', taxRate: 21, currency: 'EUR' },
    { code: 'BE', name: '比利时', flag: '🇧🇪', taxRate: 21, currency: 'EUR' },
    { code: 'AT', name: '奥地利', flag: '🇦🇹', taxRate: 20, currency: 'EUR' },
    { code: 'PL', name: '波兰', flag: '🇵🇱', taxRate: 23, currency: 'PLN' },
    { code: 'SE', name: '瑞典', flag: '🇸🇪', taxRate: 25, currency: 'SEK' },
    { code: 'DK', name: '丹麦', flag: '🇩🇰', taxRate: 25, currency: 'DKK' },
    { code: 'FI', name: '芬兰', flag: '🇫🇮', taxRate: 24, currency: 'EUR' },
    { code: 'IE', name: '爱尔兰', flag: '🇮🇪', taxRate: 23, currency: 'EUR' },
    { code: 'PT', name: '葡萄牙', flag: '🇵🇹', taxRate: 23, currency: 'EUR' },
    { code: 'NO', name: '挪威', flag: '🇳🇴', taxRate: 25, currency: 'NOK' },
    { code: 'CH', name: '瑞士', flag: '🇨🇭', taxRate: 7.7, currency: 'CHF' },
    { code: 'RU', name: '俄罗斯', flag: '🇷🇺', taxRate: 20, currency: 'RUB' },
    // 亚洲
    { code: 'JP', name: '日本', flag: '🇯🇵', taxRate: 10, currency: 'JPY' },
    { code: 'CN', name: '中国', flag: '🇨🇳', taxRate: 13, currency: 'CNY' },
    { code: 'KR', name: '韩国', flag: '🇰🇷', taxRate: 10, currency: 'KRW' },
    { code: 'SG', name: '新加坡', flag: '🇸🇬', taxRate: 9, currency: 'SGD' },
    { code: 'MY', name: '马来西亚', flag: '🇲🇾', taxRate: 8, currency: 'MYR' },
    { code: 'TH', name: '泰国', flag: '🇹🇭', taxRate: 7, currency: 'THB' },
    { code: 'VN', name: '越南', flag: '🇻🇳', taxRate: 10, currency: 'VND' },
    { code: 'ID', name: '印度尼西亚', flag: '🇮🇩', taxRate: 11, currency: 'IDR' },
    { code: 'PH', name: '菲律宾', flag: '🇵🇭', taxRate: 12, currency: 'PHP' },
    { code: 'IN', name: '印度', flag: '🇮🇳', taxRate: 18, currency: 'INR' },
    { code: 'HK', name: '香港', flag: '🇭🇰', taxRate: 0, currency: 'HKD' },
    { code: 'TW', name: '台湾', flag: '🇹🇼', taxRate: 5, currency: 'TWD' },
    // 美洲
    { code: 'US', name: '美国', flag: '🇺🇸', taxRate: 0, currency: 'USD' },
    { code: 'CA', name: '加拿大', flag: '🇨🇦', taxRate: 5, currency: 'CAD' },
    { code: 'MX', name: '墨西哥', flag: '🇲🇽', taxRate: 16, currency: 'MXN' },
    { code: 'BR', name: '巴西', flag: '🇧🇷', taxRate: 17, currency: 'BRL' },
    { code: 'AR', name: '阿根廷', flag: '🇦🇷', taxRate: 21, currency: 'ARS' },
    // 大洋洲
    { code: 'AU', name: '澳大利亚', flag: '🇦🇺', taxRate: 10, currency: 'AUD' },
    { code: 'NZ', name: '新西兰', flag: '🇳🇿', taxRate: 15, currency: 'NZD' },
    // 非洲
    { code: 'ZA', name: '南非', flag: '🇿🇦', taxRate: 15, currency: 'ZAR' },
    { code: 'NG', name: '尼日利亚', flag: '🇳🇬', taxRate: 7.5, currency: 'NGN' },
    { code: 'EG', name: '埃及', flag: '🇪🇬', taxRate: 14, currency: 'EGP' },
    // 中东
    { code: 'AE', name: '阿联酋', flag: '🇦🇪', taxRate: 5, currency: 'AED' },
    { code: 'SA', name: '沙特阿拉伯', flag: '🇸🇦', taxRate: 15, currency: 'SAR' },
    { code: 'IL', name: '以色列', flag: '🇮🇱', taxRate: 17, currency: 'ILS' },
    { code: 'TR', name: '土耳其', flag: '🇹🇷', taxRate: 18, currency: 'TRY' },
];

function TaxValidation() {
    const [loading, setLoading] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        vatNumber: '',
        amount: 1000,
        country: 'GB',
        period: '2026-Q3'
    });

    // 检查登录状态
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('请先登录后再使用税务校验功能');
        }
    }, []);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleValidate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('请先登录后再执行税务校验');
            setSnackbar({
                open: true,
                message: '请先登录',
                severity: 'warning'
            });
            return;
        }

        if (!formData.vatNumber) {
            setError('请输入VAT号码');
            setSnackbar({
                open: true,
                message: '请输入VAT号码',
                severity: 'warning'
            });
            return;
        }

        setLoading(true);
        setError(null);
        setValidationResult(null);
        setSuccess(false);

        try {
            console.log('📤 发送校验请求:', formData);
            console.log('🔑 当前Token:', token ? '存在' : '不存在');

            const result = await taxAPI.validate(formData);
            console.log('✅ 税务校验结果:', result);

            if (result && result.success) {
                setValidationResult(result.data);
                setSuccess(true);
                setSnackbar({
                    open: true,
                    message: '✅ 税务校验通过！',
                    severity: 'success'
                });
            } else {
                setValidationResult(result);
                const errorMsg = result?.error || '校验失败，请检查数据';
                setError(errorMsg);
                setSnackbar({
                    open: true,
                    message: errorMsg,
                    severity: 'error'
                });
            }
        } catch (err) {
            console.error('❌ 校验失败:', err);

            if (err && err.status === 401) {
                const msg = '登录已过期，请重新登录';
                setError(msg);
                setSnackbar({
                    open: true,
                    message: msg,
                    severity: 'error'
                });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2500);
            } else {
                const msg = typeof err === 'string' ? err : (err?.message || '税务校验失败，请检查网络');
                setError(msg);
                setSnackbar({
                    open: true,
                    message: msg,
                    severity: 'error'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            vatNumber: '',
            amount: 1000,
            country: 'GB',
            period: '2026-Q3'
        });
        setValidationResult(null);
        setError(null);
        setSuccess(false);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // 获取国家显示名称
    const getCountryDisplay = (code) => {
        const country = ALL_COUNTRIES.find(c => c.code === code);
        return country ? `${country.flag} ${country.name}` : code;
    };

    // 获取国家税率
    const getCountryTaxRate = (code) => {
        const country = ALL_COUNTRIES.find(c => c.code === code);
        return country ? country.taxRate : 0;
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    ✅ 税务校验
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleReset}
                        disabled={loading}
                    >
                        重置
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                        onClick={handleValidate}
                        disabled={loading}
                    >
                        {loading ? '校验中...' : '执行校验'}
                    </Button>
                </Box>
            </Box>

            {/* 错误提示 */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={() => setError(null)}
                    icon={<ErrorIcon />}
                >
                    {error}
                </Alert>
            )}

            {/* 成功提示 */}
            {success && validationResult && (
                <Alert
                    severity="success"
                    sx={{ mb: 3 }}
                    icon={<CheckCircleIcon />}
                >
                    ✅ 校验通过！VAT号码有效。
                </Alert>
            )}

            {/* 主要区域 */}
            <Grid container spacing={3}>
                {/* 左侧 - 校验表单 */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📋 校验信息
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="VAT号码 *"
                                    value={formData.vatNumber}
                                    onChange={(e) => handleInputChange('vatNumber', e.target.value.toUpperCase())}
                                    placeholder="例如: GB123456789"
                                    size="medium"
                                    helperText="请输入需要校验的VAT号码"
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="金额 (€)"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                                    size="medium"
                                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                                    disabled={loading}
                                />
                                <FormControl fullWidth size="medium" disabled={loading}>
                                    <InputLabel>国家 *</InputLabel>
                                    <Select
                                        value={formData.country}
                                        onChange={(e) => handleInputChange('country', e.target.value)}
                                        label="国家 *"
                                    >
                                        {ALL_COUNTRIES.map((country) => (
                                            <MenuItem key={country.code} value={country.code}>
                                                {country.flag} {country.name} ({country.code}) - {country.taxRate}%
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="申报周期"
                                    value={formData.period}
                                    onChange={(e) => handleInputChange('period', e.target.value)}
                                    placeholder="例如: 2026-Q3"
                                    size="medium"
                                    helperText="格式: YYYY-Q1 或 YYYY-MM"
                                    disabled={loading}
                                />
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    💡 当前国家税率: <strong>{getCountryTaxRate(formData.country)}%</strong>
                                </Alert>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 右侧 - 校验结果 */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📊 校验结果
                            </Typography>
                            {validationResult ? (
                                <Box sx={{ mt: 2 }}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            bgcolor: success ? '#e8f5e9' : '#fff3e0',
                                            borderRadius: 2,
                                            mb: 2
                                        }}
                                    >
                                        <Typography variant="subtitle2" color="textSecondary">
                                            状态
                                        </Typography>
                                        <Typography variant="h6" color={success ? 'success.main' : 'warning.main'}>
                                            {success ? '✅ 校验通过' : '⚠️ 校验结果'}
                                        </Typography>
                                    </Paper>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            bgcolor: '#f5f5f5',
                                            borderRadius: 2,
                                            maxHeight: 300,
                                            overflow: 'auto'
                                        }}
                                    >
                                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                            返回数据:
                                        </Typography>
                                        <pre style={{
                                            margin: 0,
                                            fontSize: 12,
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-all'
                                        }}>
                                            {JSON.stringify(validationResult, null, 2)}
                                        </pre>
                                    </Paper>
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: 250,
                                        color: 'text.secondary'
                                    }}
                                >
                                    <Typography variant="body1" gutterBottom>
                                        📝 填写左侧信息
                                    </Typography>
                                    <Typography variant="caption">
                                        点击"执行校验"查看结果
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Snackbar 通知 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={handleCloseSnackbar}
                    icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default TaxValidation;