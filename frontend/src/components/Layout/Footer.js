// frontend/src/components/Layout/Footer.js
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 2,
                mt: 'auto',
                backgroundColor: (theme) => theme.palette.grey[100],
                textAlign: 'center',
                borderTop: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} VATFlow 批量申报系统 v3.0
                <br />
                <Link href="#" color="inherit" sx={{ mx: 1 }}>
                    隐私政策
                </Link>
                |
                <Link href="#" color="inherit" sx={{ mx: 1 }}>
                    使用条款
                </Link>
                |
                <Link href="#" color="inherit" sx={{ mx: 1 }}>
                    帮助中心
                </Link>
            </Typography>
        </Box>
    );
}

export default Footer;