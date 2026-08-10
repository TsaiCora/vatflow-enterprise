// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Paper,
    LinearProgress,
    Alert,
    Chip,
    Divider,
    Avatar,
    Button
} from '@mui/material';
import {
    People as PeopleIcon,
    Receipt as ReceiptIcon,
    Assessment as AssessmentIcon,
    CheckCircle as CheckCircleIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { dashboardAPI } from '../services/api';

function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await dashboardAPI.getDashboard();
            console.log('📊 Dashboard 原始数据:', result);
            
            // ✅ 正确解析API返回的数据
            if (result && result.success) {
                const rawData = result.data || {};
                setData({
                    totalTenants: rawData.totalTenants || 0,
                    totalFilings: rawData.totalFilings || 0,
                    totalTransactions: rawData.totalTransactions || 0,
                    recentActivities: rawData.recentActivities || [],
                    vatTrend: rawData.vatTrend || [],
                    countryDistribution: rawData.countryDistribution || {}
                });
            } else {
                setError(result?.error || '加载失败');
            }
        } catch (err) {
            console.error('❌ 加载失败:', err);
            setError(typeof err === 'string' ? err : '网络错误，请检查后端');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>加载中...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={loadData}
                    sx={{ mt: 2 }}
                >
                    重试
                </Button>
            </Box>
        );
    }

    // 统计数据
    const stats = [
        {
            title: '租户总数',
            value: data?.totalTenants || 0,
            icon: <PeopleIcon sx={{ fontSize: 32, color: '#1976d2' }} />,
            color: '#e3f2fd',
            bgColor: '#1976d2',
            subtitle: '活跃租户'
        },
        {
            title: '申报总数',
            value: data?.totalFilings || 0,
            icon: <AssessmentIcon sx={{ fontSize: 32, color: '#2e7d32' }} />,
            color: '#e8f5e9',
            bgColor: '#2e7d32',
            subtitle: '已完成'
        },
        {
            title: '交易总数',
            value: data?.totalTransactions || 0,
            icon: <ReceiptIcon sx={{ fontSize: 32, color: '#ed6c02' }} />,
            color: '#fff3e0',
            bgColor: '#ed6c02',
            subtitle: '待处理'
        },
        {
            title: '系统状态',
            value: '✅ 正常',
            icon: <CheckCircleIcon sx={{ fontSize: 32, color: '#2e7d32' }} />,
            color: '#e8f5e9',
            bgColor: '#2e7d32',
            subtitle: '运行中'
        }
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    📊 概览看板
                </Typography>
                <Chip 
                    label={`更新于 ${new Date().toLocaleString()}`} 
                    size="small" 
                    variant="outlined" 
                />
            </Box>

            {/* 统计卡片 */}
            <Grid container spacing={3}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ 
                            bgcolor: stat.color,
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                            }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography color="text.secondary" sx={{ fontSize: 14, fontWeight: 500 }}>
                                            {stat.title}
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                                            {stat.value}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {stat.subtitle}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: stat.bgColor, width: 56, height: 56 }}>
                                        {stat.icon}
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* 详细信息 */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* 最近活动 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            📋 最近活动
                        </Typography>
                        {data?.recentActivities && data.recentActivities.length > 0 ? (
                            data.recentActivities.map((activity, index) => (
                                <Box key={index}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                                        <Typography variant="body2">
                                            {activity.type || activity.action || '活动'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {activity.created_at || activity.time || ''}
                                        </Typography>
                                    </Box>
                                    {index < data.recentActivities.length - 1 && <Divider />}
                                </Box>
                            ))
                        ) : (
                            <Typography color="text.secondary">暂无最近活动</Typography>
                        )}
                    </Paper>
                </Grid>

                {/* 系统信息 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            ℹ️ 系统信息
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography color="text.secondary">版本</Typography>
                            <Typography variant="body2">VATFlow v3.0</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography color="text.secondary">数据库</Typography>
                            <Typography variant="body2">Cloudflare D1</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography color="text.secondary">后端</Typography>
                            <Typography variant="body2">Cloudflare Workers</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography color="text.secondary">前端</Typography>
                            <Typography variant="body2">React + Cloudflare Pages</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography color="text.secondary">租户总数</Typography>
                            <Typography variant="body2" fontWeight="bold">{data?.totalTenants || 0}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Dashboard;