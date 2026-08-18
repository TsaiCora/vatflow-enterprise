// frontend/src/pages/Login.js
import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Link
} from '@mui/material';

function Login() {
    const [email, setEmail] = useState('admin@vatflow.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // 忘记密码状态
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState('');
    const [forgotError, setForgotError] = useState('');

    // ===== 登录 =====
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('https://api.vatapex.com/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('📥 登录响应:', data);

            if (data.success) {
                const user = data.data.user;
                const token = data.data.token;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                const tenantId = user?.tenant_id || 'admin_tenant';
                localStorage.setItem('tenantId', tenantId);
                localStorage.setItem('userRole', user?.role || 'user');

                window.location.href = '/dashboard';
            } else {
                setError(data.error || '登录失败');
            }
        } catch (err) {
            console.error('❌ 登录错误:', err);
            setError('网络错误，请检查后端');
        } finally {
            setLoading(false);
        }
    };

    // ===== 请求重置密码 =====
    const handleForgotPassword = async () => {
        if (!forgotEmail) {
            setForgotError('请输入邮箱地址');
            return;
        }

        setForgotLoading(true);
        setForgotError('');
        setForgotMessage('');

        try {
            const response = await fetch('https://api.vatapex.com/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });

            const data = await response.json();
            console.log('📥 重置请求响应:', data);

            if (data.success) {
                setForgotMessage(data.message || '重置邮件已发送，请检查您的邮箱');
                setForgotError('');
                // 3秒后自动关闭弹窗
                setTimeout(() => {
                    setForgotOpen(false);
                    setForgotMessage('');
                    setForgotEmail('');
                }, 3000);
            } else {
                setForgotError(data.error || '请求失败');
                setForgotMessage('');
            }
        } catch (err) {
            console.error('❌ 请求重置失败:', err);
            setForgotError('网络错误，请重试');
        } finally {
            setForgotLoading(false);
        }
    };

    // ===== 关闭弹窗 =====
    const handleCloseForgot = () => {
        setForgotOpen(false);
        setForgotEmail('');
        setForgotError('');
        setForgotMessage('');
    };

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: '#f5f5f5'
        }}>
            <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
                {/* Logo */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                        VATFlow
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        VAT批量申报系统 v3.0
                    </Typography>
                </Box>

                {/* 错误提示 */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* 登录表单 */}
                <form onSubmit={handleLogin}>
                    <TextField
                        fullWidth
                        label="邮箱"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="密码"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{ py: 1.5, mb: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : '登录'}
                    </Button>
                </form>

                {/* 忘记密码 */}
                <Box sx={{ textAlign: 'center' }}>
                    <Link
                        href="#"
                        variant="body2"
                        onClick={(e) => {
                            e.preventDefault();
                            setForgotOpen(true);
                        }}
                        sx={{ cursor: 'pointer' }}
                    >
                        忘记密码？
                    </Link>
                </Box>
            </Paper>

            {/* ===== 忘记密码弹窗 ===== */}
            <Dialog open={forgotOpen} onClose={handleCloseForgot} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6">🔐 重置密码</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        输入您注册时使用的邮箱地址，我们将发送重置密码的链接到您的邮箱。
                    </Typography>

                    {forgotError && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setForgotError('')}>
                            {forgotError}
                        </Alert>
                    )}

                    {forgotMessage && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {forgotMessage}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="邮箱地址"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="请输入您的注册邮箱"
                        disabled={forgotLoading || !!forgotMessage}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseForgot} disabled={forgotLoading}>
                        取消
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleForgotPassword}
                        disabled={forgotLoading || !!forgotMessage}
                        startIcon={forgotLoading ? <CircularProgress size={20} /> : null}
                    >
                        {forgotLoading ? '发送中...' : '发送重置邮件'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Login;