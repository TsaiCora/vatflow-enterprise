// frontend/src/components/Reports/ReportList.js
import React, { useState } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Box,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Button,
    TextField,
    InputAdornment,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import {
    Download as DownloadIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon,
    PictureAsPdf as PdfIcon,
    TableChart as TableIcon,
    Code as CodeIcon,
    Share as ShareIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * 报告列表组件
 * @param {Object} props
 * @param {Array} props.reports - 报告列表
 * @param {boolean} props.loading - 加载状态
 * @param {Function} props.onDownload - 下载回调
 * @param {Function} props.onDelete - 删除回调
 * @param {Function} props.onView - 查看回调
 * @param {Function} props.onRefresh - 刷新回调
 * @param {Function} props.onCreate - 创建报告回调
 * @param {Function} props.onShare - 分享回调
 * @param {Function} props.onEmail - 邮件发送回调
 */
function ReportList({
    reports = [],
    loading = false,
    onDownload,
    onDelete,
    onView,
    onRefresh,
    onCreate,
    onShare,
    onEmail
}) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');

    // 搜索过滤
    const filteredReports = reports.filter(report => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return report.name?.toLowerCase().includes(searchLower) ||
               report.country?.toLowerCase().includes(searchLower) ||
               report.period?.toLowerCase().includes(searchLower) ||
               report.status?.toLowerCase().includes(searchLower);
    });

    // 排序
    const sortedReports = [...filteredReports].sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortDirection === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
    });

    // 分页
    const paginatedReports = sortedReports.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleMenuOpen = (event, report) => {
        setAnchorEl(event.currentTarget);
        setSelectedReport(report);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedReport(null);
    };

    const handleDownload = () => {
        if (selectedReport && onDownload) {
            onDownload(selectedReport);
        }
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = () => {
        if (selectedReport && onDelete) {
            onDelete(selectedReport);
        }
        setDeleteDialogOpen(false);
        setSelectedReport(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const handleView = () => {
        if (selectedReport && onView) {
            onView(selectedReport);
        }
        handleMenuClose();
    };

    const handleShare = () => {
        if (selectedReport && onShare) {
            onShare(selectedReport);
        }
        handleMenuClose();
    };

    const handleEmail = () => {
        if (selectedReport && onEmail) {
            onEmail(selectedReport);
        }
        handleMenuClose();
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

    // 获取报告类型图标
    const getReportIcon = (format) => {
        switch (format) {
            case 'pdf': return <PdfIcon fontSize="small" />;
            case 'xlsx': return <TableIcon fontSize="small" />;
            case 'csv': return <TableIcon fontSize="small" />;
            case 'json': return <CodeIcon fontSize="small" />;
            default: return <TableIcon fontSize="small" />;
        }
    };

    // 格式化时间
    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            return format(date, 'yyyy-MM-dd HH:mm');
        } catch {
            return timestamp;
        }
    };

    return (
        <>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                {/* 工具栏 */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            📄 申报报告
                        </Typography>
                        <Chip
                            label={`${reports.length} 份报告`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            placeholder="搜索报告..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{ minWidth: 200 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />

                        {onRefresh && (
                            <Tooltip title="刷新">
                                <IconButton size="small" onClick={onRefresh}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {onCreate && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={onCreate}
                            >
                                生成报告
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* 表格 */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                <TableCell sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                    报告名称
                                    {sortField === 'name' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>国家</TableCell>
                                <TableCell sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('period')}>
                                    申报期间
                                    {sortField === 'period' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('transactionCount')}>
                                    交易数
                                    {sortField === 'transactionCount' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('totalVAT')}>
                                    VAT总额
                                    {sortField === 'totalVAT' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                                <TableCell sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                                    生成时间
                                    {sortField === 'createdAt' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            ⏳ 加载中...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            📭 {searchText ? '未找到匹配报告' : '暂无报告'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedReports.map((report) => (
                                    <TableRow key={report.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getReportIcon(report.format)}
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {report.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {report.country && (
                                                <Chip
                                                    label={report.country}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.65rem' }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>{report.period}</TableCell>
                                        <TableCell align="right">
                                            {report.transactionCount || 0}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            €{report.totalVAT?.toFixed(2) || '0.00'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(report.status)}
                                                color={getStatusColor(report.status)}
                                                size="small"
                                                sx={{ '& .MuiChip-label': { fontSize: '0.7rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {formatTime(report.createdAt)}
                                        </TableCell>
                                        <TableCell align="center">
                                            {onView && (
                                                <Tooltip title="查看">
                                                    <IconButton size="small" onClick={() => onView(report)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {onDownload && (
                                                <Tooltip title="下载">
                                                    <IconButton size="small" onClick={() => onDownload(report)}>
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuOpen(e, report)}
                                            >
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* 分页 */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredReports.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="每页行数:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} / ${count} 条`
                    }
                />

                {/* 操作菜单 */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={handleView}>
                        <ListItemIcon>
                            <VisibilityIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>查看详情</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleDownload}>
                        <ListItemIcon>
                            <DownloadIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>下载报告</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleShare}>
                        <ListItemIcon>
                            <ShareIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>分享</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleEmail}>
                        <ListItemIcon>
                            <EmailIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>发送邮件</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                        <ListItemIcon>
                            <DeleteIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText>删除报告</ListItemText>
                    </MenuItem>
                </Menu>
            </Paper>

            {/* 删除确认对话框 */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>确认删除</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        确定要删除报告 "{selectedReport?.name}" 吗？此操作不可撤销。
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>取消</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        删除
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default ReportList;