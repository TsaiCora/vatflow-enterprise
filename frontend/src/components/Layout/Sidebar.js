// frontend/src/components/Layout/Sidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 260;

const DrawerStyled = styled(Drawer)({
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
    },
});

const menuItems = [
    { text: '概览看板', icon: <DashboardIcon />, path: '/dashboard' },
    { text: '客户管理', icon: <PeopleIcon />, path: '/tenants' },
    { text: '文件上传', icon: <CloudUploadIcon />, path: '/upload' },
    { text: '申报报告', icon: <DescriptionIcon />, path: '/reports' },
    { text: '交易记录', icon: <ReceiptIcon />, path: '/transactions' },
    { text: '系统设置', icon: <SettingsIcon />, path: '/settings' },
];

function Sidebar({ open }) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <DrawerStyled variant="persistent" anchor="left" open={open}>
            <Toolbar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    VATFlow
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => navigate(item.path)}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    '& .MuiListItemIcon-root': {
                                        color: 'white',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </DrawerStyled>
    );
}

export default Sidebar;