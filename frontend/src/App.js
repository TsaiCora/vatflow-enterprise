// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// 直接在 App.js 中定义页面组件
function DashboardPage() {
    return <h1 style={{color:'red', fontSize:30, padding:20}}>📊 Dashboard 页面</h1>;
}

function TenantsPage() {
    return <h1 style={{color:'blue', fontSize:30, padding:20}}>👥 客户管理页面</h1>;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="tenants" element={<TenantsPage />} />
                    <Route path="upload" element={<h1>文件上传</h1>} />
                    <Route path="tax" element={<h1>税务校验</h1>} />
                    <Route path="reports" element={<h1>申报报告</h1>} />
                    <Route path="transactions" element={<h1>交易记录</h1>} />
                    <Route path="settings" element={<h1>系统设置</h1>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;"// trigger deploy" 
"// Build version: 2026-08-10-v2" 
