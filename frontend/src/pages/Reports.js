// frontend/src/pages/Reports.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { reportAPI } from '../services/api';

function Reports() {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await reportAPI.getReports();
            console.log('📄 报告数据:', result);
            if (result && result.success) {
                setReports(result.data || []);
            } else if (Array.isArray(result)) {
                setReports(result);
            } else if (result && result.data) {
                setReports(result.data);
            } else {
                setReports([]);
            }
        } catch (err) {
            console.error('❌ 加载失败:', err);
            setError(typeof err === 'string' ? err : '加载报告数据失败');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>加载报告数据...</Typography>
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
                    📄 申报报告
                </Typography>
                <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadData}>
                    刷新
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>报告ID</TableCell>
                            <TableCell>名称</TableCell>
                            <TableCell>类型</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell>创建日期</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reports && reports.length > 0 ? (
                            reports.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    <TableCell>{item.id || index + 1}</TableCell>
                                    <TableCell>{item.name || item.report_name || '-'}</TableCell>
                                    <TableCell>{item.type || '报告'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={item.status || '待生成'} 
                                            color={item.status === 'completed' ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{item.created_at || item.createdAt || '-'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography sx={{ py: 4 }} color="textSecondary">
                                        暂无报告数据
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

export default Reports;