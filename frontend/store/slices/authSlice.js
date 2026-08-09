// frontend/src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 从 localStorage 获取初始状态
const getInitialState = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
        token: token || null,
        user: user ? JSON.parse(user) : null,
        isAuthenticated: !!token,
        isLoading: false,
        error: null,
        permissions: []
    };
};

// 异步登录
export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await axios.post('/api/v1/auth/login', { email, password });
            const { token, user } = response.data.data;
            
            // 保存到 localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            return { token, user };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '登录失败，请稍后重试'
            );
        }
    }
);

// 异步登出
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await axios.post('/api/v1/auth/logout');
        } catch (error) {
            // 即使API失败也清除本地数据
            console.warn('登出API调用失败:', error);
        }
        // 清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
    }
);

// 异步刷新Token
export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            const refreshToken = auth.refreshToken || localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                throw new Error('没有刷新令牌');
            }

            const response = await axios.post('/api/v1/auth/refresh', { refreshToken });
            const { token } = response.data.data;
            
            localStorage.setItem('token', token);
            return token;
        } catch (error) {
            // 刷新失败，清除所有认证信息
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            return rejectWithValue('会话已过期，请重新登录');
        }
    }
);

// 异步获取当前用户信息
export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            if (!auth.token) {
                throw new Error('未认证');
            }

            const response = await axios.get('/api/v1/auth/me', {
                headers: { Authorization: `Bearer ${auth.token}` }
            });
            
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '获取用户信息失败'
            );
        }
    }
);

// 异步更新密码
export const updatePassword = createAsyncThunk(
    'auth/updatePassword',
    async ({ currentPassword, newPassword }, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            const response = await axios.put('/api/v1/auth/password',
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '密码更新失败'
            );
        }
    }
);

// 异步重置密码（忘记密码）
export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async ({ email }, { rejectWithValue }) => {
        try {
            const response = await axios.post('/api/v1/auth/reset-password', { email });
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '发送重置邮件失败'
            );
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: getInitialState(),
    reducers: {
        // 设置认证状态
        setAuth: (state, action) => {
            const { token, user } = action.payload;
            state.token = token;
            state.user = user;
            state.isAuthenticated = !!token;
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
            }
        },
        // 清除认证状态
        clearAuth: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
        },
        // 设置错误
        setError: (state, action) => {
            state.error = action.payload;
        },
        // 清除错误
        clearError: (state) => {
            state.error = null;
        },
        // 更新用户信息
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem('user', JSON.stringify(state.user));
        },
        // 设置权限
        setPermissions: (state, action) => {
            state.permissions = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // 登录
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || '登录失败';
                state.isAuthenticated = false;
            })
            // 登出
            .addCase(logout.fulfilled, (state) => {
                state.token = null;
                state.user = null;
                state.isAuthenticated = false;
                state.error = null;
                state.permissions = [];
            })
            // 刷新Token
            .addCase(refreshToken.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.isLoading = false;
                state.token = action.payload;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(refreshToken.rejected, (state, action) => {
                state.isLoading = false;
                state.token = null;
                state.user = null;
                state.isAuthenticated = false;
                state.error = action.payload || '会话已过期';
            })
            // 获取当前用户
            .addCase(fetchCurrentUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || '获取用户信息失败';
            })
            // 更新密码
            .addCase(updatePassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updatePassword.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
            })
            .addCase(updatePassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || '密码更新失败';
            });
    }
});

// 导出Actions
export const {
    setAuth,
    clearAuth,
    setError,
    clearError,
    updateUser,
    setPermissions
} = authSlice.actions;

// 导出Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectPermissions = (state) => state.auth.permissions;

export default authSlice.reducer;