// frontend/src/components/Common/DataTable.js
import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    TextField,
    Box,
    Typography,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Refresh as RefreshIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';

/**
 * 通用数据表格组件
 * @param {Object} props
 * @param {Array} props.columns - 列配置 [{ field, headerName, width, render, align }]
 * @param {Array} props.rows - 数据行
 * @param {string} props.title - 表格标题
 * @param {boolean} props.loading - 加载状态
 * @param {Function} props.onRowClick - 行点击回调
 * @param {Array} props.actions - 每行操作按钮
 * @param {boolean} props.enableSearch - 启用搜索
 * @param {boolean} props.enableExport - 启用导出
 */
function DataTable({
    columns = [],
    rows = [],
    title = '',
    loading = false,
    onRowClick,
    actions = [],
    enableSearch = true,
    enableExport = true,
    enablePrint = true,
    enableRefresh = true,
    pageSize = 10,
    pageSizeOptions = [5, 10, 25, 50, 100]
}) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(pageSize);
    const [searchText, setSearchText] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [orderBy, setOrderBy] = useState('');
    const [orderDirection, setOrderDirection] = useState('asc');

    // 搜索过滤
    const filteredRows = rows.filter(row => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return Object.values(row).some(value =>
            String(value).toLowerCase().includes(searchLower)
        );
    });

    // 排序
    const sortedRows = [...filteredRows].sort((a, b) => {
        if (!orderBy) return 0;
        const aVal = a[orderBy] || '';
        const bVal = b[orderBy] || '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return orderDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return orderDirection === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
    });

    // 分页
    const paginatedRows = sortedRows.slice(
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
        if (orderBy === field) {
            setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setOrderBy(field);
            setOrderDirection('asc');
        }
    };

    const handleRowActionClick = (event, row) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleRowActionClose = () => {
        setAnchorEl(null);
        setSelectedRow(null);
    };

    // 导出CSV
    const handleExportCSV = () => {
        const headers = columns.map(col => col.headerName || col.field);
        const csvRows = [
            headers.join(','),
            ...sortedRows.map(row =>
                columns.map(col => {
                    let value = row[col.field];
                    if (col.render) {
                        // 如果是React元素，提取文本
                        const rendered = col.render(value, row);
                        if (typeof rendered === 'string') return `"${rendered}"`;
                        if (rendered?.props?.children) {
                            return `"${rendered.props.children}"`;
                        }
                        return `"${value}"`;
                    }
                    return `"${value || ''}"`;
                }).join(',')
            )
        ];

        const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title || '数据导出'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    // 打印
    const handlePrint = () => {
        window.print();
    };

    // 刷新
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            {/* 工具栏 */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                flexWrap: 'wrap',
                gap: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {title}
                    </Typography>
                    <Chip
                        label={`${rows.length} 条`}
                        size="small"
                        color="primary"
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {enableSearch && (
                        <TextField
                            size="small"
                            placeholder="搜索..."
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
                    )}

                    {enableRefresh && (
                        <IconButton size="small" onClick={handleRefresh} title="刷新">
                            <RefreshIcon />
                        </IconButton>
                    )}

                    {enableExport && (
                        <IconButton size="small" onClick={handleExportCSV} title="导出CSV">
                            <DownloadIcon />
                        </IconButton>
                    )}

                    {enablePrint && (
                        <IconButton size="small" onClick={handlePrint} title="打印">
                            <PrintIcon />
                        </IconButton>
                    )}

                    <IconButton size="small" title="筛选">
                        <FilterListIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* 表格 */}
            <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={col.field}
                                    align={col.align || 'left'}
                                    style={{
                                        minWidth: col.minWidth || 100,
                                        maxWidth: col.maxWidth,
                                        fontWeight: 'bold',
                                        backgroundColor: '#fafafa',
                                        cursor: col.sortable !== false ? 'pointer' : 'default'
                                    }}
                                    onClick={() => col.sortable !== false && handleSort(col.field)}
                                >
                                    {col.headerName || col.field}
                                    {orderBy === col.field && (
                                        <span style={{ marginLeft: 4 }}>
                                            {orderDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </TableCell>
                            ))}
                            {(actions.length > 0 || onRowClick) && (
                                <TableCell
                                    align="center"
                                    style={{
                                        fontWeight: 'bold',
                                        backgroundColor: '#fafafa',
                                        minWidth: 60
                                    }}
                                >
                                    操作
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                                    align="center"
                                    sx={{ py: 4 }}
                                >
                                    <Typography color="text.secondary">
                                        ⏳ 加载中...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : paginatedRows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                                    align="center"
                                    sx={{ py: 4 }}
                                >
                                    <Typography color="text.secondary">
                                        📭 暂无数据
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRows.map((row, index) => (
                                <TableRow
                                    key={row.id || index}
                                    hover={!!onRowClick}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    sx={{
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        '&:hover': {
                                            backgroundColor: onRowClick ? 'action.hover' : 'inherit'
                                        }
                                    }}
                                >
                                    {columns.map((col) => (
                                        <TableCell
                                            key={col.field}
                                            align={col.align || 'left'}
                                        >
                                            {col.render
                                                ? col.render(row[col.field], row)
                                                : row[col.field] || '-'}
                                        </TableCell>
                                    ))}
                                    {(actions.length > 0 || onRowClick) && (
                                        <TableCell align="center">
                                            {actions.length > 0 && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRowActionClick(e, row);
                                                    }}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 分页 */}
            <TablePagination
                rowsPerPageOptions={pageSizeOptions}
                component="div"
                count={filteredRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} / ${count} 条`
                }
            />

            {/* 行操作菜单 */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleRowActionClose}
            >
                {actions.map((action, index) => (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            action.onClick(selectedRow);
                            handleRowActionClose();
                        }}
                    >
                        {action.icon && <span style={{ marginRight: 8 }}>{action.icon}</span>}
                        {action.label}
                    </MenuItem>
                ))}
            </Menu>
        </Paper>
    );
}

export default DataTable;