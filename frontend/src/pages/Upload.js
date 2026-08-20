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
// =============================================
// ===== 进口文件类型配置 =====
// =============================================
const IMPORT_FILE_TYPES = [
    // 欧洲
    { id: 'c79', country: 'GB', name: '英国', label: 'C79 进口增值税证书', icon: '📄' },
    { id: 'c88', country: 'GB', name: '英国', label: 'C88 海关清关单', icon: '📋' },
    { id: 'de_import', country: 'DE', name: '德国', label: 'Einkommensteuerbescheid', icon: '📄' },
    { id: 'fr_import', country: 'FR', name: '法国', label: 'Attestation de TVA', icon: '📄' },
    { id: 'it_import', country: 'IT', name: '意大利', label: 'Certificato IVA', icon: '📄' },
    { id: 'es_import', country: 'ES', name: '西班牙', label: 'Certificado de IVA', icon: '📄' },
    { id: 'nl_import', country: 'NL', name: '荷兰', label: 'BTW aangifte', icon: '📄' },
    { id: 'be_import', country: 'BE', name: '比利时', label: 'Certificat TVA', icon: '📄' },
    { id: 'pl_import', country: 'PL', name: '波兰', label: 'Deklaracja VAT', icon: '📄' },
    { id: 'se_import', country: 'SE', name: '瑞典', label: 'Momsbesked', icon: '📄' },
    { id: 'dk_import', country: 'DK', name: '丹麦', label: 'Momsangivelse', icon: '📄' },
    { id: 'fi_import', country: 'FI', name: '芬兰', label: 'ALV-ilmoitus', icon: '📄' },
    { id: 'ie_import', country: 'IE', name: '爱尔兰', label: 'VAT Return', icon: '📄' },
    { id: 'pt_import', country: 'PT', name: '葡萄牙', label: 'Declaração de IVA', icon: '📄' },
    { id: 'at_import', country: 'AT', name: '奥地利', label: 'UVA-Meldung', icon: '📄' },
    { id: 'no_import', country: 'NO', name: '挪威', label: 'MVA-melding', icon: '📄' },
    { id: 'ch_import', country: 'CH', name: '瑞士', label: 'MWST-Abrechnung', icon: '📄' },
    { id: 'ru_import', country: 'RU', name: '俄罗斯', label: 'НДС-декларация', icon: '📄' },
    // 亚洲
    { id: 'jp_import', country: 'JP', name: '日本', label: '消費税申告書', icon: '📄' },
    { id: 'kr_import', country: 'KR', name: '韩国', label: '부가가치세 신고서', icon: '📄' },
    { id: 'cn_import', country: 'CN', name: '中国', label: '增值税申报表', icon: '📄' },
    { id: 'sg_import', country: 'SG', name: '新加坡', label: 'GST Return', icon: '📄' },
    { id: 'my_import', country: 'MY', name: '马来西亚', label: 'SST Return', icon: '📄' },
    { id: 'th_import', country: 'TH', name: '泰国', label: 'ภาษีมูลค่าเพิ่ม', icon: '📄' },
    { id: 'vn_import', country: 'VN', name: '越南', label: 'Tờ khai thuế GTGT', icon: '📄' },
    { id: 'id_import', country: 'ID', name: '印度尼西亚', label: 'SPT PPN', icon: '📄' },
    { id: 'ph_import', country: 'PH', name: '菲律宾', label: 'VAT Return', icon: '📄' },
    { id: 'in_import', country: 'IN', name: '印度', label: 'GSTR-1', icon: '📄' },
    // 美洲
    { id: 'us_import', country: 'US', name: '美国', label: 'Sales Tax Return', icon: '📄' },
    { id: 'ca_import', country: 'CA', name: '加拿大', label: 'GST/HST Return', icon: '📄' },
    { id: 'mx_import', country: 'MX', name: '墨西哥', label: 'Declaración de IVA', icon: '📄' },
    { id: 'br_import', country: 'BR', name: '巴西', label: 'Declaração de ICMS', icon: '📄' },
    // 大洋洲
    { id: 'au_import', country: 'AU', name: '澳大利亚', label: 'BAS', icon: '📄' },
    { id: 'nz_import', country: 'NZ', name: '新西兰', label: 'GST Return', icon: '📄' },
    // 非洲
    { id: 'za_import', country: 'ZA', name: '南非', label: 'VAT Return', icon: '📄' },
    // 中东
    { id: 'ae_import', country: 'AE', name: '阿联酋', label: 'VAT Return', icon: '📄' },
    { id: 'tr_import', country: 'TR', name: '土耳其', label: 'KDV Beyannamesi', icon: '📄' },
];

// =============================================
// ===== 获取国家进口文件信息 =====
// =============================================
const getCountryImportInfo = (countryCode) => {
    const info = {
        GB: { vatProof: 'C79', customsDoc: 'C88 / CDS', authority: 'HMRC', period: '月度' },
        DE: { vatProof: 'Einkommensteuerbescheid', customsDoc: 'Zollanmeldung', authority: 'Bundeszentralamt für Steuern', period: '季度/月度' },
        FR: { vatProof: 'Attestation de TVA', customsDoc: 'Déclaration en douane', authority: 'Direction Générale des Douanes', period: '月度' },
        IT: { vatProof: 'Certificato IVA', customsDoc: 'Dichiarazione doganale', authority: 'Agenzia delle Dogane', period: '月度' },
        ES: { vatProof: 'Certificado de IVA', customsDoc: 'Documento de despacho', authority: 'Agencia Tributaria', period: '月度' },
        NL: { vatProof: 'BTW aangifte', customsDoc: 'Invoeraangifte', authority: 'Belastingdienst', period: '月度' },
        BE: { vatProof: 'Certificat TVA', customsDoc: 'Document douanier', authority: 'Service Public Fédéral Finances', period: '月度' },
        PL: { vatProof: 'Deklaracja VAT', customsDoc: 'Dokument celny', authority: 'Krajowa Administracja Skarbowa', period: '月度' },
        SE: { vatProof: 'Momsbesked', customsDoc: 'Tulldeklaration', authority: 'Skatteverket', period: '月度' },
        DK: { vatProof: 'Momsangivelse', customsDoc: 'Tolddeklaration', authority: 'Skattestyrelsen', period: '月度' },
        FI: { vatProof: 'ALV-ilmoitus', customsDoc: 'Tulli-ilmoitus', authority: 'Verohallinto', period: '月度' },
        IE: { vatProof: 'VAT Return', customsDoc: 'Customs Declaration', authority: 'Revenue Commissioners', period: '月度' },
        PT: { vatProof: 'Declaração de IVA', customsDoc: 'Declaração aduaneira', authority: 'Autoridade Tributária', period: '月度' },
        AT: { vatProof: 'UVA-Meldung', customsDoc: 'Zollanmeldung', authority: 'Finanzamt', period: '月度' },
        NO: { vatProof: 'MVA-melding', customsDoc: 'Tolldeklarasjon', authority: 'Skatteetaten', period: '月度' },
        CH: { vatProof: 'MWST-Abrechnung', customsDoc: 'Zollanmeldung', authority: 'Eidgenössische Steuerverwaltung', period: '季度' },
        RU: { vatProof: 'НДС-декларация', customsDoc: 'Таможенная декларация', authority: 'ФНС России', period: '季度' },
        JP: { vatProof: '消費税申告書', customsDoc: '輸入許可書', authority: '国税庁', period: '月度' },
        KR: { vatProof: '부가가치세 신고서', customsDoc: '수입신고서', authority: '국세청', period: '月度' },
        CN: { vatProof: '增值税申报表', customsDoc: '进口报关单', authority: '国家税务总局', period: '月度' },
        SG: { vatProof: 'GST Return', customsDoc: 'Import Declaration', authority: 'IRAS', period: '月度' },
        MY: { vatProof: 'SST Return', customsDoc: 'Import Declaration', authority: 'Royal Malaysian Customs', period: '月度' },
        TH: { vatProof: 'ภาษีมูลค่าเพิ่ม', customsDoc: 'ใบขนสินค้าขาเข้า', authority: 'กรมสรรพากร', period: '月度' },
        VN: { vatProof: 'Tờ khai thuế GTGT', customsDoc: 'Tờ khai hải quan', authority: 'Tổng cục Thuế', period: '月度' },
        ID: { vatProof: 'SPT PPN', customsDoc: 'Pemberitahuan Impor', authority: 'Direktorat Jenderal Pajak', period: '月度' },
        PH: { vatProof: 'VAT Return', customsDoc: 'Import Declaration', authority: 'Bureau of Internal Revenue', period: '月度' },
        IN: { vatProof: 'GSTR-1', customsDoc: 'Bill of Entry', authority: 'Central Board of Indirect Taxes', period: '月度' },
        US: { vatProof: 'Sales Tax Return', customsDoc: 'Customs Entry', authority: 'IRS / CBP', period: '月度' },
        CA: { vatProof: 'GST/HST Return', customsDoc: 'Customs Invoice', authority: 'CRA', period: '月度' },
        MX: { vatProof: 'Declaración de IVA', customsDoc: 'Pedimento de importación', authority: 'SAT', period: '月度' },
        BR: { vatProof: 'Declaração de ICMS', customsDoc: 'DI - Declaração de Importação', authority: 'Receita Federal', period: '月度' },
        AU: { vatProof: 'BAS', customsDoc: 'Import Declaration', authority: 'Australian Tax Office', period: '月度' },
        NZ: { vatProof: 'GST Return', customsDoc: 'Import Declaration', authority: 'Inland Revenue', period: '月度' },
        ZA: { vatProof: 'VAT Return', customsDoc: 'Customs Declaration', authority: 'SARS', period: '月度' },
        AE: { vatProof: 'VAT Return', customsDoc: 'Customs Declaration', authority: 'FTA', period: '月度' },
        TR: { vatProof: 'KDV Beyannamesi', customsDoc: 'Gümrük Beyannamesi', authority: 'Gelir İdaresi Başkanlığı', period: '月度' },
    };
    return info[countryCode.toUpperCase()] || null;
};

// =============================================
// ===== 在 Upload 组件中添加进口文件上传 Tab =====
// =============================================

// 在组件中添加以下状态
const [fileType, setFileType] = useState('sales'); // 'sales' | 'import'
const [selectedImportType, setSelectedImportType] = useState('');
const [importFileInfo, setImportFileInfo] = useState(null);

// 选择进口文件类型时更新信息
const handleImportTypeChange = (typeId) => {
    setSelectedImportType(typeId);
    const fileType = IMPORT_FILE_TYPES.find(t => t.id === typeId);
    if (fileType) {
        const info = getCountryImportInfo(fileType.country);
        setImportFileInfo({ ...fileType, ...info });
    }
};

// 在 Upload 组件的 Tabs 中添加
<Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
    <Tab label="📤 上传销售数据" icon={<CloudUploadIcon />} />
    <Tab label="📄 进口清关文件" icon={<AssessmentIcon />} />
    <Tab label="📊 季度核对" icon={<AssessmentIcon />} />
</Tabs>

// Tab 2: 进口清关文件上传
{activeTab === 1 && (
    <Box>
        <Typography variant="subtitle1" gutterBottom>上传进口VAT证明文件</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            支持各国进口VAT证明文件（C79、Einkommensteuerbescheid等）
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
                    <InputLabel>文件类型</InputLabel>
                    <Select
                        value={selectedImportType}
                        onChange={(e) => handleImportTypeChange(e.target.value)}
                        label="文件类型"
                    >
                        <MenuItem value="">请选择文件类型</MenuItem>
                        {IMPORT_FILE_TYPES.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                                {t.icon} {t.country} - {t.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {importFileInfo && (
                <>
                    <Grid item xs={12}>
                        <Alert severity="info" sx={{ mb: 1 }}>
                            <Typography variant="body2">
                                <strong>{importFileInfo.countryName}</strong> - {importFileInfo.vatProof}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                签发机构: {importFileInfo.authority} | 申报周期: {importFileInfo.period}
                            </Typography>
                        </Alert>
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
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>期间</InputLabel>
                            <Select
                                value={selectedQuarter}
                                onChange={(e) => setSelectedQuarter(e.target.value)}
                                label="期间"
                            >
                                <MenuItem value="">请选择期间</MenuItem>
                                {QUARTERS.map((q) => (
                                    <MenuItem key={q.value} value={q.value}>{q.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            component="label"
                            fullWidth
                            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                            disabled={uploading || !selectedTenant || !selectedImportType || !selectedYear || !selectedMonth}
                            sx={{ py: 2 }}
                        >
                            {uploading ? `上传中 ${uploadProgress}%` : `上传 ${importFileInfo.countryName} 进口文件`}
                            <input
                                type="file"
                                hidden
                                multiple
                                onChange={(e) => handleImportFileUpload(e)}
                                accept=".pdf,.xml,.csv,.xlsx,.xls"
                            />
                        </Button>
                    </Grid>
                </>
            )}
        </Grid>
    </Box>
)}
export default Upload;