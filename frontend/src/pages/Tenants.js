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
    Chip,
    Button,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Tooltip,
    Snackbar,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon
} from '@mui/icons-material';

function Tenants() {
    const [loading, setLoading] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        tenant_id: '',
        name: '',
        email: '',
        password: '',
        company: '',
        country: 'GB',
        vat_number: '',
        role: 'user'
    });

    const COUNTRIES = [
        { code: 'GB', name: '英国' },
        { code: 'FR', name: '法国' },
        { code: 'DE', name: '德国' },
        { code: 'IT', name: '意大利' },
        { code: 'ES', name: '西班牙' },
        { code: 'NL', name: '荷兰' },
        { code: 'BE', name: '比利时' },
        { code: 'PL', name: '波兰' },
        { code: 'SE', name: '瑞典' },
        { code: 'JP', name: '日本' },
        { code: 'SG', name: '新加坡' },
        { code: 'US', name: '美国' },
        { code: 'CA', name: '加拿大' },
        { code: 'AU', name: '澳大利亚' },
        { code: 'CN', name: '中国' },
    ];

    // ===== 加载租户列表 =====
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';

            console.log('🔑 Token:', token ? '存在' : '不存在');
            console.log('🏢 Tenant ID:', tenantId);
            console.log('👤 User Role:', userRole);

            const response = await fetch('https://api.vatapex.com/api/v1/tenants', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || '',
                    'X-User-Role': userRole
                }
            });

            console.log('📊 响应状态:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('🏢 租户数据:', result);

            if (result && result.success) {
                setTenants(result.data || []);
            } else {
                setTenants([]);
                setError(result?.error || '加载租户数据失败');
            }
        } catch (err) {
            console.error('❌ 加载失败:', err);
            setError(err.message || '加载租户数据失败');
            setTenants([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ===== 打开创建弹窗 =====
    const handleOpenCreate = () => {
        setIsEditing(false);
        setFormData({
            tenant_id: '',
            name: '',
            email: '',
            password: '',
            company: '',
            country: 'GB',
            vat_number: '',
            role: 'user'
        });
        setOpenDialog(true);
    };

    // ===== 打开编辑弹窗 =====
    const handleOpenEdit = (tenant) => {
        setIsEditing(true);
        setFormData({
            tenant_id: tenant.tenant_id,
            name: tenant.name || '',
            email: tenant.email || '',
            password: '',
            company: tenant.company || '',
            country: tenant.country || 'GB',
            vat_number: tenant.vat_number || '',
            role: tenant.role || 'user'
        });
        setOpenDialog(true);
    };

    // ===== 保存租户 =====
    const handleSave = async () => {
        if (!formData.tenant_id || !formData.name || !formData.email) {
            setSnackbar({ open: true, message: '请填写必填字段', severity: 'warning' });
            return;
        }

        if (!isEditing && !formData.password) {
            setSnackbar({ open: true, message: '请设置密码', severity: 'warning' });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            let url = 'https://api.vatapex.com/api/v1/tenants';
            let method = 'POST';
            
            if (isEditing) {
                url = `https://api.vatapex.com/api/v1/tenants/${formData.tenant_id}`;
                method = 'PUT';
            }
            
            const { password, ...updateData } = formData;
            const body = isEditing ? updateData : formData;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || '',
                    'X-User-Role': userRole
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();
            console.log('📥 保存结果:', result);

            if (result && result.success) {
                setSnackbar({
                    open: true,
                    message: isEditing ? '✅ 租户更新成功' : '✅ 租户创建成功',
                    severity: 'success'
                });
                setOpenDialog(false);
                loadData();
            } else {
                setSnackbar({
                    open: true,
                    message: result?.error || '操作失败',
                    severity: 'error'
                });
            }
        } catch (err) {
            console.error('❌ 保存失败:', err);
            setSnackbar({
                open: true,
                message: typeof err === 'string' ? err : '操作失败',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // ===== 删除租户 =====
    const handleDelete = async (tenantId) => {
        if (!confirm('确定要删除这个租户吗？')) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const tenantIdCurrent = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            const response = await fetch(`https://api.vatapex.com/api/v1/tenants/${tenantId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantIdCurrent || '',
                    'X-User-Role': userRole
                }
            });

            const result = await response.json();
            if (result && result.success) {
                setSnackbar({ open: true, message: '✅ 租户删除成功', severity: 'success' });
                loadData();
            } else {
                setSnackbar({ open: true, message: result?.error || '删除失败', severity: 'error' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: '删除失败', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // ===== 状态芯片 =====
    const getStatusChip = (status) => {
        const config = {
            active: { label: '活跃', color: 'success' },
            inactive: { label: '停用', color: 'default' }
        };
        const c = config[status] || config.active;
        return <Chip label={c.label} color={c.color} size="small" />;
    };

    // ===== 角色芯片 =====
    const getRoleChip = (role) => {
        if (role === 'admin') {
            return <Chip label="管理员" size="small" color="primary" />;
        }
        return <Chip label="用户" size="small" color="default" />;
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* ===== 页面标题 ===== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    🏢 客户管理
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
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
                        size="small"
                    >
                        添加租户
                    </Button>
                </Box>
            </Box>

            {/* ===== 错误提示 ===== */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* ===== 统计卡片 ===== */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="textSecondary" variant="caption">总租户</Typography>
                            <Typography variant="h6">{tenants.length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: '#e8f5e9' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="textSecondary" variant="caption">活跃</Typography>
                            <Typography variant="h6" color="success.main">
                                {tenants.filter(t => t.status === 'active').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: '#ffebee' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="textSecondary" variant="caption">停用</Typography>
                            <Typography variant="h6" color="error.main">
                                {tenants.filter(t => t.status === 'inactive').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ===== 租户列表 ===== */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>租户ID</TableCell>
                            <TableCell>名称</TableCell>
                            <TableCell>公司</TableCell>
                            <TableCell>邮箱</TableCell>
                            <TableCell>国家</TableCell>
                            <TableCell>角色</TableCell>
                            <TableCell>状态</TableCell>
                            <TableCell>创建日期</TableCell>
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
                        ) : tenants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">暂无租户数据</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenants.map((item) => (
                                <TableRow key={item.tenant_id}>
                                    <TableCell>
                                        <Chip label={item.tenant_id} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.company || '-'}</TableCell>
                                    <TableCell>{item.email}</TableCell>
                                    <TableCell>{item.country || '-'}</TableCell>
                                    <TableCell>{getRoleChip(item.role)}</TableCell>
                                    <TableCell>{getStatusChip(item.status)}</TableCell>
                                    <TableCell>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="编辑">
                                            <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="删除">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(item.tenant_id)}>
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

            {/* ===== 创建/编辑弹窗 ===== */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">{isEditing ? '✏️ 编辑租户' : '➕ 添加租户'}</Typography>
                        <IconButton onClick={() => setOpenDialog(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="租户ID *"
                            value={formData.tenant_id}
                            onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
                            fullWidth
                            disabled={isEditing}
                            helperText={isEditing ? '租户ID不可修改' : '唯一标识，例如: tenant_001'}
                        />
                        <TextField
                            label="名称 *"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            fullWidth
                        />
                        <TextField
                            label="公司名称"
                            value={formData.company}
                            onChange={(e) => setFormData({...formData, company: e.target.value})}
                            fullWidth
                        />
                        <TextField
                            label="邮箱 *"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            fullWidth
                        />
                        {!isEditing && (
                            <TextField
                                label="密码 *"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                fullWidth
                                helperText="至少6位"
                            />
                        )}
                        <FormControl fullWidth>
                            <InputLabel>国家</InputLabel>
                            <Select
                                value={formData.country}
                                onChange={(e) => setFormData({...formData, country: e.target.value})}
                                label="国家"
                            >
                                {COUNTRIES.map((c) => (
                                    <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="VAT号码"
                            value={formData.vat_number}
                            onChange={(e) => setFormData({...formData, vat_number: e.target.value})}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>角色</InputLabel>
                            <Select
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                label="角色"
                            >
                                <MenuItem value="admin">管理员</MenuItem>
                                <MenuItem value="user">用户</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>取消</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? '保存中...' : (isEditing ? '更新' : '创建')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== Snackbar ===== */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({...snackbar, open: false})}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Tenants;