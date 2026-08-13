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
    Refresh as RefreshIcon,
    Language as LanguageIcon,
    Storefront as StorefrontIcon
} from '@mui/icons-material';

// ===== 完整国家列表（43个）=====
const COUNTRIES = [
    { code: 'GB', name: '英国', flag: '🇬🇧' },
    { code: 'FR', name: '法国', flag: '🇫🇷' },
    { code: 'DE', name: '德国', flag: '🇩🇪' },
    { code: 'IT', name: '意大利', flag: '🇮🇹' },
    { code: 'ES', name: '西班牙', flag: '🇪🇸' },
    { code: 'NL', name: '荷兰', flag: '🇳🇱' },
    { code: 'BE', name: '比利时', flag: '🇧🇪' },
    { code: 'AT', name: '奥地利', flag: '🇦🇹' },
    { code: 'PL', name: '波兰', flag: '🇵🇱' },
    { code: 'SE', name: '瑞典', flag: '🇸🇪' },
    { code: 'DK', name: '丹麦', flag: '🇩🇰' },
    { code: 'FI', name: '芬兰', flag: '🇫🇮' },
    { code: 'IE', name: '爱尔兰', flag: '🇮🇪' },
    { code: 'PT', name: '葡萄牙', flag: '🇵🇹' },
    { code: 'NO', name: '挪威', flag: '🇳🇴' },
    { code: 'CH', name: '瑞士', flag: '🇨🇭' },
    { code: 'RU', name: '俄罗斯', flag: '🇷🇺' },
    { code: 'JP', name: '日本', flag: '🇯🇵' },
    { code: 'CN', name: '中国', flag: '🇨🇳' },
    { code: 'KR', name: '韩国', flag: '🇰🇷' },
    { code: 'SG', name: '新加坡', flag: '🇸🇬' },
    { code: 'MY', name: '马来西亚', flag: '🇲🇾' },
    { code: 'TH', name: '泰国', flag: '🇹🇭' },
    { code: 'VN', name: '越南', flag: '🇻🇳' },
    { code: 'ID', name: '印度尼西亚', flag: '🇮🇩' },
    { code: 'PH', name: '菲律宾', flag: '🇵🇭' },
    { code: 'IN', name: '印度', flag: '🇮🇳' },
    { code: 'HK', name: '香港', flag: '🇭🇰' },
    { code: 'TW', name: '台湾', flag: '🇹🇼' },
    { code: 'US', name: '美国', flag: '🇺🇸' },
    { code: 'CA', name: '加拿大', flag: '🇨🇦' },
    { code: 'MX', name: '墨西哥', flag: '🇲🇽' },
    { code: 'BR', name: '巴西', flag: '🇧🇷' },
    { code: 'AR', name: '阿根廷', flag: '🇦🇷' },
    { code: 'AU', name: '澳大利亚', flag: '🇦🇺' },
    { code: 'NZ', name: '新西兰', flag: '🇳🇿' },
    { code: 'ZA', name: '南非', flag: '🇿🇦' },
    { code: 'NG', name: '尼日利亚', flag: '🇳🇬' },
    { code: 'EG', name: '埃及', flag: '🇪🇬' },
    { code: 'AE', name: '阿联酋', flag: '🇦🇪' },
    { code: 'SA', name: '沙特阿拉伯', flag: '🇸🇦' },
    { code: 'IL', name: '以色列', flag: '🇮🇱' },
    { code: 'TR', name: '土耳其', flag: '🇹🇷' },
];

// ===== 完整平台列表（21个）=====
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
    { id: 'pva', name: 'PVA', icon: '📋' },
];

function Dashboard() {
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
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';

            console.log('🔑 Token:', token ? '存在' : '不存在');
            console.log('🏢 Tenant ID:', tenantId);
            console.log('👤 User Role:', userRole);

            const response = await fetch('https://api.vatapex.com/api/v1/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || '',
                    'X-User-Role': userRole
                }
            });

            console.log('📊 响应状态:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('📊 Dashboard 数据:', result);

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
            setError(err.message || '网络错误，请检查后端');
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

            {/* 支持的国家和平台 */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* 支持的国家 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <LanguageIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                支持的国家
                            </Typography>
                            <Chip label={`${COUNTRIES.length} 个`} size="small" color="primary" />
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {COUNTRIES.map((country) => (
                                <Chip
                                    key={country.code}
                                    label={`${country.flag} ${country.name}`}
                                    variant="outlined"
                                    size="small"
                                    sx={{ borderRadius: 1 }}
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* 支持的平台 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <StorefrontIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                支持的平台
                            </Typography>
                            <Chip label={`${PLATFORMS.length} 个`} size="small" color="primary" />
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {PLATFORMS.map((platform) => (
                                <Chip
                                    key={platform.id}
                                    label={`${platform.icon} ${platform.name}`}
                                    variant="outlined"
                                    size="small"
                                    sx={{ borderRadius: 1 }}
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* 最近活动 */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
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
            </Grid>
        </Box>
    );
}

export default Dashboard;