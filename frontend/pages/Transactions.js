// frontend/src/pages/Transactions.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
    TextField,
    MenuItem,
    Chip,
    IconButton,
    Tooltip,
    InputAdornment,
    LinearProgress,
    Button,
    Grid
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { fetchTransactions, exportTransactions } from '../store/slices/transactionSlice';

function Transactions() {
    const dispatch = useDispatch();
    const { transactions, loading, total } = useSelector((state) => state.transactions || { transactions: [], loading: false, total: 0 });
    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        country: '',
        status: ''
    });

    useEffect(() => {
        loadTransactions();
    }, [page, rowsPerPage, search, filters]);

    const loadTransactions = async () => {
        await dispatch(fetchTransactions({
            page: page + 1,
            limit: rowsPerPage,
            search,
            ...filters
        }));
    };

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

    const handleExport = async () => {
        await dispatch(exportTransactions({ search, ...filters }));
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusChip = (status) => {
        const configs = {
            completed: { color: 'success', label: '已申报' },
            pending: { color: 'warning', label: '待处理' },
            failed: { color: 'error', label: '失败' },
            processing: { color: 'info', label: '处理中' }
        };
        const config = configs[status] || configs.pending;
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '€0.00';
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
                        <IconButton size="small" onClick={loadTransactions}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* 筛选条件 */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            size="small"
                            placeholder="搜索订单号或VAT号..."
                            value={search}
                            onChange={handleSearch}
                            fullWidth
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
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select
                            size="small"
                            label="国家"
                            value={filters.country}
                            onChange={handleFilterChange('country')}
                            fullWidth
                        >
                            <MenuItem value="">全部</MenuItem>
                            <MenuItem value="GB">🇬🇧 英国</MenuItem>
                            <MenuItem value="FR">🇫🇷 法国</MenuItem>
                            <MenuItem value="DE">🇩🇪 德国</MenuItem>
                            <MenuItem value="IT">🇮🇹 意大利</MenuItem>
                            <MenuItem value="ES">🇪🇸 西班牙</MenuItem>
                            <MenuItem value="NL">🇳🇱 荷兰</MenuItem>
                            <MenuItem value="BE">🇧🇪 比利时</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select
                            size="small"
                            label="状态"
                            value={filters.status}
                            onChange={handleFilterChange('status')}
                            fullWidth
                        >
                            <MenuItem value="">全部</MenuItem>
                            <MenuItem value="completed">✅ 已申报</MenuItem>
                            <MenuItem value="pending">⏳ 待处理</MenuItem>
                            <MenuItem value="processing">🔄 处理中</MenuItem>
                            <MenuItem value="failed">❌ 失败</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={handleClearFilters}
                            startIcon={<FilterListIcon />}
                        >
                            清除筛选
                        </Button>
                    </Grid>
                </Grid>
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
        </Box>
    );
}

export default Transactions;