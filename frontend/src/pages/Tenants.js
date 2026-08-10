// frontend/src/pages/Tenants.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import { Refresh as RefreshIcon, Add as AddIcon } from '@mui/icons-material';
import { tenantAPI } from '../services/api';

function Tenants() {
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await tenantAPI.getTenants();
            console.log('🏢 租户数据:', result);
            if (result && result.success) {
                setTenants(result.data || []);
            } else if (Array.isArray(result)) {
                setTenants(result);
            } else if (result && result.data) {
                setTenants(result.data);
            } else {
                setTenants([]);
            }
        } catch (err) {
            console.error('❌ 加载失败:', err);
            setError(typeof err === 'string' ? err : '加载租户数据失败');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>加载租户数据...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
                <Button startIcon={<RefreshIcon />} onClick={loadData} sx={{ mt: 2 }}>
                    重试
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    🏢 客户管理
                </Typography>
                <Box>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadData} sx={{ mr: 1 }}>
                        刷新
                    </Button>
                    <Button variant="contained" color="primary" startIcon={<AddIcon />}>
                        添加租户
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>租户名称</TableCell>
                            <TableCell>联系人</TableCell>
                            <TableCell>邮箱</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell>创建日期</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tenants && tenants.length > 0 ? (
                            tenants.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    <TableCell>{item.id || index + 1}</TableCell>
                                    <TableCell>{item.name || item.tenant_name || '-'}</TableCell>
                                    <TableCell>{item.contact || '-'}</TableCell>
                                    <TableCell>{item.email || '-'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={item.status || '活跃'} 
                                            color={item.status === 'inactive' ? 'default' : 'success'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{item.created_at || item.createdAt || '-'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography sx={{ py: 4 }} color="textSecondary">
                                        暂无租户数据
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default Tenants;