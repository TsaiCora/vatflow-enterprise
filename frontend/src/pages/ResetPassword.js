// frontend/src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Card,
    CardContent
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [validating, setValidating] = useState(true);

    // 从 URL 获取 token 和 email
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tokenParam = params.get('token');
        const emailParam = params.get('email');

        if (tokenParam && emailParam) {
            setToken(tokenParam);
            setEmail(emailParam);
            setValidating(false);
        } else {
            setError('无效的重置链接');
            setValidating(false);
        }
    }, [location]);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            setError('密码长度至少为6位');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('https://api.vatapex.com/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    email,
                    newPassword
                })
            });

            const data = await response.json();
            console.log('📥 重置密码响应:', data);

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.error || '重置失败');
            }
        } catch (err) {
            console.error('❌ 重置密码失败:', err);
            setError('网络错误，请重试');
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !token) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Card sx={{ maxWidth: 400, p: 3 }}>
                    <Alert severity="error">{error}</Alert>
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/login')}
                    >
                        返回登录
                    </Button>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: '#f5f5f5'
        }}>
            <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                        VATFlow
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        设置新密码
                    </Typography>
                </Box>

                {success ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        ✅ 密码重置成功！3秒后跳转到登录页面...
                    </Alert>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="邮箱"
                            value={email}
                            disabled
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="新密码"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="至少6位"
                            sx={{ mb: 2 }}
                            disabled={loading}
                        />

                        <TextField
                            fullWidth
                            label="确认新密码"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="再次输入新密码"
                            sx={{ mb: 3 }}
                            disabled={loading}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ py: 1.5 }}
                        >
                            {loading ? <CircularProgress size={24} /> : '确认重置密码'}
                        </Button>

                        <Button
                            fullWidth
                            variant="text"
                            sx={{ mt: 1 }}
                            onClick={() => navigate('/login')}
                        >
                            返回登录
                        </Button>
                    </form>
                )}
            </Paper>
        </Box>
    );
}

export default ResetPassword;