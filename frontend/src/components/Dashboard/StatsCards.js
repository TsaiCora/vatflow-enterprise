// frontend/src/components/Dashboard/StatsCards.js
import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AttachMoney as AttachMoneyIcon,
    People as PeopleIcon,
    Description as DescriptionIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

// 自定义卡片样式
const StyledCard = styled(Card)(({ theme, color }) => ({
    height: '100%',
    borderRadius: 12,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: theme.shadows[8],
        '& .card-icon': {
            transform: 'scale(1.1) rotate(-5deg)'
        }
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: color || theme.palette.primary.main
    }
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color ? `${color}20` : `${theme.palette.primary.main}20`,
    transition: 'transform 0.3s ease',
    '& .MuiSvgIcon-root': {
        fontSize: 28,
        color: color || theme.palette.primary.main
    }
}));

/**
 * 统计卡片组件
 * @param {Object} props
 * @param {string} props.title - 卡片标题
 * @param {string|number} props.value - 数值
 * @param {string} props.subtext - 副文本
 * @param {React.Element} props.icon - 图标
 * @param {string} props.color - 主题色
 * @param {number} props.change - 变化百分比
 * @param {string} props.changeLabel - 变化说明
 * @param {number} props.progress - 进度 (0-100)
 * @param {string} props.progressLabel - 进度说明
 */
function StatsCards({
    title = '统计',
    value = '0',
    subtext = '',
    icon,
    color = '#1976d2',
    change,
    changeLabel = '较上月',
    progress,
    progressLabel = '完成度'
}) {
    const isPositive = change > 0;

    return (
        <StyledCard color={color}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 500, letterSpacing: 0.5 }}
                        >
                            {title}
                        </Typography>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                mt: 1,
                                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                            }}
                        >
                            {value}
                        </Typography>
                        {subtext && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 0.5 }}
                            >
                                {subtext}
                            </Typography>
                        )}
                        {change !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                                {isPositive ? (
                                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                ) : (
                                    <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                )}
                                <Typography
                                    variant="caption"
                                    color={isPositive ? 'success.main' : 'error.main'}
                                    sx={{ fontWeight: 600 }}
                                >
                                    {isPositive ? '+' : ''}{change}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {changeLabel}
                                </Typography>
                            </Box>
                        )}
                        {progress !== undefined && (
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {progressLabel}
                                    </Typography>
                                    <Typography variant="caption" fontWeight={600}>
                                        {Math.round(progress)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(progress, 100)}
                                    sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        mt: 0.5,
                                        backgroundColor: `${color}30`,
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: color,
                                            borderRadius: 3
                                        }
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                    <IconWrapper color={color} className="card-icon">
                        {icon || <DescriptionIcon />}
                    </IconWrapper>
                </Box>
            </CardContent>
        </StyledCard>
    );
}

/**
 * 预设统计卡片变体
 */
export const VariantStatsCards = {
    // 总客户
    TotalTenants: (props) => (
        <StatsCards
            title="总客户"
            icon={<PeopleIcon />}
            color="#1976d2"
            {...props}
        />
    ),
    // 总交易
    TotalTransactions: (props) => (
        <StatsCards
            title="总交易"
            icon={<DescriptionIcon />}
            color="#2e7d32"
            {...props}
        />
    ),
    // VAT总额
    TotalVAT: (props) => (
        <StatsCards
            title="VAT总额"
            icon={<AttachMoneyIcon />}
            color="#ed6c02"
            {...props}
        />
    ),
    // 成功率
    SuccessRate: (props) => (
        <StatsCards
            title="处理成功率"
            icon={<CheckCircleIcon />}
            color="#9c27b0"
            {...props}
        />
    ),
    // 待处理
    Pending: (props) => (
        <StatsCards
            title="待处理"
            icon={<ScheduleIcon />}
            color="#0288d1"
            {...props}
        />
    ),
    // 警告
    Warnings: (props) => (
        <StatsCards
            title="警告"
            icon={<WarningIcon />}
            color="#d32f2f"
            {...props}
        />
    )
};

export default StatsCards;