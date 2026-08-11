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
    Divider
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    GetApp as DownloadIcon,
    Visibility as VisibilityIcon,
    Print as PrintIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { reportAPI, taxAPI } from '../services/api';

function Reports() {
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [openDetail, setOpenDetail] = useState(false);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await reportAPI.getReports();
            console.log('📄 报告数据:', result);
            
            if (result && result.success) {
                setReports(result.data || []);
                // 计算汇总
                const summaryData = calculateSummary(result.data);
                setSummary(summaryData);
            } else {
                setReports([]);
            }
        } catch (err) {
            console.error('❌ 加载失败:', err);
            setError('加载报告数据失败');
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
            if (report.status === 'validated') validatedCount++;
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

    const handleExport = async (reportId, format = 'pdf') => {
        try {
            const result = await reportAPI.download(reportId, format);
            // 下载文件
            if (result && result.success) {
                const blob = new Blob([result.data], { type: 'application/' + format });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `报告_${reportId}.${format}`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('❌ 导出失败:', err);
            setError('导出失败');
        }
    };

    const getStatusChip = (status) => {
        const config = {
            draft: { label: '草稿', color: 'default' },
            validated: { label: '已校验', color: 'success' },
            submitted: { label: '已申报', color: 'info' },
            approved: { label: '已批准', color: 'success' },
            rejected: { label: '已驳回', color: 'error' }
        };
        const c = config[status] || config.draft;
        return <Chip label={c.label} color={c.color} size="small" />;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    📄 申报报告
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={loadData}
                >
                    刷新
                </Button>
            </Box>

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
                                <TableRow key={item.id}>
                                    <TableCell>{item.name || `报告-${item.id}`}</TableCell>
                                    <TableCell>{item.tenant_name || '-'}</TableCell>
                                    <TableCell>{item.country}</TableCell>
                                    <TableCell align="right">{item.transaction_count || 0}</TableCell>
                                    <TableCell align="right">€{item.total_vat?.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell>{getStatusChip(item.status)}</TableCell>
                                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="查看">
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
                                        <Tooltip title="导出PDF">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleExport(item.id, 'pdf')}
                                            >
                                                <DownloadIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="导出Excel">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleExport(item.id, 'xlsx')}
                                            >
                                                <PrintIcon fontSize="small" />
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
                            <IconButton onClick={() => handleExport(selectedReport?.id, 'pdf')}>
                                <DownloadIcon />
                            </IconButton>
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
                                        <Typography variant="body2">{selectedReport.name}</Typography>
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
                                        <Typography variant="body2">{selectedReport.tenant_name}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="textSecondary">国家</Typography>
                                        <Typography variant="body2">{selectedReport.country}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="textSecondary">期间</Typography>
                                        <Typography variant="body2">{selectedReport.period}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* 财务汇总 */}
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Card sx={{ bgcolor: '#e3f2fd' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="textSecondary">总净额</Typography>
                                            <Typography variant="h6">€{selectedReport.total_net?.toFixed(2) || '0.00'}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={4}>
                                    <Card sx={{ bgcolor: '#e8f5e9' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="textSecondary">总VAT</Typography>
                                            <Typography variant="h6">€{selectedReport.total_vat?.toFixed(2) || '0.00'}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={4}>
                                    <Card sx={{ bgcolor: '#fff3e0' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="textSecondary">总金额</Typography>
                                            <Typography variant="h6">€{selectedReport.total_gross?.toFixed(2) || '0.00'}</Typography>
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
                                            差异: €{selectedReport.tax_result.difference?.toFixed(2) || '0.00'}
                                        </Typography>
                                    </Box>
                                    {selectedReport.tax_result.notes && (
                                        <Alert severity="info" sx={{ mt: 1 }}>
                                            {selectedReport.tax_result.notes}
                                        </Alert>
                                    )}
                                </Paper>
                            )}

                            {/* 交易列表 */}
                            {selectedReport.transactions && selectedReport.transactions.length > 0 && (
                                <>
                                    <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>交易明细</Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>订单号</TableCell>
                                                    <TableCell align="right">净额</TableCell>
                                                    <TableCell align="right">VAT</TableCell>
                                                    <TableCell align="right">总额</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedReport.transactions.slice(0, 10).map((t) => (
                                                    <TableRow key={t.id}>
                                                        <TableCell>{t.order_id}</TableCell>
                                                        <TableCell align="right">€{t.net_amount?.toFixed(2)}</TableCell>
                                                        <TableCell align="right">€{t.vat_amount?.toFixed(2)}</TableCell>
                                                        <TableCell align="right">€{t.gross_amount?.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetail(false)}>关闭</Button>
                    <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => handleExport(selectedReport?.id, 'pdf')}>
                        导出PDF
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Reports;