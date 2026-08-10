// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';  // ← 修改这里！
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Tenants from './pages/Tenants';
import TaxValidation from './pages/TaxValidation';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Upload from './pages/Upload';
import Login from './pages/Login';

// 创建主题
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    console.log('🚀 APP 版本: v3.0.1 - 2026-08-10 强制更新');

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="transactions" element={<Transactions />} />
                        <Route path="tenants" element={<Tenants />} />
                        <Route path="tax-validation" element={<TaxValidation />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="upload" element={<Upload />} />
                    </Route>
                    
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;