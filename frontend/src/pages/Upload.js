// frontend/src/pages/Upload.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Divider,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tab,
    Tabs,
    LinearProgress,
    Snackbar
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    Assessment as AssessmentIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Cancel as CancelIcon,
    Print as PrintIcon,
    TableChart as ExcelIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    People as PeopleIcon,
    Public as PublicIcon,
    Timeline as TimelineIcon,
    Receipt as ReceiptIcon,
    GetApp as DownloadIcon,
    Close as CloseIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { fileAPI, tenantAPI, transactionAPI, taxAPI, reportAPI } from '../services/api';

// ===== 平台列表（20个）=====
const PLATFORMS = [
    { id: 'amazon', name: 'Amazon', icon: '🛒' },
    { id: 'ebay', name: 'eBay', icon: '📦' },
    { id: 'aliexpress', name: 'AliExpress', icon: '🌐' },
    { id: 'allegro', name: 'Allegro', icon: '🛍️' },
    { id: 'shopify', name: 'Shopify', icon: '🛍️' },
    { id: 'etsy', name: 'Etsy', icon: '🎨' },
    { id: 'walmart', name: 'Walmart', icon: '🏪' },
    { id: 'target', name: 'Target', icon: '🎯' },
    { id: 'zalando', name: 'Zalando', icon: '👗' },
    { id: 'lazada', name: 'Lazada', icon: '🛒' },
    { id: 'shopee', name: 'Shopee', icon: '🏷️' },
    { id: 'temu', name: 'Temu', icon: '🛍️' },
    { id: 'shein', name: 'SHEIN', icon: '👚' },
    { id: 'tiktok', name: 'TikTok Shop', icon: '🎵' },
    { id: 'depop', name: 'Depop', icon: '👕' },
    { id: 'mercari', name: 'Mercari', icon: '🛍️' },
    { id: 'poshmark', name: 'Poshmark', icon: '👗' },
    { id: 'rakuten', name: 'Rakuten', icon: '🛒' },
    { id: 'wish', name: 'Wish', icon: '🎁' },
    { id: 'yahoo', name: 'Yahoo Shopping', icon: '🔍' },
];

// ===== 国家列表（43个）=====
const COUNTRIES = [
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
    { code: 'RU', name: '俄罗斯', flag: '🇷🇺', taxRate: 20 },
    { code: 'JP', name: '日本', flag: '🇯🇵', taxRate: 10 },
    { code: 'CN', name: '中国', flag: '🇨🇳', taxRate: 13 },
    { code: 'KR', name: '韩国', flag: '🇰🇷', taxRate: 10 },
    { code: 'SG', name: '新加坡', flag: '🇸🇬', taxRate: 9 },
    { code: 'MY', name: '马来西亚', flag: '🇲🇾', taxRate: 8 },
    { code: 'TH', name: '泰国', flag: '🇹🇭', taxRate: 7 },
    { code: 'VN', name: '越南', flag: '🇻🇳', taxRate: 10 },
    { code: 'ID', name: '印度尼西亚', flag: '🇮🇩', taxRate: 11 },
    { code: 'PH', name: '菲律宾', flag: '🇵🇭', taxRate: 12 },
    { code: 'IN', name: '印度', flag: '🇮🇳', taxRate: 18 },
    { code: 'HK', name: '香港', flag: '🇭🇰', taxRate: 0 },
    { code: 'TW', name: '台湾', flag: '🇹🇼', taxRate: 5 },
    { code: 'US', name: '美国', flag: '🇺🇸', taxRate: 0 },
    { code: 'CA', name: '加拿大', flag: '🇨🇦', taxRate: 5 },
    { code: 'MX', name: '墨西哥', flag: '🇲🇽', taxRate: 16 },
    { code: 'BR', name: '巴西', flag: '🇧🇷', taxRate: 17 },
    { code: 'AR', name: '阿根廷', flag: '🇦🇷', taxRate: 21 },
    { code: 'AU', name: '澳大利亚', flag: '🇦🇺', taxRate: 10 },
    { code: 'NZ', name: '新西兰', flag: '🇳🇿', taxRate: 15 },
    { code: 'ZA', name: '南非', flag: '🇿🇦', taxRate: 15 },
    { code: 'NG', name: '尼日利亚', flag: '🇳🇬', taxRate: 7.5 },
    { code: 'EG', name: '埃及', flag: '🇪🇬', taxRate: 14 },
    { code: 'AE', name: '阿联酋', flag: '🇦🇪', taxRate: 5 },
    { code: 'SA', name: '沙特阿拉伯', flag: '🇸🇦', taxRate: 15 },
    { code: 'IL', name: '以色列', flag: '🇮🇱', taxRate: 17 },
    { code: 'TR', name: '土耳其', flag: '🇹🇷', taxRate: 18 },
];

// ===== 平台配置 =====
const PLATFORM_CONFIG = {
    // 多国家统一报表（自动识别国家）
    amazon: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '支持欧洲站统一报表，自动识别订单国家' },
    ebay: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '根据站点自动识别国家' },
    aliexpress: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '根据订单中的国家字段自动识别' },
    etsy: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '根据订单中的国家字段自动识别' },
    wish: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '根据订单中的国家字段自动识别' },
    temu: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '根据订单中的国家字段自动识别' },
    shein: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '根据订单中的国家字段自动识别' },
    depop: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '根据订单中的国家字段自动识别' },
    zalando: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '欧洲多国数据，自动识别国家' },
    tiktok: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '根据站点自动识别国家' },
    lazada: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '支持新加坡、马来西亚、泰国、越南、菲律宾、印尼' },
    shopee: { countryMode: 'auto', multiCountry: true, defaultCountry: null, note: '支持新加坡、马来西亚、泰国、越南、菲律宾、印尼、台湾' },
    // 单国家平台
    shopify: { countryMode: 'manual', multiCountry: false, defaultCountry: 'GB', note: '按店铺国家选择' },
    walmart: { countryMode: 'manual', multiCountry: false, defaultCountry: 'US', note: '美国市场' },
    target: { countryMode: 'manual', multiCountry: false, defaultCountry: 'US', note: '美国市场' },
    allegro: { countryMode: 'manual', multiCountry: false, defaultCountry: 'PL', note: '波兰市场' },
    rakuten: { countryMode: 'manual', multiCountry: false, defaultCountry: 'JP', note: '日本市场' },
    yahoo: { countryMode: 'manual', multiCountry: false, defaultCountry: 'JP', note: '日本市场' },
    mercari: { countryMode: 'manual', multiCountry: false, defaultCountry: 'JP', note: '日本市场' },
    poshmark: { countryMode: 'manual', multiCountry: false, defaultCountry: 'US', note: '美国/加拿大市场' },
    pva: { countryMode: 'manual', multiCountry: false, defaultCountry: 'GB', note: '通用格式，需选择国家' },
};

// ===== 年份和季度 =====
const YEARS = ['2024', '2025', '2026', '2027', '2028'];
const MONTHS = [
    { value: '01', label: '1月' },
    { value: '02', label: '2月' },
    { value: '03', label: '3月' },
    { value: '04', label: '4月' },
    { value: '05', label: '5月' },
    { value: '06', label: '6月' },
    { value: '07', label: '7月' },
    { value: '08', label: '8月' },
    { value: '09', label: '9月' },
    { value: '10', label: '10月' },
    { value: '11', label: '11月' },
    { value: '12', label: '12月' },
];

const QUARTERS = [
    { value: 'Q1', label: 'Q1 (1-3月)', months: ['01', '02', '03'] },
    { value: 'Q2', label: 'Q2 (4-6月)', months: ['04', '05', '06'] },
    { value: 'Q3', label: 'Q3 (7-9月)', months: ['07', '08', '09'] },
    { value: 'Q4', label: 'Q4 (10-12月)', months: ['10', '11', '12'] },
];

// ===== 获取平台配置 =====
const getPlatformConfig = (platformId) => {
    return PLATFORM_CONFIG[platformId] || { countryMode: 'manual', multiCountry: false, defaultCountry: 'GB' };
};

function Upload() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [selectedYear, setSelectedYear] = useState('2026');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedQuarter, setSelectedQuarter] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [checkResult, setCheckResult] = useState(null);
    const [openPreview, setOpenPreview] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [activeTab, setActiveTab] = useState(0);

    // ===== 加载租户列表 =====
    useEffect(() => {
        loadTenants();
        loadUploadedFiles();
    }, []);

    const loadTenants = async () => {
        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            const response = await fetch('https://api.vatapex.com/api/v1/tenants', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || '',
                    'X-User-Role': userRole
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📥 租户列表:', result);
            
            if (result && result.success) {
                setTenants(result.data || []);
            } else {
                setTenants([]);
            }
        } catch (err) {
            console.error('❌ 加载租户失败:', err);
            setTenants([]);
        }
    };

    const loadUploadedFiles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            const response = await fetch('https://api.vatapex.com/api/v1/files', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || '',
                    'X-User-Role': userRole
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            if (result && result.success) {
                setUploadedFiles(result.data || []);
            }
        } catch (err) {
            console.error('❌ 加载文件失败:', err);
        } finally {
            setLoading(false);
        }
    };

    // ===== 获取租户名称 =====
    const getTenantName = (id) => {
        const tenant = tenants.find(t => t.id === id || t.tenant_id === id);
        return tenant ? tenant.name || tenant.company || id : id;
    };

    // ===== 获取国家信息 =====
    const getCountryInfo = (code) => {
        return COUNTRIES.find(c => c.code === code);
    };

    // ===== 获取平台名称 =====
    const getPlatformName = (id) => {
        const platform = PLATFORMS.find(p => p.id === id);
        return platform ? `${platform.icon} ${platform.name}` : id;
    };

    // ===== 获取平台配置 =====
    const getPlatformConfig = (platformId) => {
        return PLATFORM_CONFIG[platformId] || { countryMode: 'manual', multiCountry: false, defaultCountry: 'GB' };
    };

    // ===== 处理文件上传 =====
    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        if (!selectedTenant || !selectedPlatform || !selectedYear || !selectedMonth) {
            setError('请选择客户、平台、年份和月份');
            setSnackbar({ open: true, message: '请完善上传信息', severity: 'warning' });
            return;
        }

        // 如果是手动选择国家的平台，检查是否选择了国家
        const platformConfig = getPlatformConfig(selectedPlatform);
        if (platformConfig.countryMode === 'manual' && !selectedCountry) {
            setError('请选择国家');
            setSnackbar({ open: true, message: '请选择国家', severity: 'warning' });
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            formData.append('tenantId', selectedTenant);
            formData.append('platform', selectedPlatform);
            formData.append('year', selectedYear);
            formData.append('month', selectedMonth);
            
            // 只有手动模式才传递国家
            if (platformConfig.countryMode === 'manual') {
                formData.append('country', selectedCountry);
            }

            const response = await fetch('https://api.vatapex.com/api/v1/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || '',
                    'X-User-Role': userRole
                },
                body: formData
            });

            const result = await response.json();
            console.log('📥 上传结果:', result);
            
            if (result && result.success) {
                setSuccess(true);
                const countries = result.data?.countries || {};
                const countryList = Object.keys(countries).map(c => 
                    `${getCountryInfo(c)?.flag || ''} ${c}: ${countries[c].count}条`
                ).join(', ');
                
                setSnackbar({
                    open: true,
                    message: `✅ 上传成功！${result.data?.processed || 0} 条记录，${countryList || ''}`,
                    severity: 'success'
                });
                loadUploadedFiles();
                event.target.value = '';
            } else {
                setError(result?.error || '上传失败');
                setSnackbar({ open: true, message: result?.error || '上传失败', severity: 'error' });
            }
        } catch (err) {
            console.error('❌ 上传失败:', err);
            setError('上传失败，请重试');
            setSnackbar({ open: true, message: '上传失败，请重试', severity: 'error' });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // ===== 执行季度核对 =====
    const handleQuarterCheck = async () => {
        if (!selectedTenant || !selectedPlatform || !selectedYear || !selectedQuarter) {
            setError('请选择客户、平台、年份和季度');
            return;
        }

        setLoading(true);
        setError(null);
        setCheckResult(null);

        try {
            const quarterMonths = QUARTERS.find(q => q.value === selectedQuarter)?.months || [];
            
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            const responses = await Promise.all(
                quarterMonths.map(async (month) => {
                    const url = `https://api.vatapex.com/api/v1/files?tenantId=${selectedTenant}&platform=${selectedPlatform}&year=${selectedYear}&month=${month}`;
                    const response = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-Tenant-ID': tenantId || '',
                            'X-User-Role': userRole
                        }
                    });
                    const result = await response.json();
                    return { month, data: result };
                })
            );

            const allData = responses.map(r => r.data?.data || []);
            const summary = generateQuarterSummary(allData);

            setCheckResult(summary);
            setOpenPreview(true);

        } catch (err) {
            console.error('❌ 季度核对失败:', err);
            setError(err.message || '季度核对失败');
        } finally {
            setLoading(false);
        }
    };

    // ===== 生成季度汇总 =====
    const generateQuarterSummary = (data) => {
        let totalNet = 0, totalVAT = 0, totalGross = 0, totalOrders = 0;
        const monthsData = {};

        data.forEach((monthData, index) => {
            const month = (index + 1).toString().padStart(2, '0');
            let monthNet = 0, monthVAT = 0, monthGross = 0, monthOrders = 0;

            if (monthData && monthData.length) {
                monthData.forEach(item => {
                    const net = item.net_amount || item.amount || 0;
                    const vat = item.vat_amount || item.vat || 0;
                    monthNet += net;
                    monthVAT += vat;
                    monthGross += net + vat;
                    monthOrders += 1;
                });
            }

            monthsData[month] = { net: monthNet, vat: monthVAT, gross: monthGross, orders: monthOrders };
            totalNet += monthNet;
            totalVAT += monthVAT;
            totalGross += monthGross;
            totalOrders += monthOrders;
        });

        return {
            tenantId: selectedTenant,
            tenantName: getTenantName(selectedTenant),
            platform: selectedPlatform,
            platformName: getPlatformName(selectedPlatform),
            year: selectedYear,
            quarter: selectedQuarter,
            summary: { totalNet, totalVAT, totalGross, totalOrders },
            monthsData,
            recordCount: data.reduce((sum, d) => sum + (d?.length || 0), 0),
            generatedAt: new Date().toISOString()
        };
    };

    // ===== 导出报告 =====
    const handleExportReport = () => {
        if (!checkResult) return;
        const blob = new Blob([JSON.stringify(checkResult, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `季度核对报告_${selectedPlatform}_${selectedYear}${selectedQuarter}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ===== 删除文件 =====
    const handleDeleteFile = async (fileId) => {
        if (!confirm('确定要删除这个文件吗？')) return;
        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            await fetch(`https://api.vatapex.com/api/v1/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || '',
                    'X-User-Role': userRole
                }
            });
            loadUploadedFiles();
        } catch (err) {
            setError('删除失败');
        }
    };

    // ===== 获取平台配置 =====
    const selectedPlatformConfig = getPlatformConfig(selectedPlatform);
    const isAutoCountry = selectedPlatformConfig?.countryMode === 'auto';

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    📂 客户数据管理
                </Typography>
                <Chip label={`已上传 ${uploadedFiles.length} 个文件`} color="primary" variant="outlined" />
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>✅ 文件上传成功！</Alert>}

            <Grid container spacing={3}>
                {/* ===== 左侧：上传和核对区域 ===== */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
                            <Tab label="📤 上传数据" icon={<CloudUploadIcon />} />
                            <Tab label="📊 季度核对" icon={<AssessmentIcon />} />
                        </Tabs>

                        {/* ===== Tab 1: 上传数据 ===== */}
                        {activeTab === 0 && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>上传月度销售数据</Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    支持 CSV, Excel, PDF 格式
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>客户</InputLabel>
                                            <Select
                                                value={selectedTenant}
                                                onChange={(e) => setSelectedTenant(e.target.value)}
                                                label="客户"
                                            >
                                                <MenuItem value="">请选择客户</MenuItem>
                                                {tenants.map((t) => (
                                                    <MenuItem key={t.id || t.tenant_id} value={t.id || t.tenant_id}>
                                                        {t.name || t.company || t.email}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>平台</InputLabel>
                                            <Select
                                                value={selectedPlatform}
                                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                                label="平台"
                                            >
                                                <MenuItem value="">请选择平台</MenuItem>
                                                {PLATFORMS.map((p) => (
                                                    <MenuItem key={p.id} value={p.id}>
                                                        {p.icon} {p.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>年份</InputLabel>
                                            <Select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                                label="年份"
                                            >
                                                {YEARS.map((y) => (
                                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>月份</InputLabel>
                                            <Select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                label="月份"
                                            >
                                                <MenuItem value="">请选择月份</MenuItem>
                                                {MONTHS.map((m) => (
                                                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* 国家选择（仅手动模式显示） */}
                                    {!isAutoCountry && selectedPlatform && (
                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>国家</InputLabel>
                                                <Select
                                                    value={selectedCountry}
                                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                                    label="国家"
                                                >
                                                    <MenuItem value="">请选择国家</MenuItem>
                                                    {COUNTRIES.map((c) => (
                                                        <MenuItem key={c.code} value={c.code}>
                                                            {c.flag} {c.name} ({c.taxRate}%)
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    )}

                                    {/* 自动识别国家提示 */}
                                    {isAutoCountry && selectedPlatform && (
                                        <Grid item xs={12}>
                                            <Alert severity="info" icon={<InfoIcon />}>
                                                ℹ️ {selectedPlatformConfig?.note || '该平台支持自动识别订单国家'}
                                            </Alert>
                                        </Grid>
                                    )}

                                    <Grid item xs={12}>
                                        <Button
                                            variant="contained"
                                            component="label"
                                            fullWidth
                                            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                                            disabled={uploading || !selectedTenant || !selectedPlatform || !selectedYear || !selectedMonth}
                                            sx={{ py: 2 }}
                                        >
                                            {uploading ? `上传中 ${uploadProgress}%` : '选择文件上传'}
                                            <input type="file" hidden multiple onChange={handleFileUpload} accept=".csv,.xlsx,.xls,.pdf" />
                                        </Button>
                                        {uploading && (
                                            <Box sx={{ width: '100%', mt: 1 }}>
                                                <LinearProgress variant="determinate" value={uploadProgress} />
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* ===== Tab 2: 季度核对 ===== */}
                        {activeTab === 1 && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>季度核对</Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>客户</InputLabel>
                                            <Select
                                                value={selectedTenant}
                                                onChange={(e) => setSelectedTenant(e.target.value)}
                                                label="客户"
                                            >
                                                <MenuItem value="">请选择客户</MenuItem>
                                                {tenants.map((t) => (
                                                    <MenuItem key={t.id || t.tenant_id} value={t.id || t.tenant_id}>
                                                        {t.name || t.company || t.email}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>平台</InputLabel>
                                            <Select
                                                value={selectedPlatform}
                                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                                label="平台"
                                            >
                                                <MenuItem value="">请选择平台</MenuItem>
                                                {PLATFORMS.map((p) => (
                                                    <MenuItem key={p.id} value={p.id}>
                                                        {p.icon} {p.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>年份</InputLabel>
                                            <Select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                                label="年份"
                                            >
                                                {YEARS.map((y) => (
                                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>季度</InputLabel>
                                            <Select
                                                value={selectedQuarter}
                                                onChange={(e) => setSelectedQuarter(e.target.value)}
                                                label="季度"
                                            >
                                                <MenuItem value="">请选择季度</MenuItem>
                                                {QUARTERS.map((q) => (
                                                    <MenuItem key={q.value} value={q.value}>{q.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>国家（可选）</InputLabel>
                                            <Select
                                                value={selectedCountry}
                                                onChange={(e) => setSelectedCountry(e.target.value)}
                                                label="国家（可选）"
                                            >
                                                <MenuItem value="">全部国家</MenuItem>
                                                {COUNTRIES.map((c) => (
                                                    <MenuItem key={c.code} value={c.code}>
                                                        {c.flag} {c.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
                                            onClick={handleQuarterCheck}
                                            disabled={loading || !selectedTenant || !selectedPlatform || !selectedYear || !selectedQuarter}
                                            fullWidth
                                            sx={{ py: 1.5 }}
                                        >
                                            {loading ? '核对中...' : '执行季度核对'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* ===== 右侧：已上传文件列表 ===== */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">📋 已上传文件</Typography>
                            <IconButton size="small" onClick={loadUploadedFiles}><RefreshIcon /></IconButton>
                        </Box>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                        ) : uploadedFiles.length === 0 ? (
                            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>暂无上传文件</Typography>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>客户/平台</TableCell>
                                            <TableCell align="right">操作</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {uploadedFiles.slice(0, 10).map((file) => (
                                            <TableRow key={file.id}>
                                                <TableCell>
                                                    <Typography variant="caption" display="block">{getTenantName(file.tenant_id)}</Typography>
                                                    <Chip label={getPlatformName(file.platform)} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                                                    {file.country && (
                                                        <Chip label={file.country} size="small" variant="outlined" sx={{ fontSize: 10, ml: 0.5 }} />
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="删除">
                                                        <IconButton size="small" onClick={() => handleDeleteFile(file.id)}>
                                                            <DeleteIcon fontSize="small" color="error" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* ===== 季度核对结果弹窗 ===== */}
            <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">📊 季度核对报告</Typography>
                        <Box>
                            <IconButton onClick={handleExportReport}><DownloadIcon /></IconButton>
                            <IconButton onClick={() => setOpenPreview(false)}><CloseIcon /></IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {checkResult && (
                        <Box sx={{ pt: 1 }}>
                            <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">客户</Typography><Typography variant="body2">{checkResult.tenantName}</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">平台</Typography><Typography variant="body2">{checkResult.platformName}</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">期间</Typography><Typography variant="body2">{checkResult.year} {checkResult.quarter}</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">记录数</Typography><Typography variant="body2">{checkResult.recordCount} 条</Typography></Grid>
                                </Grid>
                            </Paper>

                            <Grid container spacing={2}>
                                <Grid item xs={4}><Card sx={{ bgcolor: '#e3f2fd' }}><CardContent sx={{ textAlign: 'center' }}><Typography variant="caption" color="text.secondary">净销售额</Typography><Typography variant="h6">€{checkResult.summary.totalNet.toFixed(2)}</Typography></CardContent></Card></Grid>
                                <Grid item xs={4}><Card sx={{ bgcolor: '#e8f5e9' }}><CardContent sx={{ textAlign: 'center' }}><Typography variant="caption" color="text.secondary">VAT</Typography><Typography variant="h6">€{checkResult.summary.totalVAT.toFixed(2)}</Typography></CardContent></Card></Grid>
                                <Grid item xs={4}><Card sx={{ bgcolor: '#fff3e0' }}><CardContent sx={{ textAlign: 'center' }}><Typography variant="caption" color="text.secondary">订单数</Typography><Typography variant="h6">{checkResult.summary.totalOrders}</Typography></CardContent></Card></Grid>
                            </Grid>

                            {Object.keys(checkResult.monthsData).length > 0 && (
                                <>
                                    <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>月度明细</Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead><TableRow><TableCell>月份</TableCell><TableCell align="right">净销售额</TableCell><TableCell align="right">VAT</TableCell><TableCell align="right">总金额</TableCell><TableCell align="right">订单数</TableCell></TableRow></TableHead>
                                            <TableBody>
                                                {Object.entries(checkResult.monthsData).map(([month, data]) => (
                                                    <TableRow key={month}>
                                                        <TableCell>{month}月</TableCell>
                                                        <TableCell align="right">€{data.net.toFixed(2)}</TableCell>
                                                        <TableCell align="right">€{data.vat.toFixed(2)}</TableCell>
                                                        <TableCell align="right">€{data.gross.toFixed(2)}</TableCell>
                                                        <TableCell align="right">{data.orders}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                                生成时间: {new Date(checkResult.generatedAt).toLocaleString()}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPreview(false)}>关闭</Button>
                    <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportReport}>导出报告</Button>
                </DialogActions>
            </Dialog>

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

export default Upload;