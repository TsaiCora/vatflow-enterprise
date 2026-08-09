// frontend/src/components/Common/LoadingSpinner.js
import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Backdrop from '@mui/material/Backdrop';

/**
 * 加载动画组件
 * @param {Object} props
 * @param {boolean} props.loading - 是否显示加载
 * @param {string} props.message - 加载提示文字
 * @param {string} props.size - 尺寸 'small' | 'medium' | 'large'
 * @param {boolean} props.overlay - 是否显示遮罩层
 * @param {string} props.variant - 变体 'circular' | 'linear'
 */
function LoadingSpinner({
    loading = true,
    message = '加载中...',
    size = 'medium',
    overlay = false,
    variant = 'circular'
}) {
    const sizeMap = {
        small: 24,
        medium: 40,
        large: 60
    };

    const spinner = variant === 'circular' ? (
        <CircularProgress
            size={sizeMap[size] || 40}
            thickness={4}
            sx={{
                color: 'primary.main',
                animation: 'spin 1s linear infinite'
            }}
        />
    ) : (
        <Box sx={{ width: '100%', maxWidth: 300 }}>
            <CircularProgress
                size={40}
                thickness={4}
                sx={{ display: 'block', margin: '0 auto' }}
            />
        </Box>
    );

    const content = (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: 3
            }}
        >
            {spinner}
            {message && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );

    if (overlay) {
        return (
            <Backdrop
                open={loading}
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}
            >
                {content}
            </Backdrop>
        );
    }

    return loading ? content : null;
}

// 内置CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(style);

export default LoadingSpinner;