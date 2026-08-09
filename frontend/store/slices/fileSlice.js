// frontend/src/store/slices/fileSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 获取初始状态
const getInitialState = () => ({
    files: [],
    selectedFile: null,
    processingJobs: [],
    isLoading: false,
    isUploading: false,
    error: null,
    uploadProgress: 0,
    filters: {
        status: 'all',
        platform: 'all',
        search: ''
    },
    pagination: {
        page: 1,
        limit: 20,
        totalPages: 0
    },
    stats: {
        totalFiles: 0,
        processing: 0,
        completed: 0,
        failed: 0
    }
});

// 异步获取文件列表
export const fetchFiles = createAsyncThunk(
    'files/fetchAll',
    async ({ page = 1, limit = 20, status, platform, search } = {}, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);
            if (status && status !== 'all') params.append('status', status);
            if (platform && platform !== 'all') params.append('platform', platform);
            if (search) params.append('search', search);

            const response = await axios.get(`/api/v1/files?${params.toString()}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '获取文件列表失败'
            );
        }
    }
);

// 异步上传文件
export const uploadFiles = createAsyncThunk(
    'files/upload',
    async ({ files, onProgress }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await axios.post('/api/v1/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percent = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(percent);
                    }
                }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '文件上传失败'
            );
        }
    }
);

// 异步获取处理状态
export const fetchProcessingStatus = createAsyncThunk(
    'files/fetchStatus',
    async (jobId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/v1/files/status/${jobId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '获取处理状态失败'
            );
        }
    }
);

// 异步下载文件
export const downloadFile = createAsyncThunk(
    'files/download',
    async (fileId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/v1/files/download/${fileId}`, {
                responseType: 'blob'
            });
            return { fileId, blob: response.data };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '文件下载失败'
            );
        }
    }
);

// 异步删除文件
export const deleteFile = createAsyncThunk(
    'files/delete',
    async (fileId, { rejectWithValue }) => {
        try {
            await axios.delete(`/api/v1/files/${fileId}`);
            return fileId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '文件删除失败'
            );
        }
    }
);

// 异步获取文件统计
export const fetchFileStats = createAsyncThunk(
    'files/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/api/v1/files/stats');
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '获取文件统计失败'
            );
        }
    }
);

// 异步批量删除文件
export const batchDeleteFiles = createAsyncThunk(
    'files/batchDelete',
    async (fileIds, { rejectWithValue }) => {
        try {
            await axios.post('/api/v1/files/batch-delete', { fileIds });
            return fileIds;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '批量删除失败'
            );
        }
    }
);

// 异步重试处理
export const retryProcessing = createAsyncThunk(
    'files/retry',
    async (fileId, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/api/v1/files/${fileId}/retry`);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || '重试处理失败'
            );
        }
    }
);

const fileSlice = createSlice({
    name: 'files',
    initialState: getInitialState(),
    reducers: {
        // 设置选中的文件
        setSelectedFile: (state, action) => {
            state.selectedFile = action.payload;
        },
        // 清空选中的文件
        clearSelectedFile: (state) => {
            state.selectedFile = null;
        },
        // 设置上传进度
        setUploadProgress: (state, action) => {
            state.uploadProgress = action.payload;
        },
        // 设置过滤器
        setFileFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
            state.pagination.page = 1;
        },
        // 重置过滤器
        resetFileFilters: (state) => {
            state.filters = getInitialState().filters;
            state.pagination.page = 1;
        },
        // 设置页码
        setFilePage: (state, action) => {
            state.pagination.page = action.payload;
        },
        // 设置每页数量
        setFileLimit: (state, action) => {
            state.pagination.limit = action.payload;
            state.pagination.page = 1;
        },
        // 清空错误
        clearFileError: (state) => {
            state.error = null;
        },
        // 重置文件状态
        resetFiles: () => getInitialState(),
        // 更新处理任务状态
        updateJobStatus: (state, action) => {
            const { jobId, status } = action.payload;
            const job = state.processingJobs.find(j => j.id === jobId);
            if (job) {
                job.status = status;
                job.updatedAt = new Date().toISOString();
            }
        },
        // 添加处理任务
        addProcessingJob: (state, action) => {
            state.processingJobs.push({
                ...action.payload,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        },
        // 移除处理任务
        removeProcessingJob: (state, action) => {
            state.processingJobs = state.processingJobs.filter(
                j => j.id !== action.payload
            );
        }
    },
    extraReducers: (builder) => {
        builder
            // 获取文件列表
            .addCase(fetchFiles.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchFiles.fulfilled, (state, action) => {
                state.isLoading = false;
                state.files = action.payload.data || [];
                state.pagination.totalPages = action.payload.pagination?.totalPages || 0;
                state.error = null;
            })
            .addCase(fetchFiles.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || '获取文件列表失败';
            })
            // 上传文件
            .addCase(uploadFiles.pending, (state) => {
                state.isUploading = true;
                state.error = null;
                state.uploadProgress = 0;
            })
            .addCase(uploadFiles.fulfilled, (state, action) => {
                state.isUploading = false;
                state.uploadProgress = 100;
                state.files.unshift(...(action.payload.data?.files || []));
                state.error = null;
                // 添加处理任务
                if (action.payload.data?.jobId) {
                    state.processingJobs.push({
                        id: action.payload.data.jobId,
                        status: 'processing',
                        createdAt: new Date().toISOString()
                    });
                }
            })
            .addCase(uploadFiles.rejected, (state, action) => {
                state.isUploading = false;
                state.uploadProgress = 0;
                state.error = action.payload || '文件上传失败';
            })
            // 获取处理状态
            .addCase(fetchProcessingStatus.fulfilled, (state, action) => {
                const { jobId, status, progress, result } = action.payload.data;
                const job = state.processingJobs.find(j => j.id === jobId);
                if (job) {
                    job.status = status;
                    job.progress = progress;
                    job.result = result;
                    job.updatedAt = new Date().toISOString();
                }
                // 如果处理完成，更新文件状态
                if (status === 'completed' || status === 'failed') {
                    const file = state.files.find(f => f.jobId === jobId);
                    if (file) {
                        file.status = status === 'completed' ? 'completed' : 'failed';
                        file.processedAt = new Date().toISOString();
                    }
                }
            })
            // 删除文件
            .addCase(deleteFile.fulfilled, (state, action) => {
                state.files = state.files.filter(f => f.id !== action.payload);
                if (state.selectedFile?.id === action.payload) {
                    state.selectedFile = null;
                }
            })
            // 批量删除
            .addCase(batchDeleteFiles.fulfilled, (state, action) => {
                const fileIds = action.payload;
                state.files = state.files.filter(f => !fileIds.includes(f.id));
                if (state.selectedFile && fileIds.includes(state.selectedFile.id)) {
                    state.selectedFile = null;
                }
            })
            // 获取统计
            .addCase(fetchFileStats.fulfilled, (state, action) => {
                state.stats = action.payload;
            })
            // 重试处理
            .addCase(retryProcessing.fulfilled, (state, action) => {
                const file = state.files.find(f => f.id === action.payload.fileId);
                if (file) {
                    file.status = 'processing';
                    file.retryCount = (file.retryCount || 0) + 1;
                }
            });
    }
});

// 导出Actions
export const {
    setSelectedFile,
    clearSelectedFile,
    setUploadProgress,
    setFileFilters,
    resetFileFilters,
    setFilePage,
    setFileLimit,
    clearFileError,
    resetFiles,
    updateJobStatus,
    addProcessingJob,
    removeProcessingJob
} = fileSlice.actions;

// 导出Selectors
export const selectFiles = (state) => state.files.files;
export const selectSelectedFile = (state) => state.files.selectedFile;
export const selectFileLoading = (state) => state.files.isLoading;
export const selectFileUploading = (state) => state.files.isUploading;
export const selectUploadProgress = (state) => state.files.uploadProgress;
export const selectFileError = (state) => state.files.error;
export const selectProcessingJobs = (state) => state.files.processingJobs;
export const selectFileStats = (state) => state.files.stats;
export const selectFileFilters = (state) => state.files.filters;
export const selectFilePagination = (state) => state.files.pagination;

export default fileSlice.reducer;