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
    TablePagination,
    Chip,
    TextField,
    MenuItem,
    InputAdornment,
    IconButton,
    Tooltip,
    Button,
    LinearProgress,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    Clear as ClearIcon
} from '@mui/icons-material';

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        country: '',
        status: ''
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // =============================================
    // 加载交易数据
    // =============================================
    const loadTransactions = async () => {
        setLoading(true);
        try {
            let url = `/api/v1/transactions?page=${page + 1}&limit=${rowsPerPage}`;
            if (search) url += `&search=${search}`;
            if (filters.country) url += `&country=${filters.country}`;
            if (filters.status) url += `&status=${filters.status}`;
            
            console.log('📤 加载交易:', url);
            const response = await fetch(url);
            const result = await response.json();
            console.log('📥 交易数据:', result);
            
            if (result.success) {
                setTransactions(result.data || []);
                setTotal(result.pagination?.total || 0);
            } else {
                setSnackbar({ open: true, message: result.error || '加载交易失败', severity: 'error' });
            }
        } catch (error) {
            console.error('❌ 加载交易失败:', error);
            setSnackbar({ open: true, message: '网络错误，请检查后端', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, [page, rowsPerPage, search, filters]);

    // =============================================
    // 手动刷新
    // =============================================
    const handleRefresh = () => {
        loadTransactions();
        setSnackbar({ open: true, message: '✅ 已刷新', severity: 'success' });
    };

    // =============================================
    // 搜索和筛选
    // =============================================
    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const handleFilterChange = (field) => (e) => {
        setFilters({ ...filters, [field]: e.target.value });
        setPage(0);
    };

    const handleClearFilters = () => {
        setFilters({ country: '', status: '' });
        setSearch('');
        setPage(0);
    };

    // =============================================
    // 导出数据
    // =============================================
    const handleExport = async () => {
        try {
            setSnackbar({ open: true, message: '正在导出...', severity: 'info' });
            let url = `/api/v1/transactions/export`;
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filters.country) params.append('country', filters.country);
            if (filters.status) params.append('status', filters.status);
            if (params.toString()) url += `?${params.toString()}`;
            
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            setSnackbar({ open: true, message: '✅ 导出成功', severity: 'success' });
        } catch (error) {
            console.error('❌ 导出失败:', error);
            setSnackbar({ open: true, message: '导出失败', severity: 'error' });
        }
    };

    // =============================================
    // 分页
    // =============================================
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // =============================================
    // 状态标签
    // =============================================
    const getStatusChip = (status) => {
        const configs = {
            completed: { color: 'success', label: '✅ 已处理' },
            pending: { color: 'warning', label: '⏳ 待处理' },
            processing: { color: 'info', label: '🔄 处理中' },
            failed: { color: 'error', label: '❌ 失败' }
        };
        const config = configs[status] || configs.pending;
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    const formatCurrency = (value) => {
        if (!value) return '€0.00';
        return `€${Number(value).toFixed(2)}`;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    📋 交易记录
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="导出数据">
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={handleExport}
                        >
                            导出
                        </Button>
                    </Tooltip>
                    <Tooltip title="刷新">
                        <IconButton size="small" onClick={handleRefresh}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* 筛选条件 */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="搜索订单号或VAT号..."
                        value={search}
                        onChange={handleSearch}
                        sx={{ minWidth: 200, flex: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: search && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearch('')}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        select
                        size="small"
                        label="国家"
                        value={filters.country}
                        onChange={handleFilterChange('country')}
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="">全部</MenuItem>
                        <MenuItem value="GB">🇬🇧 英国</MenuItem>
                        <MenuItem value="FR">🇫🇷 法国</MenuItem>
                        <MenuItem value="DE">🇩🇪 德国</MenuItem>
                        <MenuItem value="IT">🇮🇹 意大利</MenuItem>
                        <MenuItem value="ES">🇪🇸 西班牙</MenuItem>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label="状态"
                        value={filters.status}
                        onChange={handleFilterChange('status')}
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="">全部</MenuItem>
                        <MenuItem value="completed">✅ 已处理</MenuItem>
                        <MenuItem value="pending">⏳ 待处理</MenuItem>
                        <MenuItem value="processing">🔄 处理中</MenuItem>
                        <MenuItem value="failed">❌ 失败</MenuItem>
                    </TextField>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleClearFilters}
                        startIcon={<ClearIcon />}
                    >
                        清除筛选
                    </Button>
                </Box>
            </Paper>

            {/* 交易列表 */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                            <TableCell sx={{ fontWeight: 600 }}>订单号</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>国家</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>VAT号</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>净销售额</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>税率</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>VAT税额</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>交易日期</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        📭 {search || filters.country || filters.status ? '未找到匹配交易' : '暂无交易记录'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{tx.orderId}</TableCell>
                                    <TableCell>
                                        <Chip label={tx.country} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                        {tx.vatNumber || '-'}
                                    </TableCell>
                                    <TableCell align="right">{formatCurrency(tx.netAmount)}</TableCell>
                                    <TableCell align="right">{((tx.taxRate || 0.2) * 100).toFixed(1)}%</TableCell>
                                    <TableCell align="right" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                                        {formatCurrency(tx.vatAmount)}
                                    </TableCell>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell>{getStatusChip(tx.status)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} / ${count} 条`
                }
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Transactions;