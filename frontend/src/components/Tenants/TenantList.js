// frontend/src/components/Tenants/TenantsList.js
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
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Switch,
    FormControlLabel,
    Grid,
    Card,
    CardContent,
    LinearProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Business as BusinessIcon,
    Public as PublicIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    FileCopy as FileCopyIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * 客户列表组件
 * @param {Object} props
 * @param {Array} props.tenants - 客户列表
 * @param {boolean} props.loading - 加载状态
 * @param {Function} props.onAdd - 添加客户回调
 * @param {Function} props.onEdit - 编辑客户回调
 * @param {Function} props.onDelete - 删除客户回调
 * @param {Function} props.onView - 查看客户回调
 * @param {Function} props.onToggleStatus - 切换状态回调
 * @param {Function} props.onRefresh - 刷新回调
 * @param {Function} props.onExport - 导出回调
 */
function TenantsList({
    tenants = [],
    loading = false,
    onAdd,
    onEdit,
    onDelete,
    onView,
    onToggleStatus,
    onRefresh,
    onExport
}) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');

    // 搜索过滤
    const filteredTenants = tenants.filter(tenant => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (tenant.name?.toLowerCase().includes(searchLower) ||
                tenant.email?.toLowerCase().includes(searchLower) ||
                tenant.company?.toLowerCase().includes(searchLower) ||
                tenant.tenantId?.toLowerCase().includes(searchLower) ||
                tenant.vatNumber?.toLowerCase().includes(searchLower));
    });

    // 排序
    const sortedTenants = [...filteredTenants].sort((a, b) => {
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
    const paginatedTenants = sortedTenants.slice(
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

    const handleMenuOpen = (event, tenant) => {
        setAnchorEl(event.currentTarget);
        setSelectedTenant(tenant);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedTenant(null);
    };

    const handleEdit = () => {
        if (selectedTenant && onEdit) {
            onEdit(selectedTenant);
        }
        handleMenuClose();
    };

    const handleView = () => {
        if (selectedTenant && onView) {
            onView(selectedTenant);
        }
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = () => {
        if (selectedTenant && onDelete) {
            onDelete(selectedTenant);
        }
        setDeleteDialogOpen(false);
        setSelectedTenant(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const handleToggleStatus = () => {
        if (selectedTenant && onToggleStatus) {
            onToggleStatus(selectedTenant);
        }
        handleMenuClose();
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'default';
            case 'deleted': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    // 获取状态标签
    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return '✅ 活跃';
            case 'inactive': return '⛔ 停用';
            case 'deleted': return '🗑️ 已删除';
            case 'pending': return '⏳ 待审核';
            default: return status || '未知';
        }
    };

    // 获取国家旗帜
    const getCountryFlag = (country) => {
        const flags = {
            'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸',
            'AT': '🇦🇹', 'BE': '🇧🇪', 'BG': '🇧🇬', 'HR': '🇭🇷', 'CY': '🇨🇾',
            'CZ': '🇨🇿', 'DK': '🇩🇰', 'EE': '🇪🇪', 'FI': '🇫🇮', 'GR': '🇬🇷',
            'HU': '🇭🇺', 'IE': '🇮🇪', 'LV': '🇱🇻', 'LT': '🇱🇹', 'LU': '🇱🇺',
            'MT': '🇲🇹', 'NL': '🇳🇱', 'PL': '🇵🇱', 'PT': '🇵🇹', 'RO': '🇷🇴',
            'SK': '🇸🇰', 'SI': '🇸🇮', 'SE': '🇸🇪'
        };
        return flags[country] || '🌍';
    };

    // 格式化时间
    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            return format(date, 'yyyy-MM-dd');
        } catch {
            return timestamp;
        }
    };

    // 生成随机颜色
    const getAvatarColor = (name) => {
        const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1', '#388e3c', '#f57c00'];
        const index = name?.length % colors.length || 0;
        return colors[index];
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
                            👥 客户管理
                        </Typography>
                        <Chip
                            label={`${tenants.length} 个客户`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${tenants.filter(t => t.status === 'active').length} 活跃`}
                            size="small"
                            color="success"
                            variant="outlined"
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            placeholder="搜索客户..."
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

                        {onExport && (
                            <Tooltip title="导出">
                                <IconButton size="small" onClick={onExport}>
                                    <DownloadIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {onAdd && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={onAdd}
                            >
                                新增客户
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* 加载状态 */}
                {loading && <LinearProgress />}

                {/* 表格 */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                <TableCell sx={{ fontWeight: 600 }}>客户</TableCell>
                                <TableCell sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('tenantId')}>
                                    客户ID
                                    {sortField === 'tenantId' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>公司</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>国家</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>VAT号</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                                <TableCell sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                                    创建时间
                                    {sortField === 'createdAt' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedTenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            📭 {searchText ? '未找到匹配客户' : '暂无客户'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTenants.map((tenant) => (
                                    <TableRow key={tenant.tenantId || tenant.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: getAvatarColor(tenant.name),
                                                        width: 36,
                                                        height: 36,
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    {tenant.name?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {tenant.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {tenant.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                {tenant.tenantId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <BusinessIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {tenant.company || '-'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${getCountryFlag(tenant.country)} ${tenant.country}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                {tenant.vatNumber || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(tenant.status)}
                                                color={getStatusColor(tenant.status)}
                                                size="small"
                                                sx={{ '& .MuiChip-label': { fontSize: '0.7rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {formatTime(tenant.createdAt)}
                                        </TableCell>
                                        <TableCell align="center">
                                            {onView && (
                                                <Tooltip title="查看">
                                                    <IconButton size="small" onClick={() => onView(tenant)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {onEdit && (
                                                <Tooltip title="编辑">
                                                    <IconButton size="small" onClick={() => onEdit(tenant)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuOpen(e, tenant)}
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
                    count={filteredTenants.length}
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
                    <MenuItem onClick={handleEdit}>
                        <ListItemIcon>
                            <EditIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>编辑</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleToggleStatus}>
                        <ListItemIcon>
                            {selectedTenant?.status === 'active' ? (
                                <BlockIcon fontSize="small" color="warning" />
                            ) : (
                                <CheckCircleIcon fontSize="small" color="success" />
                            )}
                        </ListItemIcon>
                        <ListItemText>
                            {selectedTenant?.status === 'active' ? '停用' : '激活'}
                        </ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                        <ListItemIcon>
                            <DeleteIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText>删除</ListItemText>
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
                        确定要删除客户 "{selectedTenant?.name}" 吗？此操作将删除该客户的所有数据，包括交易记录和报告，且不可撤销。
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>取消</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        确认删除
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default TenantsList;