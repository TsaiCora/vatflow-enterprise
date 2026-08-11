// frontend/src/pages/Login.js
import React, { useState } from 'react';
import api from '../services/api';

function Login() {
    const [email, setEmail] = useState('admin@vatflow.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('📤 登录请求:', { email, password });

        try {
            const data = await api.post('/api/v1/auth/login', { email, password });

            console.log('📥 登录响应:', data);

            if (data.success) {
                localStorage.setItem('token', data.data.token || 'dummy-token');
                localStorage.setItem('user', JSON.stringify(data.data.user));
                window.location.href = '/dashboard';
            } else {
                setError(data.error || '登录失败');
            }
        } catch (err) {
            console.error('❌ 登录错误:', err);
            if (typeof err === 'string') {
                setError(err);
            } else {
                setError('网络错误，请检查后端');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
            <h1 style={{ textAlign: 'center', color: '#1976d2' }}>VATFlow</h1>
            <p style={{ textAlign: 'center', color: '#666' }}>VAT批量申报系统 v3.0</p>
            
            {error && <div style={{ color: 'red', padding: 10, background: '#ffebee', borderRadius: 4, marginBottom: 10 }}>{error}</div>}

            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 15 }}>
                    <label>邮箱</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                        disabled={loading}
                    />
                </div>
                <div style={{ marginBottom: 15 }}>
                    <label>密码</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: 12, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, fontSize: 16, cursor: 'pointer' }}
                >
                    {loading ? '登录中...' : '登录'}
                </button>
            </form>

            {/* ===== 删除演示账号文字 ===== */}
            {/* <p style={{ textAlign: 'center', marginTop: 15, fontSize: 12, color: '#999' }}>
                演示账号: admin@vatflow.com / admin123
            </p> */}
        </div>
    );
}

export default Login;