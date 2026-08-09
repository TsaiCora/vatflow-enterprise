// frontend/src/components/Files/FileList.js
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
    Alert
} from '@mui/material';
import {
    Download as DownloadIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    CloudUpload as CloudUploadIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon,
    Image as ImageIcon,
    Description as DescriptionIcon,
    TableChart as TableChartIcon,
    Code as CodeIcon,
    Folder as FolderIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// 文件图标映射
const FILE_ICONS = {
    csv: <TableChartIcon fontSize="small" />,
    xlsx: <TableChartIcon fontSize="small" />,
    xls: <TableChartIcon fontSize="small" />,
    json: <CodeIcon fontSize="small" />,
    txt: <DescriptionIcon fontSize="small" />,
    pdf: <DescriptionIcon fontSize="small" />,
    zip: <FolderIcon fontSize="small" />,
    png: <ImageIcon fontSize="small" />,
    jpg: <ImageIcon fontSize="small" />,
    jpeg: <ImageIcon fontSize="small" />
};

/**
 * 文件列表组件
 * @param {Object} props
 * @param {Array} props.files - 文件列表
 * @param {boolean} props.loading - 加载状态
 * @param {Function} props.onDownload - 下载回调
 * @param {Function} props.onDelete - 删除回调
 * @param {Function} props.onView - 查看回调
 * @param {Function} props.onRefresh - 刷新回调
 * @param {Function} props.onUpload - 上传回调
 * @param {string} props.title - 标题
 */
function FileList({
    files = [],
    loading = false,
    onDownload,
    onDelete,
    onView,
    onRefresh,
    onUpload,
    title = '文件列表'
}) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');

    // 搜索过滤
    const filteredFiles = files.filter(file => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return file.name?.toLowerCase().includes(searchLower) ||
               file.platform?.toLowerCase().includes(searchLower) ||
               file.status?.toLowerCase().includes(searchLower);
    });

    // 排序
    const sortedFiles = [...filteredFiles].sort((a, b) => {
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
    const paginatedFiles = sortedFiles.slice(
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

    const handleMenuOpen = (event, file) => {
        setAnchorEl(event.currentTarget);
        setSelectedFile(file);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedFile(null);
    };

    const handleDownload = () => {
        if (selectedFile && onDownload) {
            onDownload(selectedFile);
        }
        handleMenuClose();
    };

    const handleDelete = () => {
        if (selectedFile && onDelete) {
            onDelete(selectedFile);
        }
        handleMenuClose();
    };

    const handleView = () => {
        if (selectedFile && onView) {
            onView(selectedFile);
        }
        handleMenuClose();
    };

    // 获取文件图标
    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop().toLowerCase();
        return FILE_ICONS[ext] || <DescriptionIcon fontSize="small" />;
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'processing': return 'info';
            case 'failed': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    // 获取状态标签
    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return '已完成';
            case 'processing': return '处理中';
            case 'failed': return '失败';
            case 'pending': return '待处理';
            default: return status || '未知';
        }
    };

    // 获取状态图标
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon fontSize="small" />;
            case 'processing': return <ScheduleIcon fontSize="small" />;
            case 'failed': return <ErrorIcon fontSize="small" />;
            case 'pending': return <PendingIcon fontSize="small" />;
            default: return null;
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
                        {title}
                    </Typography>
                    <Chip
                        label={`${files.length} 个文件`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder="搜索文件..."
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

                    {onUpload && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            onClick={onUpload}
                        >
                            上传文件
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
                                文件名
                                {sortField === 'name' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>平台</TableCell>
                            <TableCell sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('size')}>
                                大小
                                {sortField === 'size' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                            <TableCell sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                                上传时间
                                {sortField === 'createdAt' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        ⏳ 加载中...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : paginatedFiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        📭 {searchText ? '未找到匹配文件' : '暂无文件'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedFiles.map((file) => (
                                <TableRow key={file.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getFileIcon(file.name)}
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {file.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {file.platform && (
                                            <Chip
                                                label={file.platform.toUpperCase()}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.65rem' }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getStatusLabel(file.status)}
                                            color={getStatusColor(file.status)}
                                            size="small"
                                            icon={getStatusIcon(file.status)}
                                            sx={{
                                                '& .MuiChip-label': { fontSize: '0.7rem' },
                                                '& .MuiChip-icon': { fontSize: '0.8rem' }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {formatTime(file.createdAt)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {onView && (
                                            <Tooltip title="查看">
                                                <IconButton size="small" onClick={() => onView(file)}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {onDownload && (
                                            <Tooltip title="下载">
                                                <IconButton size="small" onClick={() => onDownload(file)}>
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {onDelete && (
                                            <Tooltip title="删除">
                                                <IconButton size="small" onClick={() => onDelete(file)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, file)}
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
                count={filteredFiles.length}
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
                    <ListItemText>查看</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDownload}>
                    <ListItemIcon>
                        <DownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>下载</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>删除</ListItemText>
                </MenuItem>
            </Menu>
        </Paper>
    );
}

export default FileList;