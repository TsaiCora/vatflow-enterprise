// frontend/src/components/Common/ConfirmDialog.js
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Box,
    Typography
} from '@mui/material';
import {
    Warning as WarningIcon,
    Delete as DeleteIcon,
    Info as InfoIcon
} from '@mui/icons-material';

/**
 * 确认对话框组件
 * @param {Object} props
 * @param {boolean} props.open - 是否打开
 * @param {Function} props.onClose - 关闭回调
 * @param {Function} props.onConfirm - 确认回调
 * @param {string} props.title - 标题
 * @param {string} props.message - 消息
 * @param {string} props.type - 类型 'warning' | 'danger' | 'info'
 * @param {string} props.confirmText - 确认按钮文字
 * @param {string} props.cancelText - 取消按钮文字
 * @param {boolean} props.loading - 加载状态
 */
function ConfirmDialog({
    open = false,
    onClose,
    onConfirm,
    title = '确认操作',
    message = '确定要执行此操作吗？',
    type = 'warning',
    confirmText = '确认',
    cancelText = '取消',
    loading = false
}) {
    const configs = {
        warning: {
            icon: <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
            color: 'warning'
        },
        danger: {
            icon: <DeleteIcon sx={{ fontSize: 40, color: 'error.main' }} />,
            color: 'error'
        },
        info: {
            icon: <InfoIcon sx={{ fontSize: 40, color: 'info.main' }} />,
            color: 'primary'
        }
    };

    const config = configs[type] || configs.warning;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {config.icon}
                    <Typography variant="h6" component="span">
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ fontSize: '1rem' }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={config.color}
                    disabled={loading}
                    autoFocus
                >
                    {loading ? '处理中...' : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDialog;