// frontend/src/components/Dashboard/CountryChart.js
import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Chip,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    LinearProgress,
    Divider,
    Button
} from '@mui/material';
import {
    Public as PublicIcon,
    TrendingUp as TrendingUpIcon,
    MoreVert as MoreVertIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// 国家数据映射
const COUNTRY_DATA = {
    GB: { name: '英国', flag: '🇬🇧', color: '#1a5e9c' },
    DE: { name: '德国', flag: '🇩🇪', color: '#dd0000' },
    FR: { name: '法国', flag: '🇫🇷', color: '#002395' },
    IT: { name: '意大利', flag: '🇮🇹', color: '#009246' },
    ES: { name: '西班牙', flag: '🇪🇸', color: '#c60b1e' },
    NL: { name: '荷兰', flag: '🇳🇱', color: '#ae1c28' },
    BE: { name: '比利时', flag: '🇧🇪', color: '#000000' },
    AT: { name: '奥地利', flag: '🇦🇹', color: '#ed2939' },
    PL: { name: '波兰', flag: '🇵🇱', color: '#dc143c' },
    SE: { name: '瑞典', flag: '🇸🇪', color: '#006aa7' },
    DK: { name: '丹麦', flag: '🇩🇰', color: '#c60b1e' },
    FI: { name: '芬兰', flag: '🇫🇮', color: '#003580' },
    IE: { name: '爱尔兰', flag: '🇮🇪', color: '#169b62' },
    PT: { name: '葡萄牙', flag: '🇵🇹', color: '#006600' },
    GR: { name: '希腊', flag: '🇬🇷', color: '#0d5eaf' },
    HU: { name: '匈牙利', flag: '🇭🇺', color: '#ce2939' },
    CZ: { name: '捷克', flag: '🇨🇿', color: '#11457e' },
    SK: { name: '斯洛伐克', flag: '🇸🇰', color: '#0b4ea2' },
    SI: { name: '斯洛文尼亚', flag: '🇸🇮', color: '#1b5e20' },
    HR: { name: '克罗地亚', flag: '🇭🇷', color: '#e31820' },
    RO: { name: '罗马尼亚', flag: '🇷🇴', color: '#002b7f' },
    BG: { name: '保加利亚', flag: '🇧🇬', color: '#00966e' },
    LT: { name: '立陶宛', flag: '🇱🇹', color: '#006a44' },
    LV: { name: '拉脱维亚', flag: '🇱🇻', color: '#9e3039' },
    EE: { name: '爱沙尼亚', flag: '🇪🇪', color: '#0072ce' },
    LU: { name: '卢森堡', flag: '🇱🇺', color: '#00a1de' },
    MT: { name: '马耳他', flag: '🇲🇹', color: '#cf142b' },
    CY: { name: '塞浦路斯', flag: '🇨🇾', color: '#0d5eaf' }
};

const BarWrapper = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '4px 0',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: 4,
        padding: '4px 8px',
        margin: '0 -8px'
    }
});

const BarContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    height: 28,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative'
}));

const BarFill = styled(Box)(({ color, width }) => ({
    height: '100%',
    width: `${width}%`,
    backgroundColor: color || '#1976d2',
    borderRadius: 14,
    transition: 'width 1s ease-in-out',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
        borderRadius: 14
    }
}));

/**
 * 国家分布图表组件
 * @param {Object} props
 * @param {Array} props.data - 数据 [{ country, value, label }]
 * @param {string} props.title - 标题
 * @param {number} props.maxItems - 最大显示数量
 * @param {boolean} props.showPercentage - 显示百分比
 * @param {boolean} props.showValue - 显示数值
 */
function CountryChart({
    data = [],
    title = '国家分布',
    maxItems = 10,
    showPercentage = true,
    showValue = true,
    onRefresh
}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [sortBy, setSortBy] = useState('value');

    // 计算总数
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

    // 排序和截取
    const sortedData = [...data]
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, expanded ? data.length : maxItems);

    // 计算百分比
    const processedData = sortedData.map(item => ({
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100) : 0,
        countryInfo: COUNTRY_DATA[item.country] || {
            name: item.country || '未知',
            flag: '🌍',
            color: '#757575'
        }
    }));

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleToggleExpand = () => {
        setExpanded(!expanded);
    };

    const handleExportCSV = () => {
        const csvRows = [
            ['国家', '代码', '数值', '百分比'],
            ...processedData.map(item => [
                item.countryInfo.name,
                item.country,
                item.value,
                item.percentage.toFixed(2) + '%'
            ])
        ];
        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `country-distribution-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            {/* 头部 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublicIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {title}
                    </Typography>
                    <Chip
                        label={`${data.length} 个国家`}
                        size="small"
                        variant="outlined"
                    />
                </Box>
                <Box>
                    {onRefresh && (
                        <Tooltip title="刷新">
                            <IconButton size="small" onClick={onRefresh}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="更多操作">
                        <IconButton size="small" onClick={handleMenuOpen}>
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* 统计摘要 */}
            <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        总计
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {total.toLocaleString()}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        覆盖国家
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {data.length}
                    </Typography>
                </Box>
                {data.length > 0 && (
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            最大占比
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {((Math.max(...data.map(d => d.value || 0)) / total) * 100).toFixed(1)}%
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* 国家列表 */}
            {processedData.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        📭 暂无国家数据
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ mt: 1 }}>
                    {processedData.map((item) => {
                        const { countryInfo, percentage, value, country } = item;

                        return (
                            <BarWrapper key={country}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                                    <Typography variant="body1" sx={{ fontSize: 20 }}>
                                        {countryInfo.flag}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            fontSize: '0.875rem',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {countryInfo.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontSize: '0.7rem' }}
                                    >
                                        {country}
                                    </Typography>
                                </Box>

                                <BarContainer>
                                    <BarFill
                                        color={countryInfo.color}
                                        width={Math.min(percentage, 100)}
                                    />
                                </BarContainer>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100, justifyContent: 'flex-end' }}>
                                    {showValue && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                minWidth: 40,
                                                textAlign: 'right'
                                            }}
                                        >
                                            {typeof value === 'number' && value > 1000
                                                ? `${(value / 1000).toFixed(1)}k`
                                                : value || 0}
                                        </Typography>
                                    )}
                                    {showPercentage && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                fontSize: '0.75rem',
                                                minWidth: 45,
                                                textAlign: 'right'
                                            }}
                                        >
                                            {percentage.toFixed(1)}%
                                        </Typography>
                                    )}
                                </Box>
                            </BarWrapper>
                        );
                    })}
                </Box>
            )}

            {/* 底部 */}
            {data.length > maxItems && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        variant="text"
                        color="primary"
                        size="small"
                        onClick={handleToggleExpand}
                        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                        {expanded ? '收起' : `查看全部 (${data.length} 个国家)`}
                    </Button>
                </Box>
            )}

            {/* 更多菜单 */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleExportCSV}>
                    <DownloadIcon sx={{ mr: 1, fontSize: 18 }} />
                    导出CSV
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <TrendingUpIcon sx={{ mr: 1, fontSize: 18 }} />
                    查看趋势
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setSortBy('value'); handleMenuClose(); }}>
                    按数值排序
                </MenuItem>
                <MenuItem onClick={() => { setSortBy('alphabet'); handleMenuClose(); }}>
                    按字母排序
                </MenuItem>
            </Menu>
        </Paper>
    );
}

export default CountryChart;