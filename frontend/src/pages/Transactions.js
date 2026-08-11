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
    Button,
    CircularProgress,
    Alert,
    TextField,
    MenuItem,
    Grid,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Schedule as ScheduleIcon,
    FilterList as FilterIcon,
    Assessment as AssessmentIcon,
    Receipt as ReceiptIcon
} from '@mui/icons-material';
import { transactionAPI, taxAPI } from '../services/api';

function Transactions() {
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [openDetail, setOpenDetail] = useState(false);
    const [filters, setFilters] = useState({
        tenantId: '',
        country: '',
        platform: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 获取交易列表
            const result = await transactionAPI.getTransactions(filters);
            console.log('📊 交易数据:', result);
            
            if (result && result.success) {
                setTransactions(result.data || []);
            } else {
                setTransactions([]);
            }

            // 获取统计信息
            const statsResult = await transactionAPI.getStats(filters);
            if (statsResult && statsResult.success) {
                setStats(statsResult.data);
            }
        } catch (err) {
            console.error('❌ 加载失败:', err);
            setError('加载交易数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filters]);

    // ===== 税务校验选中的交易 =====
    const handleValidateTransactions = async (ids) => {
        setLoading(true);
        try {
            const result = await taxAPI.validateBatch(ids || transactions.map(t => t.id));
            console.log('✅ 税务校验结果:', result);
            
            // 更新交易状态
            if (result && result.success) {
                setSnackbar({
                    open: true,
                    message: `✅ 税务校验完成：${result.validCount} 条通过，${result.invalidCount} 条需复核`,
                    severity: 'success'
                });
                loadData();
            }
        } catch (err) {
            setError('税务校验失败');
        } finally {
            setLoading(false);
        }
    };

    // ===== 生成申报报告 =====
    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const result = await reportAPI.generate({
                transactionIds: transactions.map(t => t.id),
                filters: filters
            });
            
            if (result && result.success) {
                setSnackbar({
                    open: true,
                    message: `✅ 报告生成成功！报告ID: ${result.reportId}`,
                    severity: 'success'
                });
                // 跳转到报告页面
                window.location.href = '/reports';
            }
        } catch (err) {
            setError('生成报告失败');
        } finally {
            setLoading(false);
        }
    };

    const getStatusChip = (status) => {
        const config = {
            pending: { label: '待处理', color: 'warning' },
            validated: { label: '已校验', color: 'success' },
            error: { label: '异常', color: 'error' },
            reported: { label: '已申报', color: 'info' }
        };
        const c = config[status] || config.pending;
        return <Chip label={c.label} color={c.color} size="small" />;
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题 + 操作按钮 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    📋 交易记录
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadData}
                        size="small"
                    >
                        刷新
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AssessmentIcon />}
                        onClick={() => handleValidateTransactions()}
                        size="small"
                        disabled={transactions.length === 0}
                    >
                        批量税务校验
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ReceiptIcon />}
                        onClick={handleGenerateReport}
                        size="small"
                        disabled={transactions.length === 0}
                    >
                        生成申报报告
                    </Button>
                </Box>
            </Box>

            {/* 统计卡片 */}
            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="textSecondary" variant="caption">总交易</Typography>
                                <Typography variant="h6">{stats.total || 0}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ bgcolor: '#fff3e0' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="textSecondary" variant="caption">待校验</Typography>
                                <Typography variant="h6" color="warning.main">{stats.pending || 0}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="textSecondary" variant="caption">已校验</Typography>
                                <Typography variant="h6" color="success.main">{stats.validated || 0}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ bgcolor: '#ffebee' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="textSecondary" variant="caption">异常</Typography>
                                <Typography variant="h6" color="error.main">{stats.error || 0}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* 筛选条件 */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="状态"
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                        >
                            <MenuItem value="">全部</MenuItem>
                            <MenuItem value="pending">待处理</MenuItem>
                            <MenuItem value="validated">已校验</MenuItem>
                            <MenuItem value="error">异常</MenuItem>
                            <MenuItem value="reported">已申报</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="开始日期"
                            InputLabelProps={{ shrink: true }}
                            value={filters.startDate}
                            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="结束日期"
                            InputLabelProps={{ shrink: true }}
                            value={filters.endDate}
                            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setFilters({ tenantId: '', country: '', platform: '', status: '', startDate: '', endDate: '' })}
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
                        <TableRow>
                            <TableCell>订单号</TableCell>
                            <TableCell>客户</TableCell>
                            <TableCell>国家</TableCell>
                            <TableCell>平台</TableCell>
                            <TableCell align="right">净额</TableCell>
                            <TableCell align="right">VAT</TableCell>
                            <TableCell align="right">总额</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell align="center">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">
                                        📭 暂无交易数据，请先上传文件
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.order_id || item.id}</TableCell>
                                    <TableCell>{item.tenant_name || '-'}</TableCell>
                                    <TableCell>{item.country}</TableCell>
                                    <TableCell>
                                        <Chip label={item.platform} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell align="right">€{item.net_amount?.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell align="right">€{item.vat_amount?.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell align="right">€{item.gross_amount?.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell>{getStatusChip(item.status)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="查看详情">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedTransaction(item);
                                                    setOpenDetail(true);
                                                }}
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 交易详情弹窗 */}
            <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth>
                <DialogTitle>交易详情</DialogTitle>
                <DialogContent>
                    {selectedTransaction && (
                        <Box sx={{ pt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">订单号</Typography>
                                    <Typography variant="body2">{selectedTransaction.order_id}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">状态</Typography>
                                    <Box>{getStatusChip(selectedTransaction.status)}</Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">客户</Typography>
                                    <Typography variant="body2">{selectedTransaction.tenant_name}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">国家</Typography>
                                    <Typography variant="body2">{selectedTransaction.country}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">平台</Typography>
                                    <Typography variant="body2">{selectedTransaction.platform}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">期间</Typography>
                                    <Typography variant="body2">{selectedTransaction.period}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="textSecondary">净额</Typography>
                                    <Typography variant="body2">€{selectedTransaction.net_amount?.toFixed(2)}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="textSecondary">VAT</Typography>
                                    <Typography variant="body2">€{selectedTransaction.vat_amount?.toFixed(2)}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="textSecondary">总额</Typography>
                                    <Typography variant="body2">€{selectedTransaction.gross_amount?.toFixed(2)}</Typography>
                                </Grid>
                            </Grid>
                            
                            {selectedTransaction.tax_validated && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    ✅ 税务校验通过
                                </Alert>
                            )}
                            {selectedTransaction.tax_validated === false && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    ❌ 税务校验异常
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetail(false)}>关闭</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Transactions;