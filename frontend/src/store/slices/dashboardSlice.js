// frontend/src/store/slices/dashboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// 异步获取看板数据
export const fetchDashboardData = createAsyncThunk(
    'dashboard/fetchData',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/dashboard');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.message || '获取看板数据失败');
        }
    }
);

const initialState = {
    data: {
        totalTenants: 0,
        monthlyTransactions: 0,
        totalVAT: 0,
        successRate: 0,
        monthlyTrend: [],
        countryDistribution: [],
        recentActivities: []
    },
    loading: false,
    error: null
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setDashboardData: (state, action) => {
            state.data = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload || state.data;
                state.error = null;
            })
            .addCase(fetchDashboardData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || '获取看板数据失败';
            });
    }
});

export const { setDashboardData, setLoading, setError, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;