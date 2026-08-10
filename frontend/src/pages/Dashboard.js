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
    console.log('📊 Dashboard 组件已渲染');
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        totalTenants: 0,
        totalFilings: 0,
        totalTransactions: 0,
        recentActivities: [],
        vatTrend: [],
        countryDistribution: {}
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('🚀 Dashboard 组件已挂载 - 版本 2026-08-10');
        loadData();
    }, []);

    const loadData = async () => {
        console.log('🔄 开始加载 Dashboard 数据...');
        setLoading(true);
        setError(null);
        
        try {
            console.log('📡 调用 dashboardAPI.getDashboard()...');
            const result = await dashboardAPI.getDashboard();
            console.log('📊 API 返回原始数据:', result);
            
            if (result && result.success) {
                const rawData = result.data || {};
                console.log('📦 rawData:', rawData);
                console.log('📦 rawData.totalTenants:', rawData.totalTenants);
                
                const mappedData = {
                    totalTenants: rawData.totalTenants || 0,
                    totalFilings: rawData.totalFilings || 0,
                    totalTransactions: rawData.totalTransactions || 0,
                    recentActivities: rawData.recentActivities || [],
                    vatTrend: rawData.vatTrend || [],
                    countryDistribution: rawData.countryDistribution || {}
                };
                
                console.log('✅ 映射后的数据:', mappedData);
                setData(mappedData);
            } else {
                console.error('❌ API 返回失败:', result);
                setError(result?.error || '加载失败');
            }
        } catch (err) {
            console.error('❌ 加载异常:', err);
            setError('网络错误，请检查后端服务');
        } finally {
            setLoading(false);
            console.log('🏁 加载完成');
        }
    };

    // 统计卡片配置
    const stats = [
        {
            title: '租户总数',
            value: data.totalTenants,
            icon: <PeopleIcon sx={{ fontSize: 32, color: '#1976d2' }} />,
            color: '#e3f2fd',
            bgColor: '#1976d2',
            subtitle: '活跃租户'
        },
        {
            title: '申报总数',
            value: data.totalFilings,
            icon: <AssessmentIcon sx={{ fontSize: 32, color: '#2e7d32' }} />,
            color: '#e8f5e9',
            bgColor: '#2e7d32',
            subtitle: '已完成'
        },
        {
            title: '交易总数',
            value: data.totalTransactions,
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

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>加载数据中...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={loadData}
                >
                    重试
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    📊 概览看板
                </Typography>
                <Chip 
                    label={`数据更新时间: ${new Date().toLocaleString()}`} 
                    size="small" 
                    variant="outlined" 
                />
            </Box>

            {/* 调试信息 - 显示数据状态 */}
            <Alert severity="info" sx={{ mb: 2 }}>
                数据状态: 租户 {data.totalTenants} 个, 申报 {data.totalFilings} 个, 交易 {data.totalTransactions} 个
            </Alert>

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
                        {data.recentActivities && data.recentActivities.length > 0 ? (
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
                            <Typography variant="body2">VATFlow v3.0.1</Typography>
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
                            <Typography variant="body2" fontWeight="bold">{data.totalTenants}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Dashboard;