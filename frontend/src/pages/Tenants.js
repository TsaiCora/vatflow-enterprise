// frontend/src/pages/Tenants.js
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
    TablePagination,
    Chip,
    IconButton,
    Button,
    LinearProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    MenuItem,
    InputAdornment,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    CheckCircle as CheckCircleIcon,
    Block as BlockIcon
} from '@mui/icons-material';

function Tenants() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('add');
    const [formData, setFormData] = useState({
        tenantId: '',
        name: '',
        email: '',
        password: '',
        company: '',
        country: 'GB',
        vatNumber: '',
        platform: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [countries, setCountries] = useState([]);
    const [platforms, setPlatforms] = useState([]);

    const loadCountries = async () => {
        try {
            const response = await fetch('/api/v1/countries');
            const result = await response.json();
            if (result.success) setCountries(result.data);
        } catch (error) {
            console.error('❌ 加载国家失败:', error);
        }
    };

    const loadPlatforms = async () => {
        try {
            const response = await fetch('/api/v1/platforms');
            const result = await response.json();
            if (result.success) setPlatforms(result.data);
        } catch (error) {
            console.error('❌ 加载平台失败:', error);
        }
    };

    const loadTenants = async () => {
        setLoading(true);
        try {
            let url = `/api/v1/tenants?page=${page + 1}&limit=${rowsPerPage}`;
            if (search) url += `&search=${search}`;
            
            console.log('📤 加载客户:', url);
            const response = await fetch(url);
            const result = await response.json();
            console.log('📥 客户数据:', result);
            
            if (result.success) {
                setTenants(result.data || []);
                setTotal(result.data?.length || 0);
            } else {
                setSnackbar({ open: true, message: result.error || '加载客户失败', severity: 'error' });
            }
        } catch (error) {
            console.error('❌ 加载客户失败:', error);
            setSnackbar({ open: true, message: '网络错误，请检查后端', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTenants();
        loadCountries();
        loadPlatforms();
    }, [page, rowsPerPage, search]);

    const handleRefresh = () => {
        loadTenants();
        loadCountries();
        loadPlatforms();
        setSnackbar({ open: true, message: '✅ 已刷新', severity: 'success' });
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const handleAdd = () => {
        setFormMode('add');
        setFormData({
            tenantId: `client_${Date.now()}`,
            name: '',
            email: '',
            password: '',
            company: '',
            country: 'GB',
            vatNumber: '',
            platform: ''
        });
        setEditingId(null);
        setFormOpen(true);
    };

    const handleEdit = (tenant) => {
        setFormMode('edit');
        setFormData({
            tenantId: tenant.tenant_id || '',
            name: tenant.name || '',
            email: tenant.email || '',
            password: '',
            company: tenant.company || '',
            country: tenant.country || 'GB',
            vatNumber: tenant.vat_number || '',
            platform: ''
        });
        setEditingId(tenant.tenant_id || '');
        setFormOpen(true);
    };

    const handleFormSubmit = async () => {
        try {
            if (formMode === 'add' && !formData.password) {
                setSnackbar({ open: true, message: '请设置密码', severity: 'error' });
                return;
            }

            const url = formMode === 'add' 
                ? '/api/v1/tenants' 
                : `/api/v1/tenants/${editingId}`;
            
            const method = formMode === 'add' ? 'POST' : 'PUT';
            
            const body = {
                tenant_id: formData.tenantId,
                name: formData.name,
                email: formData.email,
                password: formData.password,
                company: formData.company,
                country: formData.country,
                vat_number: formData.vatNumber,
                role: 'user'
            };
            
            if (formMode === 'edit' && !formData.password) {
                delete body.password;
            }
            
            console.log(`📤 ${method} 客户:`, body);
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            console.log('📥 响应:', result);
            
            if (result.success) {
                setSnackbar({
                    open: true,
                    message: formMode === 'add' ? '✅ 客户创建成功' : '✅ 客户已更新',
                    severity: 'success'
                });
                setFormOpen(false);
                loadTenants();
            } else {
                setSnackbar({
                    open: true,
                    message: result.error || '操作失败',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('❌ 提交失败:', error);
            setSnackbar({ open: true, message: '网络错误，请检查后端', severity: 'error' });
        }
    };

    const handleToggleStatus = async (tenant) => {
        try {
            const id = tenant.tenant_id || '';
            console.log('🔄 切换状态:', id);
            const response = await fetch(`/api/v1/tenants/${id}/toggle`, {
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.success) {
                setSnackbar({
                    open: true,
                    message: '✅ 客户状态已切换',
                    severity: 'success'
                });
                loadTenants();
            } else {
                setSnackbar({ open: true, message: result.error || '切换失败', severity: 'error' });
            }
        } catch (error) {
            console.error('❌ 切换失败:', error);
            setSnackbar({ open: true, message: '网络错误', severity: 'error' });
        }
    };

    const handleDeleteClick = (tenant) => {
        setDeleteTarget(tenant);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        
        try {
            const id = deleteTarget.tenant_id || '';
            console.log('🗑️ 删除客户:', id);
            const response = await fetch(`/api/v1/tenants/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                setSnackbar({
                    open: true,
                    message: '✅ 客户已删除',
                    severity: 'success'
                });
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
                loadTenants();
            } else {
                setSnackbar({ open: true, message: result.error || '删除失败', severity: 'error' });
            }
        } catch (error) {
            console.error('❌ 删除失败:', error);
            setSnackbar({ open: true, message: '网络错误', severity: 'error' });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
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
            active: { color: 'success', label: '✅ 活跃' },
            inactive: { color: 'default', label: '⛔ 停用' },
            pending: { color: 'warning', label: '⏳ 待审核' },
            deleted: { color: 'error', label: '🗑️ 已删除' }
        };
        const config = configs[status] || configs.pending;
        return <Chip color={config.color} label={config.label} size="small" />;
    };

    const getCountryName = (code) => {
        const found = countries.find(c => c.code === code);
        return found ? `${found.name} (${found.code})` : code || '未知';
    };

    const renderForm = () => (
        <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
                {formMode === 'add' ? '➕ 新增客户' : '✏️ 编辑客户'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        label="客户ID"
                        value={formData.tenantId}
                        disabled
                        fullWidth
                        helperText="客户ID自动生成，不可修改"
                    />
                    <TextField
                        label="客户名称"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        required
                    />
                    <TextField
                        label="邮箱"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        fullWidth
                        required
                    />
                    {formMode === 'add' && (
                        <TextField
                            label="密码"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            fullWidth
                            helperText="密码至少6位"
                            required
                        />
                    )}
                    {formMode === 'edit' && (
                        <TextField
                            label="新密码（留空则不修改）"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            fullWidth
                            helperText="如需修改密码，输入新密码（至少6位）"
                        />
                    )}
                    <TextField
                        label="公司名称"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        select
                        label="国家"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        fullWidth
                    >
                        {countries.map((c) => (
                            <MenuItem key={c.code} value={c.code}>
                                {c.name} ({c.code}) - {c.vat_rate}%
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="VAT号码"
                        value={formData.vatNumber}
                        onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                        fullWidth
                        placeholder="例如: GB123456789"
                    />
                    <TextField
                        select
                        label="绑定平台（可选）"
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        fullWidth
                    >
                        <MenuItem value="">不绑定</MenuItem>
                        {platforms.map((p) => (
                            <MenuItem key={p.code} value={p.code}>
                                {p.icon} {p.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setFormOpen(false)}>取消</Button>
                <Button onClick={handleFormSubmit} variant="contained" color="primary">
                    {formMode === 'add' ? '创建' : '保存'}
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderDeleteDialog = () => (
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
            <DialogTitle>确认删除</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    确定要删除客户 <strong>"{deleteTarget?.name}"</strong> 吗？
                    <br /><br />
                    此操作将删除该客户的所有关联数据，不可撤销。
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDeleteCancel}>取消</Button>
                <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                    确认删除
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    👥 客户管理
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        placeholder="搜索客户..."
                        value={search}
                        onChange={handleSearch}
                        sx={{ minWidth: 200 }}
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
                    <Tooltip title="刷新">
                        <IconButton size="small" onClick={handleRefresh}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                    >
                        新增客户
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>客户ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>姓名</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>公司</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>邮箱</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>国家</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>VAT号</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tenants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        📭 {search ? '未找到匹配客户' : '暂无客户'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenants.map((tenant) => (
                                <TableRow key={tenant.tenant_id} hover>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                        {tenant.tenant_id}
                                    </TableCell>
                                    <TableCell>{tenant.name}</TableCell>
                                    <TableCell>{tenant.company || '-'}</TableCell>
                                    <TableCell>{tenant.email}</TableCell>
                                    <TableCell>{getCountryName(tenant.country)}</TableCell>
                                    <TableCell>{tenant.vat_number || '-'}</TableCell>
                                    <TableCell>{getStatusChip(tenant.status)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="编辑">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleEdit(tenant)}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={tenant.status === 'active' ? '停用' : '激活'}>
                                            <IconButton
                                                size="small"
                                                color={tenant.status === 'active' ? 'warning' : 'success'}
                                                onClick={() => handleToggleStatus(tenant)}
                                            >
                                                {tenant.status === 'active' ? (
                                                    <BlockIcon fontSize="small" />
                                                ) : (
                                                    <CheckCircleIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="删除">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteClick(tenant)}
                                            >
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

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
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

            {renderForm()}
            {renderDeleteDialog()}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Tenants;