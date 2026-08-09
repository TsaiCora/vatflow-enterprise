// frontend/src/pages/Reports.js
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
    LinearProgress,
    Snackbar,
    Alert,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    Visibility as VisibilityIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

function Reports() {
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const loadReports = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/reports');
            const result = await response.json();
            console.log('📊 报告数据:', result);
            if (result.success) {
                setReports(result.data || []);
            } else {
                setSnackbar({ open: true, message: result.error || '加载失败', severity: 'error' });
            }
        } catch (error) {
            console.error('❌ 加载失败:', error);
            setSnackbar({ open: true, message: '网络错误', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const getStatusChip = (status) => {
        const configs = {
            draft: { color: 'default', label: '草稿' },
            submitted: { color: 'primary', label: '已提交' },
            filed: { color: 'success', label: '已申报' },
            error: { color: 'error', label: '错误' },
            completed: { color: 'success', label: '已完成' }
        };
        const config = configs[status] || configs.draft;
        return <Chip color={config.color} label={config.label} size="small" />;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    📊 申报报告
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadReports}
                    disabled={loading}
                >
                    刷新
                </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>申报编号</TableCell>
                            <TableCell>租户</TableCell>
                            <TableCell>期间</TableCell>
                            <TableCell>国家</TableCell>
                            <TableCell align="right">净额</TableCell>
                            <TableCell align="right">VAT</TableCell>
                            <TableCell align="right">总额</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell align="center">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        📭 暂无申报报告
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report) => (
                                <TableRow key={report.id} hover>
                                    <TableCell>{report.filing_number || '-'}</TableCell>
                                    <TableCell>{report.tenant_id}</TableCell>
                                    <TableCell>{report.period}</TableCell>
                                    <TableCell>{report.country}</TableCell>
                                    <TableCell align="right">{report.total_net?.toFixed(2) || 0}</TableCell>
                                    <TableCell align="right">{report.total_vat?.toFixed(2) || 0}</TableCell>
                                    <TableCell align="right">{report.total_gross?.toFixed(2) || 0}</TableCell>
                                    <TableCell>{getStatusChip(report.status)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="查看">
                                            <IconButton size="small" color="primary">
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="下载">
                                            <IconButton size="small" color="secondary">
                                                <DownloadIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="删除">
                                            <IconButton size="small" color="error">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
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