// frontend/src/pages/TaxValidation.js
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Button, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Chip, Divider, Card, CardContent, MenuItem, TextField,
    LinearProgress, IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, List, ListItem, ListItemIcon,
    ListItemText, Tab, Tabs
} from '@mui/material';
import {
    CloudUpload, CheckCircle, Warning, Error as ErrorIcon,
    Refresh, Delete, Download, Visibility, FileCopy,
    Receipt as ReceiptIcon, Assessment, Calculate,
    Business, Public, TrendingUp, TrendingDown
} from '@mui/icons-material';
import api from '../services/api';

// 平台配置
const TAX_PLATFORMS = {
    c79: { label: 'C79 进口增值税 (英国)', icon: '🇬🇧', country: 'GB' },
    c88: { label: 'C88 海关清关单 (英国)', icon: '🇬🇧', country: 'GB' },
    pva: { label: 'PVA 递延清关 (英国)', icon: '🇬🇧', country: 'GB' },
    de_tax: { label: '进口增值税 (德国)', icon: '🇩🇪', country: 'DE' },
    fr_tax: { label: '进口增值税 (法国)', icon: '🇫🇷', country: 'FR' },
    it_tax: { label: '进口增值税 (意大利)', icon: '🇮🇹', country: 'IT' },
    es_tax: { label: '进口增值税 (西班牙)', icon: '🇪🇸', country: 'ES' },
    nl_tax: { label: '进口增值税 (荷兰)', icon: '🇳🇱', country: 'NL' },
    be_tax: { label: '进口增值税 (比利时)', icon: '🇧🇪', country: 'BE' },
    pl_tax: { label: '进口增值税 (波兰)', icon: '🇵🇱', country: 'PL' },
    se_tax: { label: '进口增值税 (瑞典)', icon: '🇸🇪', country: 'SE' },
    jp_tax: { label: '消费税 (日本)', icon: '🇯🇵', country: 'JP' },
    sg_tax: { label: 'GST (新加坡)', icon: '🇸🇬', country: 'SG' },
    us_tax: { label: '销售税 (美国)', icon: '🇺🇸', country: 'US' },
    ca_tax: { label: 'GST/HST (加拿大)', icon: '🇨🇦', country: 'CA' },
    au_tax: { label: 'GST (澳大利亚)', icon: '🇦🇺', country: 'AU' }
};

function TaxValidation() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedPlatform, setSelectedPlatform] = useState('c79');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);
    const [countrySummary, setCountrySummary] = useState(null);

    const handlePlatformChange = (event) => {
        setSelectedPlatform(event.target.value);
        setFile(null);
        setUploadResult(null);
        setError(null);
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('请选择文件');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('platform', selectedPlatform);

            const response = await api.post('/api/v1/tax/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setUploadResult(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || '上传失败');
            setUploadResult(null);
        } finally {
            setUploading(false);
        }
    };

    const handleValidate = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/api/v1/tax/validate', {
                importData: uploadResult?.data || [],
                salesData: []
            });

            setResult(response.data);
            setCountrySummary(response.data.countryReports);
        } catch (err) {
            setError(err.message || '校验失败');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ok': return <CheckCircle color="success" />;
            case 'warning': return <Warning color="warning" />;
            case 'error': return <ErrorIcon color="error" />;
            default: return null;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                📋 税务校验
            </Typography>

            {/* 上传区域 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    📂 上传税务文件
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    支持 C79、C88、各国进口增值税、消费税、GST 等文件
                </Typography>

                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            select
                            fullWidth
                            label="选择文件类型"
                            value={selectedPlatform}
                            onChange={handlePlatformChange}
                        >
                            {Object.entries(TAX_PLATFORMS).map(([key, value]) => (
                                <MenuItem key={key} value={key}>
                                    {value.icon} {value.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            startIcon={<CloudUpload />}
                        >
                            选择文件
                            <input
                                type="file"
                                hidden
                                accept=".csv,.xlsx,.pdf"
                                onChange={handleFileChange}
                            />
                        </Button>
                        {file && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                📄 已选: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </Typography>
                        )}
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                        >
                            {uploading ? '上传中...' : '上传文件'}
                        </Button>
                    </Grid>
                </Grid>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {uploadResult && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        ✅ 文件上传成功！解析到 {uploadResult.data?.length || 0} 条记录
                    </Alert>
                )}
            </Paper>

            {/* 校验按钮 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleValidate}
                    disabled={loading || !uploadResult}
                    startIcon={loading ? <CircularProgress size={24} /> : <Calculate />}
                >
                    {loading ? '校验中...' : '🔍 开始税务校验'}
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    onClick={() => window.location.reload()}
                    startIcon={<Refresh />}
                >
                    重置
                </Button>
            </Box>

            {/* 校验结果 */}
            {result && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        📊 校验结果
                    </Typography>

                    {/* 汇总卡片 */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary">销售 VAT</Typography>
                                    <Typography variant="h5" color="primary">
                                        {result.summary?.totalSalesVat || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary">进口 VAT</Typography>
                                    <Typography variant="h5" color="secondary">
                                        {result.summary?.totalImportVat || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: parseFloat(result.summary?.totalPayableVAT || 0) >= 0 ? '#e8f5e9' : '#fff3e0' }}>
                                <CardContent>
                                    <Typography color="text.secondary">应缴 VAT</Typography>
                                    <Typography variant="h5" color={parseFloat(result.summary?.totalPayableVAT || 0) >= 0 ? 'success.main' : 'warning.main'}>
                                        {result.summary?.totalPayableVAT || 0}
                                        {parseFloat(result.summary?.totalPayableVAT || 0) < 0 && ' (待退税)'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* 按国家汇总 */}
                    {countrySummary && (
                        <>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                按国家汇总
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>国家</TableCell>
                                            <TableCell align="right">销售 VAT</TableCell>
                                            <TableCell align="right">进口 VAT</TableCell>
                                            <TableCell align="right">应缴 VAT</TableCell>
                                            <TableCell align="right">状态</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.values(countrySummary).map((item) => (
                                            <TableRow key={item.country}>
                                                <TableCell>
                                                    {item.countryName} ({item.country})
                                                </TableCell>
                                                <TableCell align="right">{item.totalSalesVat.toFixed(2)}</TableCell>
                                                <TableCell align="right">{item.totalImportVat.toFixed(2)}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: item.payableVAT >= 0 ? 'success.main' : 'warning.main' }}>
                                                    {item.payableVAT.toFixed(2)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={item.status}
                                                        color={item.status === '正常' ? 'success' : 'warning'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </Paper>
            )}
        </Box>
    );
}

export default TaxValidation;