// frontend/src/components/Layout/index.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Chip,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Upload as UploadIcon,
    Assessment as AssessmentIcon,
    Receipt as ReceiptIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Calculate as CalculateIcon,
    Business as BusinessIcon
} from '@mui/icons-material';

const drawerWidth = 280;

// ===== 菜单配置 =====
const menuItems = [
    { path: '/dashboard', label: '概览看板', icon: <DashboardIcon /> },
    { path: '/tenants', label: '客户管理', icon: <PeopleIcon /> },
    { path: '/upload', label: '文件上传', icon: <UploadIcon /> },
    { path: '/tax-validation', label: '税务校验', icon: <CalculateIcon /> },
    { path: '/reports', label: '申报报告', icon: <AssessmentIcon /> },
    { path: '/transactions', label: '交易记录', icon: <ReceiptIcon /> },
    { path: '/settings', label: '系统设置', icon: <SettingsIcon /> },
];

function safeParseJSON(data) {
    if (!data || data === 'undefined' || data === 'null') return {};
    try {
        return JSON.parse(data);
    } catch {
        return {};
    }
}

function Layout() {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    // ===== 获取当前用户信息 =====
    const user = safeParseJSON(localStorage.getItem('user'));
    const tenantId = localStorage.getItem('tenantId') || '未分配';

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
        navigate('/login');
        handleMenuClose();
    };

    // ===== 获取当前页面标题 =====
    const currentPage = menuItems.find(item => 
        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );

    const drawer = (
        <Box>
            {/* Logo区域 */}
            <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                borderBottom: '1px solid', 
                borderColor: 'divider' 
            }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>V</Avatar>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>VATFlow</Typography>
                    <Typography variant="caption" color="text.secondary">批量申报系统 v3.0</Typography>
                </Box>
            </Box>

            {/* ===== 租户信息显示 ===== */}
            <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                bgcolor: '#f5f5f5'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon fontSize="small" color="primary" />
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                            当前租户
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user?.company || user?.name || '未命名租户'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                            ID: {tenantId}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* 菜单列表 */}
            <List sx={{ px: 2, py: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                        <ListItem
                            button
                            component={Link}
                            to={item.path}
                            key={item.path}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                backgroundColor: isActive ? 'primary.main' : 'transparent',
                                color: isActive ? 'white' : 'text.primary',
                                '&:hover': {
                                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: isActive ? 'white' : 'inherit', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.label} 
                                primaryTypographyProps={{ 
                                    fontSize: 14, 
                                    fontWeight: isActive ? 600 : 400 
                                }} 
                            />
                            {isActive && (
                                <Chip 
                                    label="当前" 
                                    size="small" 
                                    color="secondary" 
                                    sx={{ height: 20, fontSize: 10 }} 
                                />
                            )}
                        </ListItem>
                    );
                })}
            </List>

            {/* 底部信息 */}
            <Divider sx={{ mx: 2 }} />
            <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ textAlign: 'center' }}>
                    © 2026 VATFlow
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ textAlign: 'center' }}>
                    隐私政策 | 使用条款
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* ===== 顶部导航栏 ===== */}
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    backgroundColor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* 当前页面标题 */}
                    <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {currentPage?.label || 'VATFlow'}
                    </Typography>

                    {/* ===== 租户信息（顶部右侧） ===== */}
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, mr: 2 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                            {user?.company || user?.name || '租户'}
                        </Typography>
                    </Box>

                    {/* 用户头像 */}
                    <Tooltip title="账户">
                        <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                                {user?.name?.[0] || user?.company?.[0] || 'A'}
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    {/* 用户菜单 */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled>
                            <Box>
                                <Typography variant="body2" fontWeight={600}>
                                    {user?.name || '管理员'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {user?.email || 'admin@vatflow.com'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    🏢 {user?.company || '租户'}
                                </Typography>
                            </Box>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>退出登录</ListItemText>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* ===== 侧边栏 ===== */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {/* 移动端侧边栏 */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                
                {/* 桌面端侧边栏 */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: drawerWidth, 
                            borderRight: '1px solid', 
                            borderColor: 'divider' 
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* ===== 主内容区域 ===== */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    backgroundColor: '#f8f9fa',
                    minHeight: '100vh',
                }}
            >
                {/* 占位空间（防止被顶部导航栏遮挡） */}
                <Toolbar />
                
                {/* 渲染子路由 */}
                <Outlet />
            </Box>
        </Box>
    );
}

export default Layout;