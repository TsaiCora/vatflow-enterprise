// frontend/src/pages/Upload.js
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    LinearProgress,
    Snackbar,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
    InsertDriveFile as InsertDriveFileIcon
} from '@mui/icons-material';
import VATProfileSelector from '../components/VATProfileSelector';

function Upload() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [selectedVATProfile, setSelectedVATProfile] = useState(null);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const handleRemoveFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearAll = () => {
        setFiles([]);
        setProgress(0);
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setSnackbar({ open: true, message: '请选择文件', severity: 'warning' });
            return;
        }

        if (!selectedVATProfile) {
            setSnackbar({ open: true, message: '请先选择VAT档案', severity: 'warning' });
            return;
        }

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('vatProfileId', selectedVATProfile.id);

        try {
            const response = await fetch('/api/v1/files/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('📥 上传响应:', result);

            if (result.success) {
                setSnackbar({
                    open: true,
                    message: `${files.length} 个文件上传成功，关联到 ${selectedVATProfile.vat_number}`,
                    severity: 'success'
                });
                setFiles([]);
                setProgress(100);
            } else {
                setSnackbar({
                    open: true,
                    message: result.error || '上传失败',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('❌ 上传错误:', error);
            setSnackbar({
                open: true,
                message: '网络错误，请检查后端',
                severity: 'error'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...droppedFiles]);
    };

    const handleDragOver = (e) => e.preventDefault();

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                📤 文件上传
            </Typography>

            {/* VAT 档案选择 */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        选择VAT档案：
                    </Typography>
                    <VATProfileSelector
                        value={selectedVATProfile?.id}
                        onChange={(id) => {}}
                        onProfileChange={setSelectedVATProfile}
                        label="选择VAT档案"
                    />
                    {selectedVATProfile && (
                        <Chip
                            label={`当前: ${selectedVATProfile.country} ${selectedVATProfile.vat_number}`}
                            color="primary"
                            size="small"
                        />
                    )}
                </Box>
            </Paper>

            {/* 上传区域 */}
            <Paper
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                sx={{
                    p: 4,
                    mb: 3,
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: '#f5f9ff'
                    }
                }}
                onClick={() => document.getElementById('fileInput').click()}
            >
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    拖拽文件到此处，或点击选择文件
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    支持格式: CSV, XLSX, XLS, JSON, TXT, ZIP
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    单个文件最大 100MB，单次最多 20 个文件
                </Typography>
                <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls,.json,.txt,.zip"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </Paper>

            {files.length > 0 && (
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            已选择 {files.length} 个文件
                        </Typography>
                        <Box>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={handleClearAll}
                                disabled={uploading}
                                sx={{ mr: 1 }}
                            >
                                清空全部
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleUpload}
                                disabled={uploading || files.length === 0 || !selectedVATProfile}
                                startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                            >
                                {uploading ? '上传中...' : '上传并处理'}
                            </Button>
                        </Box>
                    </Box>

                    <List>
                        {files.map((file, index) => (
                            <ListItem key={index} divider>
                                <ListItemIcon>
                                    <InsertDriveFileIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={file.name}
                                    secondary={formatFileSize(file.size)}
                                />
                                <IconButton
                                    onClick={() => handleRemoveFile(index)}
                                    disabled={uploading}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>

                    {uploading && (
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    上传进度
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {progress}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        </Box>
                    )}
                </Paper>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
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

export default Upload;