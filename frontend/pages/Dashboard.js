// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Chip,
    Button,
    IconButton,
    Tooltip,
    LinearProgress,
    Card,
    CardContent
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    People as PeopleIcon,
    Description as DescriptionIcon,
    AttachMoney as AttachMoneyIcon,
    CheckCircle as CheckCircleIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Download as DownloadIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import { StatsCards, RecentActivity, CountryChart } from '../components/Dashboard';
import { fetchDashboardData } from '../store/slices/dashboardSlice';

function Dashboard() {
    const dispatch = useDispatch();
    const { data, loading } = useSelector((state) => state.dashboard || { data: null, loading: false });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setRefreshing(true);
        await dispatch(fetchDashboardData());
        setRefreshing(false);
    };

    // 模拟数据（实际从API获取）
    const stats = {
        totalTenants: data?.totalTenants || 12,
        monthlyTransactions: data?.monthlyTransactions || 3456,
        totalVAT: data?.totalVAT || 98765.43,
        successRate: data?.successRate || 98.5
    };

    const statCards = [
        {
            title: '总客户',
            value: stats.totalTenants,
            icon: <PeopleIcon sx={{ fontSize: 32, color: '#1976d2' }} />,
            color: '#1976d2',
            change: 12,
            changeLabel: '较上月'
        },
        {
            title: '本月交易',
            value: stats.monthlyTransactions.toLocaleString(),
            icon: <DescriptionIcon sx={{ fontSize: 32, color: '#2e7d32' }} />,
            color: '#2e7d32',
            change: 8,
            changeLabel: '较上月'
        },
        {
            title: 'VAT总额',
            value: `€${stats.totalVAT.toFixed(2)}`,
            icon: <AttachMoneyIcon sx={{ fontSize: 32, color: '#ed6c02' }} />,
            color: '#ed6c02',
            change: 5,
            changeLabel: '较上月'
        },
        {
            title: '处理成功率',
            value: `${stats.successRate}%`,
            icon: <CheckCircleIcon sx={{ fontSize: 32, color: '#9c27b0' }} />,
            color: '#9c27b0',
            change: 2,
            changeLabel: '较上月',
            progress: stats.successRate,
            progressLabel: '成功率'
        }
    ];

    const recentActivities = [
        {
            id: 1,
            type: 'upload',
            user: '张伟',
            action: '上传了 3 个文件',
            detail: 'Amazon销售报告.csv, eBay交易记录.xlsx, Shopify订单.json',
            timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
            target: '客户管理'
        },
        {
            id: 2,
            type: 'success',
            user: '系统',
            action: '生成VAT申报报告',
            detail: '2024年7月 英国VAT申报 已生成',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            target: '报告中心'
        },
        {
            id: 3,
            type: 'warning',
            user: '李娜',
            action: 'VAT号验证失败',
            detail: 'DE123456789 在VIES系统中未找到',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            target: '客户管理'
        },
        {
            id: 4,
            type: 'info',
            user: '系统',
            action: 'API同步完成',
            detail: '英国税局HMRC数据同步成功',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            target: '系统集成'
        },
        {
            id: 5,
            type: 'error',
            user: '王芳',
            action: '文件解析失败',
            detail: '文件格式不正确，请检查CSV格式',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            target: '文件上传'
        }
    ];

    const countryData = [
        { country: 'GB', value: 12500, label: '英国' },
        { country: 'DE', value: 8900, label: '德国' },
        { country: 'FR', value: 7200, label: '法国' },
        { country: 'IT', value: 4300, label: '意大利' },
        { country: 'ES', value: 2800, label: '西班牙' },
        { country: 'NL', value: 1600, label: '荷兰' },
        { country: 'BE', value: 1200, label: '比利时' },
        { country: 'AT', value: 800, label: '奥地利' }
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面头部 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        📊 概览看板
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        系统运行状态与VAT申报数据总览
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="导出报表">
                        <IconButton size="small">
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="打印">
                        <IconButton size="small">
                            <PrintIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="刷新数据">
                        <IconButton size="small" onClick={loadDashboardData} disabled={refreshing}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* 加载状态 */}
            {(loading || refreshing) && <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />}

            {/* 统计卡片 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {statCards.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <StatsCards {...stat} />
                    </Grid>
                ))}
            </Grid>

            {/* 图表和活动 */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <CountryChart
                        data={countryData}
                        title="国家分布"
                        maxItems={8}
                        onRefresh={loadDashboardData}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RecentActivity
                        activities={recentActivities}
                        maxItems={5}
                        onRefresh={loadDashboardData}
                    />
                </Grid>
            </Grid>

            {/* 快速操作 */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontSize: '2.5rem' }}>
                                📤
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                上传文件
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                上传交易数据文件
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontSize: '2.5rem' }}>
                                📄
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                生成报告
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                生成VAT申报报告
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontSize: '2.5rem' }}>
                                👥
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                客户管理
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                管理客户信息
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontSize: '2.5rem' }}>
                                ⚙️
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                系统设置
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                配置系统参数
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Dashboard;