// frontend/src/components/Reports/ReportViewer.js
import React, { useState, useEffect, useRef } from 'react';
import {
    Paper,
    Box,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Button,
    Divider,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Card,
    CardContent,
    Tabs,
    Tab,
    LinearProgress,
    Alert,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Share as ShareIcon,
    Email as EmailIcon,
    MoreVert as MoreVertIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Code as JsonIcon,
    Description as CsvIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ComposedChart,
    Scatter
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useReactToPrint } from 'react-to-print';

// 颜色主题
const COLORS = [
    '#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f',
    '#0288d1', '#388e3c', '#f57c00', '#7b1fa2', '#c62828',
    '#00897b', '#6d4c41', '#5c6bc0', '#66bb6a', '#ffa726'
];

/**
 * 报告预览组件
 * @param {Object} props
 * @param {Object} props.report - 报告数据
 * @param {boolean} props.open - 是否打开
 * @param {Function} props.onClose - 关闭回调
 * @param {Function} props.onDownload - 下载回调
 * @param {Function} props.onPrint - 打印回调
 * @param {Function} props.onShare - 分享回调
 * @param {Function} props.onEmail - 邮件发送回调
 * @param {Function} props.onExport - 导出回调
 */
function ReportViewer({
    report = null,
    open = false,
    onClose,
    onDownload,
    onPrint,
    onShare,
    onEmail,
    onExport
}) {
    const [activeTab, setActiveTab] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [chartType, setChartType] = useState('bar');
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const printRef = useRef(null);

    // 如果报告为空，不渲染
    if (!report) return null;

    // 处理标签切换
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // 处理全屏切换
    const handleFullscreenToggle = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // 监听全屏变化
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // 处理打印
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        onBeforeGetContent: () => setLoading(true),
        onAfterPrint: () => setLoading(false),
        pageStyle: '@page { margin: 20mm; }'
    });

    // 处理菜单打开
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // 处理分页变化
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'processing': return 'info';
            case 'failed': return 'error';
            case 'draft': return 'default';
            case 'submitted': return 'primary';
            default: return 'default';
        }
    };

    // 获取状态标签
    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return '✅ 已完成';
            case 'processing': return '⏳ 处理中';
            case 'failed': return '❌ 失败';
            case 'draft': return '📝 草稿';
            case 'submitted': return '📤 已提交';
            default: return status || '未知';
        }
    };

    // 格式化货币
    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '€0.00';
        return `€${Number(value).toFixed(2)}`;
    };

    // 格式化日期
    const formatDate = (date) => {
        if (!date) return '-';
        try {
            const d = typeof date === 'string' ? parseISO(date) : date;
            if (isNaN(d.getTime())) return date;
            return format(d, 'yyyy-MM-dd HH:mm');
        } catch {
            return date;
        }
    };

    // 渲染状态摘要
    const renderSummary = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography variant="caption" color="text.secondary">
                            总交易数
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {report.summary?.totalTransactions || report.transactionCount || 0}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography variant="caption" color="text.secondary">
                            净销售额
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {formatCurrency(report.summary?.totalNet || report.totalNet || 0)}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography variant="caption" color="text.secondary">
                            VAT税额
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                            {formatCurrency(report.summary?.totalVAT || report.totalVAT || 0)}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography variant="caption" color="text.secondary">
                            涉及国家
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {report.summary?.countries?.length || report.countries?.length || 0}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    // 渲染国家分布图表
    const renderCountryChart = () => {
        const data = report.summary?.countries || report.countries || [];
        if (data.length === 0) return null;

        const chartData = data.map((item, index) => ({
            name: item.name || item.country || `国家${index + 1}`,
            value: item.value || item.totalVAT || item.transactions || 0,
            color: COLORS[index % COLORS.length]
        }));

        let ChartComponent;
        switch (chartType) {
            case 'pie':
                ChartComponent = PieChart;
                break;
            case 'line':
                ChartComponent = LineChart;
                break;
            default:
                ChartComponent = BarChart;
        }

        return (
            <Box sx={{ height: 400 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        国家分布
                    </Typography>
                    <Box>
                        <Tooltip title="柱状图">
                            <IconButton size="small" onClick={() => setChartType('bar')}>
                                <BarChartIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="饼图">
                            <IconButton size="small" onClick={() => setChartType('pie')}>
                                <PieChartIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="趋势图">
                            <IconButton size="small" onClick={() => setChartType('line')}>
                                <TimelineIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        {chartType === 'pie' ? (
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                label
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        ) : chartType === 'line' ? (
                            <Line type="monotone" dataKey="value" stroke="#1976d2" />
                        ) : (
                            <Bar dataKey="value" fill="#1976d2">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        )}
                    </ChartComponent>
                </ResponsiveContainer>
            </Box>
        );
    };

    // 渲染交易明细表格
    const renderTransactionTable = () => {
        const transactions = report.transactions || [];
        const paginated = transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

        return (
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    交易明细 ({transactions.length} 条)
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                <TableCell sx={{ fontWeight: 600 }}>订单号</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>国家</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>VAT号</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>净销售额</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>税率</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>VAT税额</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>日期</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                        <Typography color="text.secondary">暂无交易数据</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map((row, index) => (
                                    <TableRow key={row.orderId || index} hover>
                                        <TableCell>{row.orderId || '-'}</TableCell>
                                        <TableCell>
                                            <Chip label={row.country} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{row.vatNumber || '-'}</TableCell>
                                        <TableCell align="right">{formatCurrency(row.netAmount || row.amount || 0)}</TableCell>
                                        <TableCell align="right">{(row.taxRate || 0.2) * 100}%</TableCell>
                                        <TableCell align="right" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                                            {formatCurrency(row.vatAmount || 0)}
                                        </TableCell>
                                        <TableCell>{formatDate(row.date || row.orderDate)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={transactions.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="每页行数:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count} 条`}
                />
            </Box>
        );
    };

    // 渲染报告信息
    const renderReportInfo = () => (
        <Box>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">报告名称</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{report.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">状态</Typography>
                    <Chip label={getStatusLabel(report.status)} color={getStatusColor(report.status)} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">申报期间</Typography>
                    <Typography variant="body1">{report.period}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">生成时间</Typography>
                    <Typography variant="body1">{formatDate(report.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">格式</Typography>
                    <Chip label={report.format?.toUpperCase() || 'XLSX'} size="small" variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">文件大小</Typography>
                    <Typography variant="body1">
                        {report.fileSize ? `${(report.fileSize / 1024).toFixed(1)} KB` : '-'}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );

    // 如果没有打开，返回null
    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isFullscreen}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    height: isFullscreen ? '100vh' : '90vh',
                    maxHeight: isFullscreen ? '100vh' : '90vh'
                }
            }}
        >
            {/* 头部 */}
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            📄 {report.name || '报告预览'}
                        </Typography>
                        <Chip
                            label={getStatusLabel(report.status)}
                            color={getStatusColor(report.status)}
                            size="small"
                        />
                    </Box>
                    <Box>
                        <Tooltip title="下载">
                            <IconButton onClick={() => onDownload && onDownload(report)}>
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="打印">
                            <IconButton onClick={handlePrint}>
                                <PrintIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="导出">
                            <IconButton onClick={() => setExportDialogOpen(true)}>
                                <ExcelIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="全屏">
                            <IconButton onClick={handleFullscreenToggle}>
                                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="关闭">
                            <IconButton onClick={onClose}>
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </DialogTitle>

            {/* 内容 */}
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {loading && <LinearProgress />}

                {/* Tabs */}
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="📊 概览" />
                        <Tab label="📈 图表分析" />
                        <Tab label="📋 明细数据" />
                        <Tab label="ℹ️ 报告信息" />
                    </Tabs>
                </Box>

                {/* Tab内容 */}
                <Box ref={printRef} sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                    {activeTab === 0 && (
                        <Box>
                            {renderSummary()}
                            <Divider sx={{ my: 3 }} />
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={8}>
                                    {renderCountryChart()}
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                            快速统计
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">平均交易额</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {formatCurrency(report.summary?.averageAmount || report.averageAmount || 0)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">最高VAT</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {formatCurrency(report.summary?.maxVAT || report.maxVAT || 0)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">平均税率</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {((report.summary?.averageRate || report.averageRate || 0.2) * 100).toFixed(1)}%
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            {renderCountryChart()}
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                趋势分析
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={report.trendData || report.summary?.trendData || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Area type="monotone" dataKey="netAmount" stackId="1" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} />
                                        <Area type="monotone" dataKey="vatAmount" stackId="1" stroke="#ed6c02" fill="#ed6c02" fillOpacity={0.3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box>
                            {renderTransactionTable()}
                        </Box>
                    )}

                    {activeTab === 3 && (
                        <Box>
                            {renderReportInfo()}
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                报告备注
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {report.notes || '无额外备注信息'}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            {/* 底部 */}
            <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                    <Tooltip title="上一条">
                        <IconButton size="small">
                            <ArrowBackIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="下一条">
                        <IconButton size="small">
                            <ArrowForwardIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Button onClick={onClose} variant="outlined">关闭</Button>
                <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
                    打印
                </Button>
            </DialogActions>

            {/* 导出对话框 */}
            <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
                <DialogTitle>导出报告</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        选择导出格式：
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<ExcelIcon />}
                            onClick={() => {
                                if (onExport) onExport('xlsx');
                                setExportDialogOpen(false);
                            }}
                        >
                            Excel
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PdfIcon />}
                            onClick={() => {
                                if (onExport) onExport('pdf');
                                setExportDialogOpen(false);
                            }}
                        >
                            PDF
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<CsvIcon />}
                            onClick={() => {
                                if (onExport) onExport('csv');
                                setExportDialogOpen(false);
                            }}
                        >
                            CSV
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<JsonIcon />}
                            onClick={() => {
                                if (onExport) onExport('json');
                                setExportDialogOpen(false);
                            }}
                        >
                            JSON
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportDialogOpen(false)}>取消</Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
}

export default ReportViewer;