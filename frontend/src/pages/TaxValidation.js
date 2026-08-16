// frontend/src/pages/TaxValidation.js
// ============================================================
// 🔥🔥🔥 税务校验页面 - 版本 2026-08-16 包含PVA递延选项 🔥🔥🔥
// ============================================================
import React, { useState } from 'react';
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
    Chip,
    Divider
} from '@mui/material';
import { Send as SendIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';

// ===== 国家列表（43个国家）=====
const ALL_COUNTRIES = [
    { code: 'GB', name: '英国', flag: '🇬🇧', taxRate: 20 },
    { code: 'FR', name: '法国', flag: '🇫🇷', taxRate: 20 },
    { code: 'DE', name: '德国', flag: '🇩🇪', taxRate: 19 },
    { code: 'IT', name: '意大利', flag: '🇮🇹', taxRate: 22 },
    { code: 'ES', name: '西班牙', flag: '🇪🇸', taxRate: 21 },
    { code: 'NL', name: '荷兰', flag: '🇳🇱', taxRate: 21 },
    { code: 'BE', name: '比利时', flag: '🇧🇪', taxRate: 21 },
    { code: 'PL', name: '波兰', flag: '🇵🇱', taxRate: 23 },
    { code: 'SE', name: '瑞典', flag: '🇸🇪', taxRate: 25 },
    { code: 'DK', name: '丹麦', flag: '🇩🇰', taxRate: 25 },
    { code: 'FI', name: '芬兰', flag: '🇫🇮', taxRate: 24 },
    { code: 'IE', name: '爱尔兰', flag: '🇮🇪', taxRate: 23 },
    { code: 'PT', name: '葡萄牙', flag: '🇵🇹', taxRate: 23 },
    { code: 'AT', name: '奥地利', flag: '🇦🇹', taxRate: 20 },
    { code: 'NO', name: '挪威', flag: '🇳🇴', taxRate: 25 },
    { code: 'CH', name: '瑞士', flag: '🇨🇭', taxRate: 7.7 },
    { code: 'JP', name: '日本', flag: '🇯🇵', taxRate: 10 },
    { code: 'SG', name: '新加坡', flag: '🇸🇬', taxRate: 9 },
    { code: 'AU', name: '澳大利亚', flag: '🇦🇺', taxRate: 10 },
    { code: 'CA', name: '加拿大', flag: '🇨🇦', taxRate: 5 },
    { code: 'US', name: '美国', flag: '🇺🇸', taxRate: 0 },
    { code: 'KR', name: '韩国', flag: '🇰🇷', taxRate: 10 },
    { code: 'MY', name: '马来西亚', flag: '🇲🇾', taxRate: 8 },
    { code: 'TH', name: '泰国', flag: '🇹🇭', taxRate: 7 },
    { code: 'VN', name: '越南', flag: '🇻🇳', taxRate: 10 },
    { code: 'ID', name: '印度尼西亚', flag: '🇮🇩', taxRate: 11 },
    { code: 'PH', name: '菲律宾', flag: '🇵🇭', taxRate: 12 },
    { code: 'IN', name: '印度', flag: '🇮🇳', taxRate: 18 },
    { code: 'ZA', name: '南非', flag: '🇿🇦', taxRate: 15 },
    { code: 'TR', name: '土耳其', flag: '🇹🇷', taxRate: 18 },
    { code: 'AE', name: '阿联酋', flag: '🇦🇪', taxRate: 5 },
    { code: 'NZ', name: '新西兰', flag: '🇳🇿', taxRate: 15 },
    { code: 'BR', name: '巴西', flag: '🇧🇷', taxRate: 17 },
    { code: 'MX', name: '墨西哥', flag: '🇲🇽', taxRate: 16 },
];

// ===== 税务类型选项 =====
const TAX_TYPES = [
    { value: 'standard', label: '标准VAT', description: '标准增值税计算' },
    { value: 'pva', label: '递延增值税 (PVA)', description: 'Postponed VAT Accounting - 进口递延' },
    { value: 'import', label: '进口VAT', description: '进口增值税' },
];

// ===== 递延原因选项 =====
const PVA_REASONS = [
    { value: 'import_goods', label: '进口货物' },
    { value: 'cross_border', label: '跨境交易' },
    { value: 'warehousing', label: '仓储递延' },
    { value: 'other', label: '其他' },
];

function TaxValidation() {
    console.log('🔥🔥🔥 TaxValidation 组件已渲染 - 包含PVA选项 🔥🔥🔥');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        vatNumber: 'GB123456789',
        amount: 1000,
        country: 'GB',
        period: '2026-Q3',
        taxType: 'standard',
        pvaReason: 'import_goods',
        pvaReference: ''
    });

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    // ===== 获取国家名称 =====
    const getCountryName = (code) => {
        const country = ALL_COUNTRIES.find(c => c.code === code);
        return country ? `${country.flag} ${country.name}` : code;
    };

    // ===== 获取国家税率 =====
    const getTaxRate = (code) => {
        const country = ALL_COUNTRIES.find(c => c.code === code);
        return country ? country.taxRate : 0;
    };

    // ===== 执行校验 =====
    const handleValidate = async () => {
        console.log('🔄 点击执行校验按钮');
        
        const token = localStorage.getItem('token');
        console.log('🔑 Token:', token ? '存在' : '不存在');

        if (!token) {
            setError('请先登录');
            setSnackbar({ open: true, message: '请先登录', severity: 'warning' });
            return;
        }

        if (!formData.vatNumber) {
            setError('请输入VAT号码');
            setSnackbar({ open: true, message: '请输入VAT号码', severity: 'warning' });
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setSuccess(false);

        try {
            const requestBody = {
                vatNumber: formData.vatNumber,
                amount: formData.amount,
                country: formData.country,
                period: formData.period,
                taxType: formData.taxType,
                pvaReason: formData.pvaReason,
                pvaReference: formData.pvaReference
            };
            console.log('📤 发送请求:', requestBody);

            const response = await fetch('https://api.vatapex.com/api/v1/tax/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📥 响应状态:', response.status);
            const data = await response.json();
            console.log('📥 响应数据:', data);

            if (response.status === 401) {
                setError('登录已过期，请重新登录');
                setSnackbar({ open: true, message: '登录已过期，请重新登录', severity: 'error' });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                return;
            }

            if (data.success) {
                setResult(data.data);
                setSuccess(true);
                setSnackbar({ open: true, message: '✅ 校验通过！', severity: 'success' });
            } else {
                setError(data.error || '校验失败');
                setSnackbar({ open: true, message: data.error || '校验失败', severity: 'error' });
            }
        } catch (err) {
            console.error('❌ 错误:', err);
            setError('网络错误，请重试');
            setSnackbar({ open: true, message: '网络错误，请重试', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // ===== 重置表单 =====
    const handleReset = () => {
        setFormData({
            vatNumber: '',
            amount: 1000,
            country: 'GB',
            period: '2026-Q3',
            taxType: 'standard',
            pvaReason: 'import_goods',
            pvaReference: ''
        });
        setResult(null);
        setError(null);
        setSuccess(false);
    };

    // ===== 判断是否显示PVA字段 =====
    const isPVA = formData.taxType === 'pva';

    return (
        <Box sx={{ p: 3 }}>
            {/* ===== 页面标题 ===== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>✅ 税务校验</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" onClick={handleReset} disabled={loading}>重置</Button>
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

            {/* ===== 错误/成功提示 ===== */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)} icon={<ErrorIcon />}>
                    {error}
                </Alert>
            )}

            {success && result && (
                <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
                    ✅ 校验通过！VAT号码有效。
                </Alert>
            )}

            {/* ===== 主内容 ===== */}
            <Grid container spacing={3}>
                {/* ===== 左侧：表单 ===== */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>📋 校验信息</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                {/* VAT号码 */}
                                <TextField
                                    fullWidth
                                    label="VAT号码 *"
                                    value={formData.vatNumber}
                                    onChange={(e) => handleChange('vatNumber', e.target.value.toUpperCase())}
                                    placeholder="例如: GB123456789"
                                    disabled={loading}
                                />

                                {/* 金额 */}
                                <TextField
                                    fullWidth
                                    label="金额 (€)"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                                    disabled={loading}
                                />

                                {/* 国家 */}
                                <FormControl fullWidth disabled={loading}>
                                    <InputLabel>国家 *</InputLabel>
                                    <Select
                                        value={formData.country}
                                        onChange={(e) => handleChange('country', e.target.value)}
                                        label="国家 *"
                                    >
                                        {ALL_COUNTRIES.map((c) => (
                                            <MenuItem key={c.code} value={c.code}>
                                                {c.flag} {c.name} ({c.code}) - {c.taxRate}%
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* 税务类型（新增PVA选项） */}
                                <FormControl fullWidth disabled={loading}>
                                    <InputLabel>税务类型</InputLabel>
                                    <Select
                                        value={formData.taxType}
                                        onChange={(e) => handleChange('taxType', e.target.value)}
                                        label="税务类型"
                                    >
                                        {TAX_TYPES.map((t) => (
                                            <MenuItem key={t.value} value={t.value}>
                                                {t.label}
                                                <Chip 
                                                    label={t.description} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    sx={{ ml: 1, fontSize: 10 }} 
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* PVA 递延相关字段 */}
                                {isPVA && (
                                    <Paper sx={{ p: 2, bgcolor: '#fff8e1', border: '1px solid #ffb300' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Chip label="PVA" color="warning" size="small" />
                                            <Typography variant="caption" color="text.secondary">
                                                递延增值税会计
                                            </Typography>
                                        </Box>

                                        <FormControl fullWidth disabled={loading} size="small" sx={{ mb: 2 }}>
                                            <InputLabel>递延原因</InputLabel>
                                            <Select
                                                value={formData.pvaReason}
                                                onChange={(e) => handleChange('pvaReason', e.target.value)}
                                                label="递延原因"
                                            >
                                                {PVA_REASONS.map((r) => (
                                                    <MenuItem key={r.value} value={r.value}>
                                                        {r.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            fullWidth
                                            label="递延参考编号"
                                            value={formData.pvaReference}
                                            onChange={(e) => handleChange('pvaReference', e.target.value)}
                                            placeholder="例如: PVA-2026-001"
                                            disabled={loading}
                                            size="small"
                                            helperText="选填，用于追踪递延记录"
                                        />
                                    </Paper>
                                )}

                                {/* 申报周期 */}
                                <TextField
                                    fullWidth
                                    label="申报周期"
                                    value={formData.period}
                                    onChange={(e) => handleChange('period', e.target.value)}
                                    placeholder="例如: 2026-Q3"
                                    disabled={loading}
                                />

                                {/* 税率提示 */}
                                <Alert severity="info">
                                    💡 当前国家税率: <strong>{getTaxRate(formData.country)}%</strong>
                                    {isPVA && (
                                        <span> | 递延增值税 (PVA) 已启用</span>
                                    )}
                                </Alert>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* ===== 右侧：结果 ===== */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>📊 校验结果</Typography>
                            {result ? (
                                <Box sx={{ mt: 2 }}>
                                    <Paper sx={{ p: 2, bgcolor: success ? '#e8f5e9' : '#fff3e0', borderRadius: 2, mb: 2 }}>
                                        <Typography variant="subtitle2" color="textSecondary">状态</Typography>
                                        <Typography variant="h6" color={success ? 'success.main' : 'warning.main'}>
                                            {success ? '✅ 校验通过' : '⚠️ 校验结果'}
                                        </Typography>
                                        {/* 显示税务类型 */}
                                        {result.taxType && (
                                            <Chip 
                                                label={result.taxType === 'pva' ? '递延增值税 (PVA)' : '标准VAT'} 
                                                size="small" 
                                                color={result.taxType === 'pva' ? 'warning' : 'primary'}
                                                sx={{ mt: 1 }}
                                            />
                                        )}
                                    </Paper>
                                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, maxHeight: 300, overflow: 'auto' }}>
                                        <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace' }}>
                                            {JSON.stringify(result, null, 2)}
                                        </pre>
                                    </Paper>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 250, color: 'text.secondary' }}>
                                    <Typography>📝 填写左侧信息，点击"执行校验"</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ===== Snackbar ===== */}
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

export default TaxValidation;