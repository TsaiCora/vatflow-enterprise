// frontend/src/components/Common/StatusBadge.js
import React from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Pending as PendingIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Schedule as ScheduleIcon,
    Error as ErrorIcon
} from '@mui/icons-material';

/**
 * 状态徽章组件
 * @param {Object} props
 * @param {string} props.status - 状态值
 * @param {Object} props.config - 状态配置 { color, icon, label }
 * @param {string} props.size - 'small' | 'medium'
 * @param {boolean} props.showIcon - 是否显示图标
 * @param {string} props.tooltip - 提示文字
 */
function StatusBadge({
    status,
    config,
    size = 'small',
    showIcon = true,
    tooltip
}) {
    // 预设状态配置
    const defaultConfigs = {
        active: { color: 'success', icon: <CheckCircleIcon />, label: '活跃' },
        inactive: { color: 'default', icon: <CancelIcon />, label: '停用' },
        pending: { color: 'warning', icon: <PendingIcon />, label: '待处理' },
        completed: { color: 'success', icon: <CheckCircleIcon />, label: '已完成' },
        processing: { color: 'info', icon: <ScheduleIcon />, label: '处理中' },
        failed: { color: 'error', icon: <ErrorIcon />, label: '失败' },
        draft: { color: 'default', icon: <InfoIcon />, label: '草稿' },
        submitted: { color: 'primary', icon: <CheckCircleIcon />, label: '已提交' },
        approved: { color: 'success', icon: <CheckCircleIcon />, label: '已批准' },
        rejected: { color: 'error', icon: <CancelIcon />, label: '已拒绝' },
        warning: { color: 'warning', icon: <WarningIcon />, label: '警告' }
    };

    const finalConfig = config || defaultConfigs[status] || {
        color: 'default',
        icon: <InfoIcon />,
        label: status || '未知'
    };

    const chip = (
        <Chip
            label={finalConfig.label || status}
            color={finalConfig.color}
            size={size}
            icon={showIcon ? finalConfig.icon : undefined}
            sx={{
                fontWeight: 500,
                minWidth: 60,
                '& .MuiChip-label': {
                    px: 1
                }
            }}
        />
    );

    if (tooltip) {
        return <Tooltip title={tooltip}>{chip}</Tooltip>;
    }

    return chip;
}

export default StatusBadge;