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
    Chip,
    Grid,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    Divider,
    Snackbar
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    GetApp as DownloadIcon,
    Visibility as VisibilityIcon,
    Print as PrintIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Assessment as AssessmentIcon,
    Close as CloseIcon
} from '@mui/icons-material';

function Reports() {
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [openDetail, setOpenDetail] = useState(false);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            
            const response = await fetch('https://api.vatapex.com/api/v1/reports', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || ''
                }
            });
            
            if (!response.ok) {
                setReports([]);
                setLoading(false);
                return;
            }
            
            const result = await response.json();
            console.log('📄 报告数据:', result);
            
            if (result && result.success) {
                setReports(result.data || []);
                const summaryData = calculateSummary(result.data);
                setSummary(summaryData);
            } else {
                setReports([]);
            }
        } catch (err) {
            console.error('❌ 加载失败:', err);
            setError('加载报告数据失败');
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const calculateSummary = (data) => {
        if (!data || data.length === 0) return null;
        
        let totalTransactions = 0;
        let totalNetAmount = 0;
        let totalVATAmount = 0;
        let totalGrossAmount = 0;
        let validatedCount = 0;

        data.forEach(report => {
            totalTransactions += report.transaction_count || 0;
            totalNetAmount += report.total_net || 0;
            totalVATAmount += report.total_vat || 0;
            totalGrossAmount += report.total_gross || 0;
            if (report.status === 'validated' || report.status === 'submitted') validatedCount++;
        });

        return {
            totalReports: data.length,
            totalTransactions,
            totalNetAmount,
            totalVATAmount,
            totalGrossAmount,
            validatedCount,
            validationRate: data.length > 0 ? (validatedCount / data.length * 100).toFixed(1) : 0
        };
    };

    const handleExport = async (reportId, format = 'json') => {
        try {
            // 查找报告数据
            const report = reports.find(r => r.filing_id === reportId || r.id === reportId);
            if (!report) {
                setSnackbar({ open: true, message: '报告不存在', severity: 'error' });
                return;
            }
            
            // 导出为JSON
            const exportData = {
                ...report,
                exportedAt: new Date().toISOString(),
                reportType: '申报报告'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `报告_${reportId}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            setSnackbar({ open: true, message: '✅ 导出成功', severity: 'success' });
        } catch (err) {
            console.error('❌ 导出失败:', err);
            setSnackbar({ open: true, message: '导出失败', severity: 'error' });
        }
    };

    const getStatusChip = (status) => {
        const config = {
            draft: { label: '📝 草稿', color: 'default' },
            validated: { label: '✅ 已校验', color: 'success' },
            submitted: { label: '📤 已申报', color: 'info' },
            approved: { label: '✅ 已批准', color: 'success' },
            rejected: { label: '❌ 已驳回', color: 'error' }
        };
        const c = config[status] || config.draft;
        return <Chip label={c.label} color={c.color} size="small" />;
    };

    const getStatusColor = (status) => {
        const config = {
            draft: '#f5f5f5',
            validated: '#e8f5e9',
            submitted: '#e3f2fd',
            approved: '#e8f5e9',
            rejected: '#ffebee'
        };
        return config[status] || '#f5f5f5';
    };

    // 获取租户名称（从localStorage）
    const getTenantName = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user?.company || user?.name || '当前租户';
        } catch {
            return '当前租户';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* 页面标题 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    📄 申报报告
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadData}
                        size="small"
                    >
                        刷新
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* 汇总卡片 */}
            {summary && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="textSecondary" variant="caption">报告总数</Typography>
                                <Typography variant="h6">{summary.totalReports}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="textSecondary" variant="caption">总交易</Typography>
                                <Typography variant="h6">{summary.totalTransactions}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="textSecondary" variant="caption">总VAT</Typography>
                                <Typography variant="h6">€{summary.totalVATAmount.toFixed(2)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ bgcolor: summary.validationRate > 80 ? '#e8f5e9' : '#fff3e0' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="textSecondary" variant="caption">校验通过率</Typography>
                                <Typography variant="h6">{summary.validationRate}%</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* 报告列表 */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>报告名称</TableCell>
                            <TableCell>客户</TableCell>
                            <TableCell>国家</TableCell>
                            <TableCell align="right">交易数</TableCell>
                            <TableCell align="right">VAT总额</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell>创建日期</TableCell>
                            <TableCell align="center">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">
                                        📭 暂无申报报告
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((item) => (
                                <TableRow key={item.filing_id || item.id} sx={{ bgcolor: getStatusColor(item.status) }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {item.name || `报告-${(item.filing_id || item.id).slice(-6)}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{getTenantName()}</TableCell>
                                    <TableCell>{item.country || 'GB'}</TableCell>
                                    <TableCell align="right">{item.transaction_count || 0}</TableCell>
                                    <TableCell align="right">€{(item.total_vat || 0).toFixed(2)}</TableCell>
                                    <TableCell>{getStatusChip(item.status)}</TableCell>
                                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="查看详情">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedReport(item);
                                                    setOpenDetail(true);
                                                }}
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="导出JSON">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleExport(item.filing_id || item.id, 'json')}
                                            >
                                                <DownloadIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 报告详情弹窗 */}
            <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">📄 报告详情</Typography>
                        <Box>
                            <Tooltip title="导出JSON">
                                <IconButton onClick={() => handleExport(selectedReport?.filing_id || selectedReport?.id, 'json')}>
                                    <DownloadIcon />
                                </IconButton>
                            </Tooltip>
                            <IconButton onClick={() => setOpenDetail(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedReport && (
                        <Box sx={{ pt: 1 }}>
                            {/* 报告信息 */}
                            <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="textSecondary">报告名称</Typography>
                                        <Typography variant="body2">{selectedReport.name || `报告-${selectedReport.filing_id?.slice(-6) || ''}`}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="textSecondary">状态</Typography>
                                        <Box>{getStatusChip(selectedReport.status)}</Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="textSecondary">创建日期</Typography>
                                        <Typography variant="body2">{new Date(selectedReport.created_at).toLocaleString()}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="textSecondary">客户</Typography>
                                        <Typography variant="body2">{getTenantName()}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="textSecondary">国家</Typography>
                                        <Typography variant="body2">{selectedReport.country || 'GB'}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="textSecondary">期间</Typography>
                                        <Typography variant="body2">{selectedReport.period || 'N/A'}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* 财务汇总 */}
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Card sx={{ bgcolor: '#e3f2fd' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="textSecondary">总净额</Typography>
                                            <Typography variant="h6">€{(selectedReport.total_net || 0).toFixed(2)}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={4}>
                                    <Card sx={{ bgcolor: '#e8f5e9' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="textSecondary">总VAT</Typography>
                                            <Typography variant="h6">€{(selectedReport.total_vat || 0).toFixed(2)}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={4}>
                                    <Card sx={{ bgcolor: '#fff3e0' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="textSecondary">总金额</Typography>
                                            <Typography variant="h6">€{(selectedReport.total_gross || 0).toFixed(2)}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* 税务校验结果 */}
                            {selectedReport.tax_result && (
                                <Paper sx={{ p: 2, mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>税务校验结果</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Chip 
                                            label={selectedReport.tax_result.valid ? '✅ 通过' : '❌ 需复核'}
                                            color={selectedReport.tax_result.valid ? 'success' : 'error'}
                                        />
                                        <Typography variant="body2">
                                            差异: €{(selectedReport.tax_result.difference || 0).toFixed(2)}
                                        </Typography>
                                    </Box>
                                    {selectedReport.tax_result.notes && (
                                        <Alert severity="info" sx={{ mt: 1 }}>
                                            {selectedReport.tax_result.notes}
                                        </Alert>
                                    )}
                                </Paper>
                            )}

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                                报告ID: {selectedReport.filing_id || selectedReport.id}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetail(false)}>关闭</Button>
                    <Button 
                        variant="contained" 
                        startIcon={<DownloadIcon />} 
                        onClick={() => handleExport(selectedReport?.filing_id || selectedReport?.id, 'json')}
                    >
                        导出JSON
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Reports;