// frontend/src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    Container,
    InputAdornment,
    IconButton,
    Divider,
    Link,
    CircularProgress
} from '@mui/material';
import {
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Login as LoginIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { login as loginAction } from '../store/slices/authSlice';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // 检查是否已登录
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    // 从URL获取重定向目标
    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await dispatch(loginAction({ email, password })).unwrap();
            if (result) {
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError(err || '登录失败，请检查邮箱和密码');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
                py: 3,
                px: 2
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={6}
                    sx={{
                        p: { xs: 3, sm: 4, md: 5 },
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* 装饰线条 */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)',
                            backgroundSize: '200% 100%',
                            animation: 'gradientMove 3s ease-in-out infinite'
                        }}
                    />

                    {/* Logo */}
                    <Box sx={{ textAlign: 'center', mb: 4, mt: 1 }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'white',
                                mb: 2,
                                boxShadow: '0 8px 24px rgba(25,118,210,0.3)'
                            }}
                        >
                            <BusinessIcon sx={{ fontSize: 36 }} />
                        </Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent'
                            }}
                        >
                            VATFlow
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            VAT批量申报系统 v3.0
                        </Typography>
                    </Box>

                    {/* 错误提示 */}
                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* 表单 */}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="邮箱地址"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={handleKeyPress}
                            fullWidth
                            margin="normal"
                            required
                            disabled={loading}
                            placeholder="admin@vatflow.com"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="action" />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="密码"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            fullWidth
                            margin="normal"
                            required
                            disabled={loading}
                            placeholder="••••••••"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 1 }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{ marginRight: 8 }}
                                />
                                <label htmlFor="remember" style={{ fontSize: '0.875rem', color: '#666' }}>
                                    记住我
                                </label>
                            </Box>
                            <Link
                                href="#"
                                variant="body2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // 跳转到重置密码页面
                                }}
                            >
                                忘记密码？
                            </Link>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                borderRadius: 2,
                                textTransform: 'none',
                                boxShadow: '0 4px 16px rgba(25,118,210,0.3)',
                                '&:hover': {
                                    boxShadow: '0 6px 24px rgba(25,118,210,0.4)'
                                }
                            }}
                        >
                            {loading ? '登录中...' : '登录'}
                        </Button>
                    </form>

                    <Divider sx={{ my: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                            演示账号
                        </Typography>
                    </Divider>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            邮箱: admin@vatflow.com
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            密码: admin123
                        </Typography>
                    </Box>
                </Paper>

                {/* 底部版权信息 */}
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: 'center', mt: 3 }}
                >
                    © {new Date().getFullYear()} VATFlow. All rights reserved.
                </Typography>
            </Container>

            {/* 动画样式 */}
            <style>
                {`
                    @keyframes gradientMove {
                        0%, 100% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                    }
                `}
            </style>
        </Box>
    );
}

export default Login;