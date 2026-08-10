// frontend/src/pages/Transactions.js
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
    IconButton,
    CircularProgress,
    Alert,
    Button,
    TextField,
    MenuItem,
    Grid
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { transactionAPI } from '../services/api';

function Transactions() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 获取交易列表
            const result = await transactionAPI.getTransactions();
            console.log('📊 交易数据:', result);
            if (result && result.success) {
                setTransactions(result.data || []);
            } else {
                // 如果API返回格式不同，尝试直接使用
                if (Array.isArray(result)) {
                    setTransactions(result);
                } else if (result && result.data) {
                    setTransactions(result.data);
                } else {
                    setTransactions([]);
                }
            }
            
            // 获取统计信息
            try {
                const statsResult = await transactionAPI.getStats();
                if (statsResult && statsResult.success) {
                    setStats(statsResult.data);
                }
            } catch (statsErr) {
                console.log('统计信息获取失败:', statsErr);
            }
            
        } catch (err) {
            console.error('❌ 加载失败:', err);
            setError(typeof err === 'string' ? err : '加载交易数据失败');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>加载交易数据...</Typography>
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
                    📋 交易记录
                </Typography>
                <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadData}>
                    刷新
                </Button>
            </Box>

            {/* 统计卡片 */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="textSecondary">总交易</Typography>
                            <Typography variant="h4">{stats.total || 0}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="textSecondary">进行中</Typography>
                            <Typography variant="h4" color="warning.main">{stats.pending || 0}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="textSecondary">已完成</Typography>
                            <Typography variant="h4" color="success.main">{stats.completed || 0}</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* 交易列表 */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>交易编号</TableCell>
                            <TableCell>类型</TableCell>
                            <TableCell>金额</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell>日期</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions && transactions.length > 0 ? (
                            transactions.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    <TableCell>{item.id || index + 1}</TableCell>
                                    <TableCell>{item.transaction_id || item.id || '-'}</TableCell>
                                    <TableCell>{item.type || '交易'}</TableCell>
                                    <TableCell>€{item.amount || item.total || 0}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={item.status || '待处理'} 
                                            color={item.status === 'completed' ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{item.created_at || item.date || '-'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography sx={{ py: 4 }} color="textSecondary">
                                        暂无交易数据
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

export default Transactions;