// frontend/src/components/Files/ProcessingStatus.js
import React, { useState, useEffect } from 'react';
import {
    Paper,
    Box,
    Typography,
    LinearProgress,
    Chip,
    Grid,
    Alert,
    AlertTitle,
    Button,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Collapse
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Refresh as RefreshIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';

/**
 * 处理状态组件
 * @param {Object} props
 * @param {string} props.jobId - 任务ID
 * @param {string} props.status - 状态 'pending' | 'processing' | 'completed' | 'failed'
 * @param {number} props.progress - 进度 0-100
 * @param {string} props.message - 状态消息
 * @param {Array} props.details - 详细信息
 * @param {Function} props.onRefresh - 刷新回调
 * @param {Function} props.onRetry - 重试回调
 * @param {Object} props.result - 处理结果
 */
function ProcessingStatus({
    jobId,
    status = 'pending',
    progress = 0,
    message = '',
    details = [],
    onRefresh,
    onRetry,
    result = null
}) {
    const [expanded, setExpanded] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);

    // 计时器
    useEffect(() => {
        let interval;
        if (status === 'processing' || status === 'pending') {
            interval = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    // 状态配置
    const statusConfigs = {
        pending: {
            icon: <PendingIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
            color: 'warning',
            title: '等待处理',
            description: '任务已提交，正在排队等待处理...'
        },
        processing: {
            icon: <CircularProgress size={40} />,
            color: 'info',
            title: '处理中',
            description: '正在处理文件，请稍候...'
        },
        completed: {
            icon: <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />,
            color: 'success',
            title: '处理完成',
            description: '文件处理成功完成！'
        },
        failed: {
            icon: <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />,
            color: 'error',
            title: '处理失败',
            description: '文件处理失败，请检查错误信息'
        }
    };

    const config = statusConfigs[status] || statusConfigs.pending;

    // 格式化时间
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins}分${secs}秒`;
        }
        return `${secs}秒`;
    };

    return (
        <Paper sx={{ p: 3 }}>
            {/* 状态头部 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                <Box sx={{ flexShrink: 0 }}>
                    {config.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {config.title}
                        </Typography>
                        <Chip
                            label={status.toUpperCase()}
                            color={config.color}
                            size="small"
                        />
                        {jobId && (
                            <Chip
                                label={`任务: ${jobId}`}
                                size="small"
                                variant="outlined"
                            />
                        )}
                        {(status === 'processing' || status === 'pending') && (
                            <Chip
                                icon={<ScheduleIcon />}
                                label={formatTime(timeElapsed)}
                                size="small"
                                variant="outlined"
                            />
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {message || config.description}
                    </Typography>
                </Box>
                <Box>
                    {onRefresh && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={onRefresh}
                        >
                            刷新
                        </Button>
                    )}
                    {status === 'failed' && onRetry && (
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={onRetry}
                            sx={{ ml: 1 }}
                        >
                            重试
                        </Button>
                    )}
                </Box>
            </Box>

            {/* 进度条 */}
            {status !== 'completed' && status !== 'failed' && (
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            处理进度
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                            {progress}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                transition: 'width 0.5s ease'
                            }
                        }}
                    />
                </Box>
            )}

            {/* 结果摘要 */}
            {status === 'completed' && result && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    <AlertTitle>处理结果摘要</AlertTitle>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                                交易记录
                            </Typography>
                            <Typography variant="h6">
                                {result.totalTransactions || 0}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                                涉及国家
                            </Typography>
                            <Typography variant="h6">
                                {result.countries?.length || 0}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                                VAT总额
                            </Typography>
                            <Typography variant="h6">
                                €{result.totalVAT?.toFixed(2) || '0.00'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                                生成报告
                            </Typography>
                            <Typography variant="h6">
                                {result.reportFiles?.length || 0}
                            </Typography>
                        </Grid>
                    </Grid>
                </Alert>
            )}

            {/* 错误信息 */}
            {status === 'failed' && result?.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    <AlertTitle>错误信息</AlertTitle>
                    {result.error}
                </Alert>
            )}

            {/* 详细信息 */}
            {details.length > 0 && (
                <Box>
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => setExpanded(!expanded)}
                        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                        {expanded ? '收起详细信息' : '展开详细信息'}
                    </Button>
                    <Collapse in={expanded}>
                        <Divider sx={{ my: 2 }} />
                        <List dense>
                            {details.map((detail, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>
                                        <DescriptionIcon fontSize="small" color="action" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={detail.label || detail}
                                        secondary={detail.value || detail.description}
                                    />
                                    {detail.status && (
                                        <Chip
                                            label={detail.status}
                                            size="small"
                                            color={detail.status === 'success' ? 'success' : 'default'}
                                        />
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    </Collapse>
                </Box>
            )}
        </Paper>
    );
}

export default ProcessingStatus;