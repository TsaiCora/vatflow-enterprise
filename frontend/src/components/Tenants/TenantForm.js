// frontend/src/components/Tenants/TenantForm.js
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Switch,
    FormControlLabel,
    Divider,
    Alert,
    IconButton,
    InputAdornment,
    Tooltip,
    Paper,
    Stepper,
    Step,
    StepLabel,
    StepContent
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Public as PublicIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

// 欧盟国家列表
const EU_COUNTRIES = [
    { code: 'AT', name: '奥地利' }, { code: 'BE', name: '比利时' },
    { code: 'BG', name: '保加利亚' }, { code: 'HR', name: '克罗地亚' },
    { code: 'CY', name: '塞浦路斯' }, { code: 'CZ', name: '捷克' },
    { code: 'DK', name: '丹麦' }, { code: 'EE', name: '爱沙尼亚' },
    { code: 'FI', name: '芬兰' }, { code: 'FR', name: '法国' },
    { code: 'DE', name: '德国' }, { code: 'GR', name: '希腊' },
    { code: 'HU', name: '匈牙利' }, { code: 'IE', name: '爱尔兰' },
    { code: 'IT', name: '意大利' }, { code: 'LV', name: '拉脱维亚' },
    { code: 'LT', name: '立陶宛' }, { code: 'LU', name: '卢森堡' },
    { code: 'MT', name: '马耳他' }, { code: 'NL', name: '荷兰' },
    { code: 'PL', name: '波兰' }, { code: 'PT', name: '葡萄牙' },
    { code: 'RO', name: '罗马尼亚' }, { code: 'SK', name: '斯洛伐克' },
    { code: 'SI', name: '斯洛文尼亚' }, { code: 'ES', name: '西班牙' },
    { code: 'SE', name: '瑞典' }, { code: 'GB', name: '英国' }
];

/**
 * 客户表单组件
 * @param {Object} props
 * @param {boolean} props.open - 是否打开
 * @param {Object} props.tenant - 编辑时的客户数据
 * @param {Function} props.onClose - 关闭回调
 * @param {Function} props.onSubmit - 提交回调
 * @param {string} props.mode - 'add' | 'edit' | 'view'
 */
function TenantForm({
    open = false,
    tenant = null,
    onClose,
    onSubmit,
    mode = 'add'
}) {
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const isAdd = mode === 'add';

    const [formData, setFormData] = useState({
        tenantId: '',
        name: '',
        email: '',
        password: '',
        company: '',
        vatNumber: '',
        country: 'GB',
        status: 'active',
        settings: {
            autoProcess: true,
            emailNotifications: true,
            defaultRate: 20,
            currency: 'EUR'
        },
        taxConfig: {
            ossEnabled: true,
            mtdEnabled: false,
            viesValidation: true,
            defaultPeriod: 'monthly'
        }
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // 初始化表单数据
    useEffect(() => {
        if (tenant && (isEdit || isView)) {
            setFormData({
                ...tenant,
                password: '',
                settings: tenant.settings || formData.settings,
                taxConfig: tenant.taxConfig || formData.taxConfig
            });
        } else if (isAdd) {
            setFormData({
                tenantId: generateTenantId(),
                name: '',
                email: '',
                password: '',
                company: '',
                vatNumber: '',
                country: 'GB',
                status: 'active',
                settings: {
                    autoProcess: true,
                    emailNotifications: true,
                    defaultRate: 20,
                    currency: 'EUR'
                },
                taxConfig: {
                    ossEnabled: true,
                    mtdEnabled: false,
                    viesValidation: true,
                    defaultPeriod: 'monthly'
                }
            });
        }
    }, [tenant, mode, open]);

    // 生成客户ID
    const generateTenantId = () => {
        const prefix = 'client';
        const random = Math.random().toString(36).substring(2, 6);
        return `${prefix}_${random}`;
    };

    // 处理表单变化
    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        // 清除该字段错误
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // 处理嵌套设置变化
    const handleSettingsChange = (field) => (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;
        setFormData(prev => ({
            ...prev,
            settings: { ...prev.settings, [field]: value }
        }));
    };

    // 处理税务配置变化
    const handleTaxConfigChange = (field) => (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;
        setFormData(prev => ({
            ...prev,
            taxConfig: { ...prev.taxConfig, [field]: value }
        }));
    };

    // 验证表单
    const validate = () => {
        const newErrors = {};

        if (!formData.tenantId) newErrors.tenantId = '请输入客户ID';
        if (!formData.name) newErrors.name = '请输入客户名称';
        if (!formData.email) newErrors.email = '请输入邮箱地址';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '请输入有效的邮箱地址';
        }
        if (isAdd && !formData.password) {
            newErrors.password = '请设置密码（至少6位）';
        } else if (isAdd && formData.password && formData.password.length < 6) {
            newErrors.password = '密码至少6位';
        }
        if (!formData.country) newErrors.country = '请选择国家';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 提交表单
    const handleSubmit = async () => {
        if (!validate()) {
            // 跳转到有错误的步骤
            if (errors.password || errors.tenantId || errors.name || errors.email) {
                setActiveStep(0);
            }
            return;
        }

        setSubmitting(true);
        try {
            const submitData = { ...formData };
            // 如果是编辑且密码为空，删除密码字段
            if (isEdit && !submitData.password) {
                delete submitData.password;
            }
            await onSubmit(submitData);
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const steps = [
        {
            label: '基本信息',
            description: '填写客户基本账户信息'
        },
        {
            label: '业务信息',
            description: '填写公司及VAT相关信息'
        },
        {
            label: '配置设置',
            description: '配置系统默认设置'
        }
    ];

    // 渲染步骤内容
    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="客户ID"
                                    value={formData.tenantId}
                                    onChange={handleChange('tenantId')}
                                    fullWidth
                                    disabled={isView || isEdit}
                                    error={!!errors.tenantId}
                                    helperText={errors.tenantId}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="客户名称"
                                    value={formData.name}
                                    onChange={handleChange('name')}
                                    fullWidth
                                    disabled={isView}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="邮箱地址"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    fullWidth
                                    disabled={isView}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label={isAdd ? '设置密码' : '新密码（留空则不修改）'}
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange('password')}
                                    fullWidth
                                    disabled={isView}
                                    error={!!errors.password}
                                    helperText={errors.password || (isAdd ? '密码至少6位' : '')}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    required={isAdd}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="公司名称"
                                    value={formData.company}
                                    onChange={handleChange('company')}
                                    fullWidth
                                    disabled={isView}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BusinessIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth error={!!errors.country}>
                                    <InputLabel>国家</InputLabel>
                                    <Select
                                        value={formData.country}
                                        onChange={handleChange('country')}
                                        label="国家"
                                        disabled={isView}
                                    >
                                        {EU_COUNTRIES.map((c) => (
                                            <MenuItem key={c.code} value={c.code}>
                                                {c.code} - {c.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.country && <FormHelperText>{errors.country}</FormHelperText>}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="VAT号码"
                                    value={formData.vatNumber}
                                    onChange={handleChange('vatNumber')}
                                    fullWidth
                                    disabled={isView}
                                    placeholder="例如: GB123456789"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>状态</InputLabel>
                                    <Select
                                        value={formData.status}
                                        onChange={handleChange('status')}
                                        label="状态"
                                        disabled={isView}
                                    >
                                        <MenuItem value="active">✅ 活跃</MenuItem>
                                        <MenuItem value="inactive">⛔ 停用</MenuItem>
                                        <MenuItem value="pending">⏳ 待审核</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            系统设置
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.settings?.autoProcess}
                                            onChange={handleSettingsChange('autoProcess')}
                                            disabled={isView}
                                        />
                                    }
                                    label="自动处理上传文件"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.settings?.emailNotifications}
                                            onChange={handleSettingsChange('emailNotifications')}
                                            disabled={isView}
                                        />
                                    }
                                    label="邮件通知"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="默认税率 (%)"
                                    type="number"
                                    value={formData.settings?.defaultRate || 20}
                                    onChange={handleSettingsChange('defaultRate')}
                                    fullWidth
                                    disabled={isView}
                                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>货币</InputLabel>
                                    <Select
                                        value={formData.settings?.currency || 'EUR'}
                                        onChange={handleSettingsChange('currency')}
                                        label="货币"
                                        disabled={isView}
                                    >
                                        <MenuItem value="EUR">EUR (€)</MenuItem>
                                        <MenuItem value="GBP">GBP (£)</MenuItem>
                                        <MenuItem value="USD">USD ($)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                            税务配置
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.taxConfig?.ossEnabled}
                                            onChange={handleTaxConfigChange('ossEnabled')}
                                            disabled={isView}
                                        />
                                    }
                                    label="启用OSS申报"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.taxConfig?.mtdEnabled}
                                            onChange={handleTaxConfigChange('mtdEnabled')}
                                            disabled={isView}
                                        />
                                    }
                                    label="启用MTD (英国)"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.taxConfig?.viesValidation}
                                            onChange={handleTaxConfigChange('viesValidation')}
                                            disabled={isView}
                                        />
                                    }
                                    label="VIES验证"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>默认申报周期</InputLabel>
                                    <Select
                                        value={formData.taxConfig?.defaultPeriod || 'monthly'}
                                        onChange={handleTaxConfigChange('defaultPeriod')}
                                        label="默认申报周期"
                                        disabled={isView}
                                    >
                                        <MenuItem value="monthly">每月</MenuItem>
                                        <MenuItem value="quarterly">每季度</MenuItem>
                                        <MenuItem value="annually">每年</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                );

            default:
                return null;
        }
    };

    // 处理步骤导航
    const handleNext = () => {
        setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => {
        setActiveStep((prev) => Math.max(prev - 1, 0));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { height: '85vh', maxHeight: '85vh' }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {isView ? '👤 客户详情' : isEdit ? '✏️ 编辑客户' : '➕ 新增客户'}
                        </Typography>
                        {isView && tenant && (
                            <Chip
                                label={tenant.status === 'active' ? '✅ 活跃' : '⛔ 停用'}
                                color={tenant.status === 'active' ? 'success' : 'default'}
                                size="small"
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* 错误提示 */}
                {errors.submit && (
                    <Alert severity="error" sx={{ m: 2 }} onClose={() => setErrors({})}>
                        {errors.submit}
                    </Alert>
                )}

                {/* 步骤条 */}
                {!isView && (
                    <Box sx={{ px: 3, pt: 2 }}>
                        <Stepper activeStep={activeStep} orientation="horizontal">
                            {steps.map((step, index) => (
                                <Step key={index}>
                                    <StepLabel>
                                        <Typography variant="caption" display="block">
                                            {step.label}
                                        </Typography>
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                )}

                {/* 内容区域 */}
                <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                    {isView ? (
                        // 查看模式 - 显示所有信息
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">客户ID</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                                        {tenant?.tenantId}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">客户名称</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {tenant?.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">邮箱</Typography>
                                    <Typography variant="body1">{tenant?.email}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">公司</Typography>
                                    <Typography variant="body1">{tenant?.company || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">国家</Typography>
                                    <Typography variant="body1">{tenant?.country}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">VAT号码</Typography>
                                    <Typography variant="body1">{tenant?.vatNumber || '-'}</Typography>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>系统设置</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" color="text.secondary">自动处理</Typography>
                                    <Typography variant="body2">{tenant?.settings?.autoProcess ? '✅ 启用' : '❌ 禁用'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" color="text.secondary">邮件通知</Typography>
                                    <Typography variant="body2">{tenant?.settings?.emailNotifications ? '✅ 启用' : '❌ 禁用'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" color="text.secondary">默认税率</Typography>
                                    <Typography variant="body2">{tenant?.settings?.defaultRate || 20}%</Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        // 编辑/新增模式 - 显示步骤内容
                        renderStepContent(activeStep)
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 1.5 }}>
                {!isView ? (
                    <>
                        {activeStep > 0 && (
                            <Button onClick={handleBack} disabled={submitting}>
                                上一步
                            </Button>
                        )}
                        <Box sx={{ flex: 1 }} />
                        {activeStep < steps.length - 1 ? (
                            <Button variant="contained" onClick={handleNext}>
                                下一步
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={submitting}
                                startIcon={submitting ? <CircularProgress size={16} /> : null}
                            >
                                {submitting ? '提交中...' : isEdit ? '保存修改' : '创建客户'}
                            </Button>
                        )}
                        <Button onClick={onClose} disabled={submitting}>
                            取消
                        </Button>
                    </>
                ) : (
                    <Button onClick={onClose}>关闭</Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default TenantForm;