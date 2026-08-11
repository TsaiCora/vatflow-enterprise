// frontend/src/components/VATProfileSelector.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Snackbar,
    Typography
} from '@mui/material';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon
} from '@mui/icons-material';

// ===== 完整国家列表 =====
const ALL_COUNTRIES = [
    // 欧洲
    { code: 'GB', name: '英国', flag: '🇬🇧' },
    { code: 'FR', name: '法国', flag: '🇫🇷' },
    { code: 'DE', name: '德国', flag: '🇩🇪' },
    { code: 'IT', name: '意大利', flag: '🇮🇹' },
    { code: 'ES', name: '西班牙', flag: '🇪🇸' },
    { code: 'NL', name: '荷兰', flag: '🇳🇱' },
    { code: 'BE', name: '比利时', flag: '🇧🇪' },
    { code: 'AT', name: '奥地利', flag: '🇦🇹' },
    { code: 'PL', name: '波兰', flag: '🇵🇱' },
    { code: 'SE', name: '瑞典', flag: '🇸🇪' },
    { code: 'DK', name: '丹麦', flag: '🇩🇰' },
    { code: 'FI', name: '芬兰', flag: '🇫🇮' },
    { code: 'IE', name: '爱尔兰', flag: '🇮🇪' },
    { code: 'PT', name: '葡萄牙', flag: '🇵🇹' },
    { code: 'NO', name: '挪威', flag: '🇳🇴' },
    { code: 'CH', name: '瑞士', flag: '🇨🇭' },
    { code: 'RU', name: '俄罗斯', flag: '🇷🇺' },
    // 亚洲
    { code: 'JP', name: '日本', flag: '🇯🇵' },
    { code: 'CN', name: '中国', flag: '🇨🇳' },
    { code: 'KR', name: '韩国', flag: '🇰🇷' },
    { code: 'SG', name: '新加坡', flag: '🇸🇬' },
    { code: 'MY', name: '马来西亚', flag: '🇲🇾' },
    { code: 'TH', name: '泰国', flag: '🇹🇭' },
    { code: 'VN', name: '越南', flag: '🇻🇳' },
    { code: 'IN', name: '印度', flag: '🇮🇳' },
    { code: 'ID', name: '印度尼西亚', flag: '🇮🇩' },
    { code: 'PH', name: '菲律宾', flag: '🇵🇭' },
    { code: 'HK', name: '香港', flag: '🇭🇰' },
    { code: 'TW', name: '台湾', flag: '🇹🇼' },
    // 美洲
    { code: 'US', name: '美国', flag: '🇺🇸' },
    { code: 'CA', name: '加拿大', flag: '🇨🇦' },
    { code: 'MX', name: '墨西哥', flag: '🇲🇽' },
    { code: 'BR', name: '巴西', flag: '🇧🇷' },
    { code: 'AR', name: '阿根廷', flag: '🇦🇷' },
    // 大洋洲
    { code: 'AU', name: '澳大利亚', flag: '🇦🇺' },
    { code: 'NZ', name: '新西兰', flag: '🇳🇿' },
    // 非洲
    { code: 'ZA', name: '南非', flag: '🇿🇦' },
    { code: 'NG', name: '尼日利亚', flag: '🇳🇬' },
    { code: 'EG', name: '埃及', flag: '🇪🇬' },
    // 中东
    { code: 'AE', name: '阿联酋', flag: '🇦🇪' },
    { code: 'SA', name: '沙特阿拉伯', flag: '🇸🇦' },
    { code: 'IL', name: '以色列', flag: '🇮🇱' },
    { code: 'TR', name: '土耳其', flag: '🇹🇷' },
];

function VATProfileSelector({ value, onChange, onProfileChange, label = 'VAT档案', size = 'small' }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [newProfile, setNewProfile] = useState({
        vatNumber: '',
        country: 'GB',
        companyName: '',
        taxRate: 20
    });

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/vat-profiles', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            console.log('📥 VAT档案列表:', result);
            if (result.success) {
                setProfiles(result.data);
                if (!value && result.data.length > 0) {
                    const defaultProfile = result.data.find(p => p.is_default) || result.data[0];
                    onChange(defaultProfile.id);
                    if (onProfileChange) onProfileChange(defaultProfile);
                }
            }
        } catch (error) {
            console.error('❌ 加载VAT档案失败:', error);
            setSnackbar({ open: true, message: '加载VAT档案失败', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfiles();
    }, []);

    const handleCreate = async () => {
        if (!newProfile.vatNumber) {
            setSnackbar({ open: true, message: '请输入VAT号码', severity: 'warning' });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/vat-profiles', {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vatNumber: newProfile.vatNumber,
                    country: newProfile.country,
                    companyName: newProfile.companyName,
                    taxRate: newProfile.taxRate
                })
            });
            const result = await response.json();
            console.log('📥 创建VAT档案响应:', result);
            
            if (result.success) {
                setProfiles(result.data);
                setOpen(false);
                setNewProfile({ vatNumber: '', country: 'GB', companyName: '', taxRate: 20 });
                setSnackbar({ open: true, message: '✅ VAT档案创建成功', severity: 'success' });
                if (result.data.length > 0) {
                    const latest = result.data[result.data.length - 1];
                    onChange(latest.id);
                    if (onProfileChange) onProfileChange(latest);
                }
            } else {
                setSnackbar({ open: true, message: result.error || '创建失败', severity: 'error' });
            }
        } catch (error) {
            console.error('❌ 创建VAT档案失败:', error);
            setSnackbar({ open: true, message: '网络错误，请检查后端', severity: 'error' });
        }
    };

    const selectedProfile = profiles.find(p => p.id === value);

    // 获取国家名称
    const getCountryName = (code) => {
        const country = ALL_COUNTRIES.find(c => c.code === code);
        return country ? `${country.flag} ${country.name}` : code;
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size={size} sx={{ minWidth: 220 }}>
                <InputLabel>{label}</InputLabel>
                <Select
                    value={value || ''}
                    onChange={(e) => {
                        const id = e.target.value;
                        onChange(id);
                        const profile = profiles.find(p => p.id === id);
                        if (onProfileChange && profile) onProfileChange(profile);
                    }}
                    label={label}
                    disabled={loading || profiles.length === 0}
                    renderValue={(selected) => {
                        const profile = profiles.find(p => p.id === selected);
                        if (!profile) return <span>请选择VAT档案</span>;
                        return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip label={getCountryName(profile.country)} size="small" variant="outlined" sx={{ minWidth: 32 }} />
                                <span>{profile.vat_number}</span>
                                {profile.is_default && (
                                    <Chip label="默认" size="small" color="primary" sx={{ height: 20, fontSize: '0.6rem' }} />
                                )}
                            </Box>
                        );
                    }}
                >
                    {profiles.length === 0 ? (
                        <MenuItem disabled>暂无VAT档案，请添加</MenuItem>
                    ) : (
                        profiles.map((profile) => (
                            <MenuItem key={profile.id} value={profile.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Chip label={getCountryName(profile.country)} size="small" variant="outlined" sx={{ minWidth: 32 }} />
                                    <span style={{ flex: 1 }}>{profile.vat_number}</span>
                                    {profile.is_default && <Chip label="默认" size="small" color="primary" />}
                                    {profile.company_name && (
                                        <span style={{ color: '#999', fontSize: '0.75rem' }}>{profile.company_name}</span>
                                    )}
                                </Box>
                            </MenuItem>
                        ))
                    )}
                </Select>
            </FormControl>

            <Tooltip title="刷新">
                <IconButton size="small" onClick={loadProfiles} disabled={loading}>
                    <RefreshIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="添加VAT档案">
                <IconButton size="small" color="primary" onClick={() => setOpen(true)}>
                    <AddIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            {selectedProfile && (
                <Chip
                    icon={<CheckCircleIcon />}
                    label={`${getCountryName(selectedProfile.country)} ${selectedProfile.vat_number}`}
                    size="small"
                    color="success"
                    variant="outlined"
                />
            )}

            {/* 创建VAT档案弹窗 */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">➕ 添加 VAT 档案</Typography>
                        <IconButton onClick={() => setOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <Alert severity="info">
                            为当前账号添加一个新的 VAT 档案，每个 VAT 档案的数据相互隔离。
                        </Alert>
                        <TextField
                            label="VAT号码 *"
                            value={newProfile.vatNumber}
                            onChange={(e) => setNewProfile({ ...newProfile, vatNumber: e.target.value.toUpperCase() })}
                            fullWidth
                            placeholder="例如: GB123456789"
                            required
                            helperText="VAT号码必须唯一"
                        />
                        <TextField
                            select
                            label="国家 *"
                            value={newProfile.country}
                            onChange={(e) => setNewProfile({ ...newProfile, country: e.target.value })}
                            fullWidth
                            SelectProps={{
                                MenuProps: {
                                    PaperProps: {
                                        style: {
                                            maxHeight: 300,
                                        },
                                    },
                                },
                            }}
                        >
                            {ALL_COUNTRIES.map((country) => (
                                <MenuItem key={country.code} value={country.code}>
                                    {country.flag} {country.name} ({country.code})
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="公司名称"
                            value={newProfile.companyName}
                            onChange={(e) => setNewProfile({ ...newProfile, companyName: e.target.value })}
                            fullWidth
                            placeholder="可选"
                        />
                        <TextField
                            label="税率 (%)"
                            type="number"
                            value={newProfile.taxRate}
                            onChange={(e) => setNewProfile({ ...newProfile, taxRate: parseFloat(e.target.value) || 0 })}
                            fullWidth
                            InputProps={{ inputProps: { min: 0, max: 100 } }}
                            helperText="默认税率，用于该VAT档案下的交易"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>取消</Button>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!newProfile.vatNumber || !newProfile.country}
                        startIcon={<AddIcon />}
                    >
                        创建VAT档案
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default VATProfileSelector;