// frontend/src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tenantReducer from './slices/tenantSlice';
import fileReducer from './slices/fileSlice';

// 创建 Redux Store
export const store = configureStore({
    reducer: {
        auth: authReducer,
        tenants: tenantReducer,
        files: fileReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // 忽略非序列化警告（如 Date 对象）
                ignoredActions: ['persist/PERSIST'],
                ignoredActionPaths: ['payload.blob'],
                ignoredPaths: ['files.selectedFile.blob']
            }
        }),
    devTools: process.env.NODE_ENV !== 'production'
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 导出 Hooks
export * from './hooks';