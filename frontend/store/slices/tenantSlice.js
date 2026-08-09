// frontend/src/store/slices/tenantSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 获取初始状态
const getInitialState = () => ({
    tenants: [],
    selectedTenant: null,
    isLoading: false,
    error: null,
    totalCount: 0,
    filters: {
        status: 'all',
        country: 'all',
        search: ''
    },
    pagination: {
        page: 1,
        limit: 20,
        totalPages: 0
    }
});

// 异步获取客户列表
export const fetchTenants = createAsyncThunk(
    'tenants/fetchAll',
    async ({ page = 1, limit = 20, status, country, search } = {}, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);
            if (status && status !== 'all') params.append('status', status);
            if (country && country !== 'all') params.append('country', country);
            if (search) params.append('search', search);

            const response = await axios.get(`/api/v1/tenants?${params.toString()}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '获取客户列表失败'
            );
        }
    }
);

// 异步获取单个客户
export const fetchTenantById = createAsyncThunk(
    'tenants/fetchById',
    async (tenantId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/v1/tenants/${tenantId}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '获取客户信息失败'
            );
        }
    }
);

// 异步创建客户
export const createTenant = createAsyncThunk(
    'tenants/create',
    async (tenantData, { rejectWithValue }) => {
        try {
            const response = await axios.post('/api/v1/tenants', tenantData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '创建客户失败'
            );
        }
    }
);

// 异步更新客户
export const updateTenant = createAsyncThunk(
    'tenants/update',
    async ({ tenantId, data }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/api/v1/tenants/${tenantId}`, data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '更新客户失败'
            );
        }
    }
);

// 异步删除客户
export const deleteTenant = createAsyncThunk(
    'tenants/delete',
    async (tenantId, { rejectWithValue }) => {
        try {
            await axios.delete(`/api/v1/tenants/${tenantId}`);
            return tenantId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '删除客户失败'
            );
        }
    }
);

// 异步切换客户状态
export const toggleTenantStatus = createAsyncThunk(
    'tenants/toggleStatus',
    async (tenantId, { getState, rejectWithValue }) => {
        try {
            const { tenants } = getState();
            const tenant = tenants.tenants.find(t => t.tenantId === tenantId);
            if (!tenant) {
                throw new Error('客户不存在');
            }
            
            const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
            const response = await axios.put(`/api/v1/tenants/${tenantId}`, {
                status: newStatus
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '切换状态失败'
            );
        }
    }
);

// 异步获取客户统计
export const fetchTenantStats = createAsyncThunk(
    'tenants/fetchStats',
    async (tenantId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/v1/tenants/${tenantId}/stats`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '获取统计信息失败'
            );
        }
    }
);

// 异步批量导入客户
export const importTenants = createAsyncThunk(
    'tenants/import',
    async (file, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axios.post('/api/v1/tenants/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '导入客户失败'
            );
        }
    }
);

const tenantSlice = createSlice({
    name: 'tenants',
    initialState: getInitialState(),
    reducers: {
        // 设置选中的客户
        setSelectedTenant: (state, action) => {
            state.selectedTenant = action.payload;
        },
        // 清空选中的客户
        clearSelectedTenant: (state) => {
            state.selectedTenant = null;
        },
        // 设置过滤器
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
            state.pagination.page = 1; // 重置页码
        },
        // 重置过滤器
        resetFilters: (state) => {
            state.filters = getInitialState().filters;
            state.pagination.page = 1;
        },
        // 设置页码
        setPage: (state, action) => {
            state.pagination.page = action.payload;
        },
        // 设置每页数量
        setLimit: (state, action) => {
            state.pagination.limit = action.payload;
            state.pagination.page = 1;
        },
        // 清空错误
        clearError: (state) => {
            state.error = null;
        },
        // 重置状态
        resetTenants: () => getInitialState()
    },
    extraReducers: (builder) => {
        builder
            // 获取客户列表
            .addCase(fetchTenants.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTenants.fulfilled, (state, action) => {
                state.isLoading = false;
                state.tenants = action.payload.data || [];
                state.totalCount = action.payload.pagination?.total || 0;
                state.pagination.totalPages = action.payload.pagination?.totalPages || 0;
                state.error = null;
            })
            .addCase(fetchTenants.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || '获取客户列表失败';
            })
            // 获取单个客户
            .addCase(fetchTenantById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTenantById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedTenant = action.payload;
                state.error = null;
            })
            .addCase(fetchTenantById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || '获取客户信息失败';
            })
            // 创建客户
            .addCase(createTenant.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createTenant.fulfilled, (state, action) => {
                state.isLoading = false;
                state.tenants.unshift(action.payload);
                state.totalCount += 1;
                state.error = null;
            })
            .addCase(createTenant.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || '创建客户失败';
            })
            // 更新客户
            .addCase(updateTenant.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateTenant.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.tenants.findIndex(
                    t => t.tenantId === action.payload.tenantId
                );
                if (index !== -1) {
                    state.tenants[index] = action.payload;
                }
                if (state.selectedTenant?.tenantId === action.payload.tenantId) {
                    state.selectedTenant = action.payload;
                }
                state.error = null;
            })
            .addCase(updateTenant.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || '更新客户失败';
            })
            // 删除客户
            .addCase(deleteTenant.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteTenant.fulfilled, (state, action) => {
                state.isLoading = false;
                state.tenants = state.tenants.filter(
                    t => t.tenantId !== action.payload
                );
                state.totalCount -= 1;
                if (state.selectedTenant?.tenantId === action.payload) {
                    state.selectedTenant = null;
                }
                state.error = null;
            })
            .addCase(deleteTenant.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || '删除客户失败';
            })
            // 切换状态
            .addCase(toggleTenantStatus.fulfilled, (state, action) => {
                const index = state.tenants.findIndex(
                    t => t.tenantId === action.payload.tenantId
                );
                if (index !== -1) {
                    state.tenants[index] = action.payload;
                }
                if (state.selectedTenant?.tenantId === action.payload.tenantId) {
                    state.selectedTenant = action.payload;
                }
            })
            // 获取统计
            .addCase(fetchTenantStats.fulfilled, (state, action) => {
                if (state.selectedTenant) {
                    state.selectedTenant.stats = action.payload;
                }
            })
            // 导入客户
            .addCase(importTenants.fulfilled, (state, action) => {
                state.tenants = [...action.payload, ...state.tenants];
                state.totalCount += action.payload.length;
            });
    }
});

// 导出Actions
export const {
    setSelectedTenant,
    clearSelectedTenant,
    setFilters,
    resetFilters,
    setPage,
    setLimit,
    clearError,
    resetTenants
} = tenantSlice.actions;

// 导出Selectors
export const selectTenants = (state) => state.tenants.tenants;
export const selectSelectedTenant = (state) => state.tenants.selectedTenant;
export const selectTenantsLoading = (state) => state.tenants.isLoading;
export const selectTenantsError = (state) => state.tenants.error;
export const selectTenantsTotal = (state) => state.tenants.totalCount;
export const selectTenantsFilters = (state) => state.tenants.filters;
export const selectTenantsPagination = (state) => state.tenants.pagination;

export default tenantSlice.reducer;