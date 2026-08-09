import React from 'react';
import { Typography, Box } from '@mui/material';

function Test() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" color="success.main">
                ✅ 测试页面正常渲染！
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
                如果你看到这段文字，说明 React 路由和组件渲染都正常。
            </Typography>
        </Box>
    );
}

export default Test;