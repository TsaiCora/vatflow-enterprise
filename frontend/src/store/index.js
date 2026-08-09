import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './slices/dashboardSlice';

const store = configureStore({
    reducer: {
        dashboard: dashboardReducer,
    },
    devTools: process.env.NODE_ENV !== 'production'
});

export default store;  // ✅ 关键：确保是 export default