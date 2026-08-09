// frontend/src/components/Tenants/TenantDetail.js
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Grid,
    Chip,
    Divider,
    Button,
    IconButton,
    Avatar,
    Card,
    CardContent,
    Paper,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Business as BusinessIcon,
    Public as PublicIcon,
    Receipt as ReceiptIcon,
    Description as DescriptionIcon,
    TrendingUp as TrendingUpIcon,
    AttachMoney as AttachMoneyIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    FileCopy as FileCopyIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { StatsCards } from '../Dashboard';

/**
 * 客户详情组件
 * @param {Object} props
 * @param {boolean} props.open - 是否打开
 * @param {Object} props.tenant - 客户数据
 * @param {Function} props.onClose - 关闭回调
 * @param {Function} props.onEdit - 编辑回调
 * @param {Function} props.onRefresh - 刷新回调
 */
function TenantDetail({
    open = false,
    tenant = null,
    onClose,
    onEdit,
    onRefresh
}) {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalTransactions: 0,
        totalVAT: 0,
        totalNet: 0,
        successRate: 0,
        pendingCount: 0
    });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [recentReports, setRecentReports] = useState([]);

    // 模拟加载数据
    useEffect(() => {
        if (open && tenant) {
            setLoading(true);
            // 模拟API调用
            setTimeout(() => {
                setStats({
                    totalTransactions: Math.floor(Math.random() * 1000) + 100,
                    totalVAT: Math.floor(Math.random() * 10000) + 1000,
                    totalNet: Math.floor(Math.random() * 50000) + 5000,
                    successRate: 95 + Math.random() * 4,
                    pendingCount: Math.floor(Math.random() * 20)
                });
                setRecentTransactions([
                    { id: 1, orderId: 'ORD-001', country: 'GB', amount: 150.00, vat: 30.00, date: '2024-07-20' },
                    { id: 2, orderId: 'ORD-002', country: 'DE', amount: 220.50, vat: 41.90, date: '2024-07-19' },
                    { id: 3, orderId: 'ORD-003', country: 'FR', amount: 98.00, vat: 19.60, date: '2024-07-18' },
                    { id: 4, orderId: 'ORD-004', country: 'IT', amount: 345.00, vat: 75.90, date: '2024-07-17' },
                    { id: 5, orderId: 'ORD-005', country: 'ES', amount: 120.00, vat: 25.20, date: '2024-07-16' }
                ]);
                setRecentReports([
                    { id: 1, name: '2024年7月VAT申报', period: '2024-07', status: 'completed', totalVAT: 1245.60, createdAt: '2024-07-20' },
                    { id: 2, name: '2024年6月VAT申报', period: '2024-06', status: 'completed', totalVAT: 987.30, createdAt: '2024-06-20' },
                    { id: 3, name: '2024年5月VAT申报', period: '2024-05', status: 'draft', totalVAT: 0, createdAt: '2024-05-25' }
                ]);
                setLoading(false);
            }, 500);
        }
    }, [open, tenant]);

    if (!tenant) return null;

    // 获取状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'default';
            case 'deleted': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    // 获取状态标签
    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return '✅ 活跃';
            case 'inactive': return '⛔ 停用';
            case 'deleted': return '🗑️ 已删除';
            case 'pending': return '⏳ 待审核';
            default: return status || '未知';
        }
    };

    // 获取国家旗帜
    const getCountryFlag = (country) => {
        const flags = {
            'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸',
            'AT': '🇦🇹', 'BE': '🇧🇪', 'BG': '🇧🇬', 'HR': '🇭🇷', 'CY': '🇨🇾',
            'CZ': '🇨🇿', 'DK': '🇩🇰', 'EE': '🇪🇪', 'FI': '🇫🇮', 'GR': '🇬🇷',
            'HU': '🇭🇺', 'IE': '🇮🇪', 'LV': '🇱🇻', 'LT': '🇱🇹', 'LU': '🇱🇺',
            'MT': '🇲🇹', 'NL': '🇳🇱', 'PL': '🇵🇱', 'PT': '🇵🇹', 'RO': '🇷🇴',
            'SK': '🇸🇰', 'SI': '🇸🇮', 'SE': '🇸🇪'
        };
        return flags[country] || '🌍';
    };

    // 格式化货币
    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '€0.00';
        return `€${Number(value).toFixed(2)}`;
    };

    // 格式化时间
    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            return format(date, 'yyyy-MM-dd');
        } catch {
            return timestamp;
        }
    };

    // 获取头像颜色
    const getAvatarColor = (name) => {
        const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'];
        const index = name?.length % colors.length || 0;
        return colors[index];
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { height: '90vh', maxHeight: '90vh' }
            }}
        >
            {/* 头部 */}
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            sx={{
                                bgcolor: getAvatarColor(tenant.name),
                                width: 44,
                                height: 44,
                                fontSize: '1.125rem'
                            }}
                        >
                            {tenant.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {tenant.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {tenant.email}
                                </Typography>
                                <Chip
                                    label={getStatusLabel(tenant.status)}
                                    color={getStatusColor(tenant.status)}
                                    size="small"
                                    sx={{ '& .MuiChip-label': { fontSize: '0.7rem' } }}
                                />
                            </Box>
                        </Box>
                    </Box>
                    <Box>
                        {onEdit && (
                            <Tooltip title="编辑客户">
                                <IconButton onClick={() => onEdit(tenant)}>
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {onRefresh && (
                            <Tooltip title="刷新">
                                <IconButton onClick={onRefresh}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <IconButton onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>

            {/* 内容 */}
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {loading && <LinearProgress />}

                <Box sx={{ p: 3 }}>
                    {/* 统计卡片 */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatsCards
                                title="总交易"
                                value={stats.totalTransactions}
                                icon={<ReceiptIcon />}
                                color="#1976d2"
                                change={12}
                                changeLabel="较上月"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatsCards
                                title="净销售额"
                                value={formatCurrency(stats.totalNet)}
                                icon={<AttachMoneyIcon />}
                                color="#2e7d32"
                                change={8}
                                changeLabel="较上月"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatsCards
                                title="VAT总额"
                                value={formatCurrency(stats.totalVAT)}
                                icon={<TrendingUpIcon />}
                                color="#ed6c02"
                                change={5}
                                changeLabel="较上月"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatsCards
                                title="成功率"
                                value={`${stats.successRate.toFixed(1)}%`}
                                icon={<CheckCircleIcon />}
                                color="#9c27b0"
                                progress={stats.successRate}
                                progressLabel="成功率"
                            />
                        </Grid>
                    </Grid>

                    {/* Tabs */}
                    <Paper sx={{ mb: 2 }}>
                        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                            <Tab label="📋 基本信息" />
                            <Tab label="📊 交易记录" />
                            <Tab label="📄 申报报告" />
                            <Tab label="⚙️ 系统配置" />
                        </Tabs>
                    </Paper>

                    {/* Tab内容 */}
                    {activeTab === 0 && (
                        <Paper sx={{ p: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">客户ID</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                                        {tenant.tenantId}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">客户名称</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {tenant.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">邮箱地址</Typography>
                                    <Typography variant="body1">{tenant.email}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">公司名称</Typography>
                                    <Typography variant="body1">{tenant.company || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        国家 {getCountryFlag(tenant.country)}
                                    </Typography>
                                    <Typography variant="body1">{tenant.country}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">VAT号码</Typography>
                                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                        {tenant.vatNumber || '-'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="caption" color="text.secondary">创建时间</Typography>
                                    <Typography variant="body2">
                                        {formatTime(tenant.createdAt)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    {activeTab === 1 && (
                        <Paper sx={{ p: 0, overflow: 'hidden' }}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>订单号</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>国家</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>金额</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>VAT</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>日期</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recentTransactions.map((tx) => (
                                            <TableRow key={tx.id} hover>
                                                <TableCell>{tx.orderId}</TableCell>
                                                <TableCell>
                                                    <Chip label={tx.country} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell align="right">{formatCurrency(tx.amount)}</TableCell>
                                                <TableCell align="right" sx={{ color: 'secondary.main' }}>
                                                    {formatCurrency(tx.vat)}
                                                </TableCell>
                                                <TableCell>{tx.date}</TableCell>
                                            </TableRow>
                                        ))}
                                        {recentTransactions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                                    <Typography color="text.secondary">暂无交易记录</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Button size="small" color="primary">
                                    查看全部交易
                                </Button>
                            </Box>
                        </Paper>
                    )}

                    {activeTab === 2 && (
                        <Paper sx={{ p: 0, overflow: 'hidden' }}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>报告名称</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>申报期间</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>VAT总额</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>生成时间</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recentReports.map((report) => (
                                            <TableRow key={report.id} hover>
                                                <TableCell>{report.name}</TableCell>
                                                <TableCell>{report.period}</TableCell>
                                                <TableCell align="right">
                                                    {report.totalVAT > 0 ? formatCurrency(report.totalVAT) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={report.status === 'completed' ? '✅ 完成' : '📝 草稿'}
                                                        color={report.status === 'completed' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{formatTime(report.createdAt)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {recentReports.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                                    <Typography color="text.secondary">暂无申报报告</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Button size="small" color="primary">
                                    查看全部报告
                                </Button>
                            </Box>
                        </Paper>
                    )}

                    {activeTab === 3 && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>系统设置</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">自动处理上传文件</Typography>
                                        <Chip
                                            label={tenant.settings?.autoProcess ? '✅ 启用' : '❌ 禁用'}
                                            color={tenant.settings?.autoProcess ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">邮件通知</Typography>
                                        <Chip
                                            label={tenant.settings?.emailNotifications ? '✅ 启用' : '❌ 禁用'}
                                            color={tenant.settings?.emailNotifications ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">默认税率</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {tenant.settings?.defaultRate || 20}%
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">货币</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {tenant.settings?.currency || 'EUR'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>税务配置</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">OSS申报</Typography>
                                        <Chip
                                            label={tenant.taxConfig?.ossEnabled ? '✅ 启用' : '❌ 禁用'}
                                            color={tenant.taxConfig?.ossEnabled ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">MTD (英国)</Typography>
                                        <Chip
                                            label={tenant.taxConfig?.mtdEnabled ? '✅ 启用' : '❌ 禁用'}
                                            color={tenant.taxConfig?.mtdEnabled ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">VIES验证</Typography>
                                        <Chip
                                            label={tenant.taxConfig?.viesValidation ? '✅ 启用' : '❌ 禁用'}
                                            color={tenant.taxConfig?.viesValidation ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">默认申报周期</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {tenant.taxConfig?.defaultPeriod || '每月'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}
                </Box>
            </DialogContent>

            {/* 底部 */}
            <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        客户ID: {tenant.tenantId} | 创建于: {formatTime(tenant.createdAt)}
                    </Typography>
                </Box>
                <Button onClick={onClose}>关闭</Button>
            </DialogActions>
        </Dialog>
    );
}

export default TenantDetail;