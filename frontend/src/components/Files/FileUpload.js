// frontend/src/components/Files/FileUpload.js
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Box,
    Paper,
    Typography,
    Button,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Alert,
    Snackbar,
    Divider,
    Grid,
    CircularProgress
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    InsertDriveFile as InsertDriveFileIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Folder as FolderIcon,
    Image as ImageIcon,
    Description as DescriptionIcon,
    TableChart as TableChartIcon,
    Code as CodeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// 文件类型图标映射
const FILE_ICONS = {
    csv: <TableChartIcon />,
    xlsx: <TableChartIcon />,
    xls: <TableChartIcon />,
    json: <CodeIcon />,
    txt: <DescriptionIcon />,
    pdf: <DescriptionIcon />,
    zip: <FolderIcon />,
    png: <ImageIcon />,
    jpg: <ImageIcon />,
    jpeg: <ImageIcon />
};

// 文件大小格式化
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 样式组件
const DropZone = styled(Box)(({ theme, isDragActive, isDragReject }) => ({
    border: `2px dashed ${isDragReject ? theme.palette.error.main : isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: isDragActive ? theme.palette.primary.light + '15' : 'transparent',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light + '08'
    }
}));

const FilePreview = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    maxHeight: 400,
    overflow: 'auto'
}));

/**
 * 文件上传组件
 * @param {Object} props
 * @param {Function} props.onUpload - 上传回调
 * @param {Function} props.onFileRemove - 移除文件回调
 * @param {Array} props.acceptedTypes - 接受的文件类型
 * @param {number} props.maxSize - 最大文件大小 (bytes)
 * @param {number} props.maxFiles - 最大文件数量
 * @param {string} props.uploadLabel - 上传按钮文字
 * @param {string} props.dropzoneText - 拖拽区域文字
 */
function FileUpload({
    onUpload,
    onFileRemove,
    acceptedTypes = ['.csv', '.xlsx', '.xls', '.json', '.txt', '.zip'],
    maxSize = 50 * 1024 * 1024, // 50MB
    maxFiles = 20,
    uploadLabel = '上传并处理',
    dropzoneText = '拖拽文件到此处，或点击选择文件'
}) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [error, setError] = useState(null);

    // 使用 react-dropzone
    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop: handleDrop,
        accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
        maxSize,
        maxFiles,
        multiple: true
    });

    // 处理文件拖放
    function handleDrop(acceptedFiles, rejectedFiles) {
        // 处理拒绝的文件
        if (rejectedFiles.length > 0) {
            const errors = rejectedFiles.map(file => ({
                name: file.file.name,
                error: file.errors[0]?.message || '文件不符合要求'
            }));
            setError(errors);
            return;
        }

        // 添加文件
        const newFiles = acceptedFiles.map(file => ({
            file,
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'pending',
            progress: 0
        }));

        setFiles(prev => [...prev, ...newFiles]);

        if (onFileRemove) {
            // 通知父组件
        }
    }

    // 移除文件
    const handleRemoveFile = (fileId) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        if (onFileRemove) {
            onFileRemove(fileId);
        }
    };

    // 清空所有文件
    const handleClearAll = () => {
        setFiles([]);
        setUploadStatus(null);
        setError(null);
        setProgress(0);
    };

    // 执行上传
    const handleUpload = async () => {
        if (files.length === 0) {
            setError([{ error: '请选择至少一个文件' }]);
            return;
        }

        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            // 构建 FormData
            const formData = new FormData();
            files.forEach(({ file }) => {
                formData.append('files', file);
            });

            // 模拟上传进度
            const totalFiles = files.length;
            let completedFiles = 0;

            // 使用 XMLHttpRequest 支持进度
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const totalProgress = (event.loaded / event.total) * 100;
                    setProgress(Math.round(totalProgress));
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    setUploadStatus('success');
                    setUploading(false);
                    setProgress(100);

                    // 重置文件状态
                    setFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));

                    // 调用回调
                    if (onUpload) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            onUpload(response);
                        } catch {
                            onUpload({ success: true });
                        }
                    }
                } else {
                    setUploadStatus('error');
                    setUploading(false);
                    setError([{ error: `上传失败: ${xhr.statusText}` }]);
                }
            });

            xhr.addEventListener('error', () => {
                setUploadStatus('error');
                setUploading(false);
                setError([{ error: '网络连接失败' }]);
            });

            // 发送请求
            xhr.open('POST', '/api/upload');
            xhr.send(formData);

        } catch (error) {
            setUploadStatus('error');
            setUploading(false);
            setError([{ error: error.message }]);
        }
    };

    // 获取文件图标
    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        return FILE_ICONS[ext] || <InsertDriveFileIcon />;
    };

    // 获取文件状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'error': return 'error';
            case 'uploading': return 'info';
            default: return 'default';
        }
    };

    // 获取文件状态图标
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon color="success" />;
            case 'error': return <ErrorIcon color="error" />;
            case 'uploading': return <CircularProgress size={20} />;
            default: return <PendingIcon color="action" />;
        }
    };

    return (
        <Box>
            {/* 拖拽区域 */}
            <DropZone {...getRootProps()} isDragActive={isDragActive} isDragReject={isDragReject}>
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {isDragActive ? '释放文件以上传' : dropzoneText}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    支持格式: {acceptedTypes.join(', ')}
                    <br />
                    最大文件: {formatFileSize(maxSize)}，最多 {maxFiles} 个文件
                </Typography>
            </DropZone>

            {/* 错误提示 */}
            {error && Array.isArray(error) && error.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    {error.map((err, index) => (
                        <Alert
                            key={index}
                            severity="error"
                            onClose={() => setError(prev => prev.filter((_, i) => i !== index))}
                            sx={{ mb: 1 }}
                        >
                            {err.name ? `${err.name}: ` : ''}{err.error}
                        </Alert>
                    ))}
                </Box>
            )}

            {/* 文件列表 */}
            {files.length > 0 && (
                <FilePreview>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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
                                disabled={uploading || files.length === 0}
                                startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                            >
                                {uploading ? '上传中...' : uploadLabel}
                            </Button>
                        </Box>
                    </Box>

                    <Divider />

                    <List>
                        {files.map((file) => (
                            <ListItem key={file.id} divider>
                                <ListItemIcon>
                                    {getFileIcon(file.name)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {file.name}
                                            </Typography>
                                            {file.status !== 'pending' && (
                                                <Chip
                                                    label={file.status}
                                                    size="small"
                                                    color={getStatusColor(file.status)}
                                                    icon={getStatusIcon(file.status)}
                                                    sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem' } }}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {formatFileSize(file.size)}
                                        </Typography>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    {!uploading && file.status === 'pending' && (
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveFile(file.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>

                    {/* 上传进度 */}
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

                    {/* 上传成功状态 */}
                    {uploadStatus === 'success' && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            ✅ 文件上传成功！正在处理中...
                        </Alert>
                    )}
                </FilePreview>
            )}
        </Box>
    );
}

export default FileUpload;