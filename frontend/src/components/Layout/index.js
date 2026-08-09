// frontend/src/components/Layout/index.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    Calculate as CalculateIcon
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
    { path: '/dashboard', label: '概览看板', icon: <DashboardIcon /> },
    { path: '/tenants', label: '客户管理', icon: <PeopleIcon /> },
    { path: '/upload', label: '文件上传', icon: <UploadIcon /> },
    { path: '/tax', label: '税务校验', icon: <CalculateIcon /> },
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

function Layout({ children }) {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

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
        navigate('/login');
        handleMenuClose();
    };

    const user = safeParseJSON(localStorage.getItem('user'));

    const drawer = (
        <Box>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>V</Avatar>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>VATFlow</Typography>
                    <Typography variant="caption" color="text.secondary">批量申报系统 v3.0</Typography>
                </Box>
            </Box>

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

                    <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {menuItems.find(item => item.path === location.pathname)?.label || 'VATFlow'}
                    </Typography>

                    <Tooltip title="账户">
                        <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                                {user?.name?.[0] || 'A'}
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled>
                            <Box>
                                <Typography variant="body2" fontWeight={600}>{user?.name || '管理员'}</Typography>
                                <Typography variant="caption" color="text.secondary">{user?.email || 'admin@vatflow.com'}</Typography>
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

            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
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
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* ===== main 区域：硬编码内容，不依赖 children ===== */}
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
                <Toolbar />
                <Typography variant="h2" color="error" sx={{ p: 3 }}>
                    🔴 Layout 强制内容
                </Typography>
                <Typography variant="body1" sx={{ p: 3 }}>
                    如果你看到这段文字，说明 Layout 正常渲染！
                </Typography>
                {/* 完全删除 {children}，不依赖路由传递 */}
            </Box>
        </Box>
    );
}

export default Layout;