// frontend/src/components/Common/EmptyState.js
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import {
    Inbox as InboxIcon,
    Search as SearchIcon,
    Upload as UploadIcon,
    Error as ErrorIcon
} from '@mui/icons-material';

/**
 * 空状态组件
 * @param {Object} props
 * @param {string} props.type - 类型 'empty' | 'search' | 'upload' | 'error'
 * @param {string} props.title - 标题
 * @param {string} props.description - 描述
 * @param {string} props.buttonText - 按钮文字
 * @param {Function} props.onAction - 按钮点击回调
 */
function EmptyState({
    type = 'empty',
    title,
    description,
    buttonText,
    onAction
}) {
    const configs = {
        empty: {
            icon: <InboxIcon sx={{ fontSize: 80, color: 'action.disabled' }} />,
            title: title || '暂无数据',
            description: description || '当前没有数据，请稍后再来查看'
        },
        search: {
            icon: <SearchIcon sx={{ fontSize: 80, color: 'action.disabled' }} />,
            title: title || '未找到结果',
            description: description || '请尝试调整搜索条件'
        },
        upload: {
            icon: <UploadIcon sx={{ fontSize: 80, color: 'action.disabled' }} />,
            title: title || '还没有上传文件',
            description: description || '上传您的第一个文件开始处理'
        },
        error: {
            icon: <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />,
            title: title || '加载失败',
            description: description || '请检查网络连接后重试'
        }
    };

    const config = configs[type] || configs.empty;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                px: 3
            }}
        >
            {config.icon}
            <Typography
                variant="h6"
                sx={{ mt: 2, fontWeight: 'bold' }}
            >
                {config.title}
            </Typography>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, textAlign: 'center', maxWidth: 400 }}
            >
                {config.description}
            </Typography>
            {buttonText && onAction && (
                <Button
                    variant="contained"
                    onClick={onAction}
                    sx={{ mt: 3 }}
                    startIcon={type === 'upload' ? <UploadIcon /> : undefined}
                >
                    {buttonText}
                </Button>
            )}
        </Box>
    );
}

export default EmptyState;