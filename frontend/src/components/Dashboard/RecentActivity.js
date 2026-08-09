// frontend/src/components/Dashboard/RecentActivity.js
import React, { useState } from 'react';
import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    Avatar,
    Box,
    Chip,
    Divider,
    IconButton,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Upload as UploadIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    MoreVert as MoreVertIcon,
    Refresh as RefreshIcon,
    FilterList as FilterListIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * 最近活动组件
 * @param {Object} props
 * @param {Array} props.activities - 活动数据
 * @param {number} props.maxItems - 最大显示数量
 * @param {boolean} props.showFilter - 显示筛选
 * @param {Function} props.onRefresh - 刷新回调
 */
function RecentActivity({
    activities = [],
    maxItems = 10,
    showFilter = true,
    onRefresh
}) {
    const [filter, setFilter] = useState('all');
    const [anchorEl, setAnchorEl] = useState(null);
    const [expanded, setExpanded] = useState(false);

    // 活动类型配置
    const activityConfigs = {
        upload: {
            label: '文件上传',
            icon: <UploadIcon />,
            color: '#1976d2',
            bgColor: '#e3f2fd'
        },
        success: {
            label: '处理成功',
            icon: <CheckCircleIcon />,
            color: '#2e7d32',
            bgColor: '#e8f5e9'
        },
        error: {
            label: '处理失败',
            icon: <ErrorIcon />,
            color: '#d32f2f',
            bgColor: '#ffebee'
        },
        warning: {
            label: '警告',
            icon: <WarningIcon />,
            color: '#ed6c02',
            bgColor: '#fff3e0'
        },
        info: {
            label: '信息',
            icon: <InfoIcon />,
            color: '#0288d1',
            bgColor: '#e1f5fe'
        }
    };

    // 过滤活动
    const filteredActivities = activities
        .filter(activity => filter === 'all' || activity.type === filter)
        .slice(0, expanded ? activities.length : maxItems);

    const handleFilterChange = (event, newFilter) => {
        if (newFilter !== null) {
            setFilter(newFilter);
        }
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleToggleExpand = () => {
        setExpanded(!expanded);
    };

    // 获取活动图标
    const getActivityIcon = (type) => {
        const config = activityConfigs[type] || activityConfigs.info;
        return (
            <Avatar
                sx={{
                    bgcolor: config.bgColor,
                    color: config.color,
                    width: 40,
                    height: 40
                }}
            >
                {config.icon}
            </Avatar>
        );
    };

    // 获取时间显示
    const getTimeDisplay = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return timestamp || '刚刚';
        }
    };

    // 获取完整时间
    const getFullTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return format(date, 'yyyy-MM-dd HH:mm:ss');
        } catch {
            return timestamp;
        }
    };

    return (
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
            {/* 头部 */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        🕐 最近活动
                    </Typography>
                    <Chip
                        label={`${filteredActivities.length} 条`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {showFilter && (
                        <ToggleButtonGroup
                            size="small"
                            value={filter}
                            exclusive
                            onChange={handleFilterChange}
                            sx={{
                                '& .MuiToggleButton-root': {
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    px: 1.5,
                                    py: 0.5
                                }
                            }}
                        >
                            <ToggleButton value="all">全部</ToggleButton>
                            <ToggleButton value="upload">上传</ToggleButton>
                            <ToggleButton value="success">成功</ToggleButton>
                            <ToggleButton value="error">失败</ToggleButton>
                            <ToggleButton value="warning">警告</ToggleButton>
                        </ToggleButtonGroup>
                    )}

                    {onRefresh && (
                        <IconButton size="small" onClick={onRefresh} title="刷新">
                            <RefreshIcon />
                        </IconButton>
                    )}

                    <IconButton size="small" onClick={handleMenuOpen}>
                        <MoreVertIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* 活动列表 */}
            {filteredActivities.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        📭 暂无活动记录
                    </Typography>
                </Box>
            ) : (
                <List sx={{ py: 0 }}>
                    {filteredActivities.map((activity, index) => {
                        const config = activityConfigs[activity.type] || activityConfigs.info;

                        return (
                            <React.Fragment key={activity.id || index}>
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{
                                        px: 3,
                                        py: 1.5,
                                        '&:hover': {
                                            bgcolor: 'action.hover'
                                        },
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <ListItemAvatar>
                                        {activity.avatar || getActivityIcon(activity.type)}
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {activity.user || '系统'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {activity.action || '执行了操作'}
                                                </Typography>
                                                {activity.target && (
                                                    <Chip
                                                        label={activity.target}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 0.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    {activity.detail && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ fontSize: '0.875rem' }}
                                                        >
                                                            {activity.detail}
                                                        </Typography>
                                                    )}
                                                    <Chip
                                                        label={config.label}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: config.bgColor,
                                                            color: config.color,
                                                            fontSize: '0.65rem',
                                                            height: 20
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                    >
                                                        <ScheduleIcon sx={{ fontSize: 12 }} />
                                                        {getTimeDisplay(activity.timestamp)}
                                                    </Typography>
                                                </Box>
                                                {activity.meta && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ display: 'block', mt: 0.5 }}
                                                    >
                                                        {Object.entries(activity.meta)
                                                            .map(([key, value]) => `${key}: ${value}`)
                                                            .join(' | ')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                        secondaryTypographyProps={{
                                            component: 'div'
                                        }}
                                    />
                                </ListItem>
                                {index < filteredActivities.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        );
                    })}
                </List>
            )}

            {/* 底部 */}
            {activities.length > maxItems && (
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Button
                        variant="text"
                        color="primary"
                        onClick={handleToggleExpand}
                        size="small"
                    >
                        {expanded ? '收起' : `查看全部 (${activities.length} 条)`}
                    </Button>
                </Box>
            )}

            {/* 更多菜单 */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleMenuClose}>
                    <RefreshIcon sx={{ mr: 1, fontSize: 18 }} />
                    刷新
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <FilterListIcon sx={{ mr: 1, fontSize: 18 }} />
                    筛选条件
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <InfoIcon sx={{ mr: 1, fontSize: 18 }} />
                    查看全部
                </MenuItem>
            </Menu>
        </Paper>
    );
}

export default RecentActivity;