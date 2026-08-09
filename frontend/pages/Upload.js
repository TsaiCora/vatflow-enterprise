// frontend/src/pages/Upload.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Typography, Paper, Alert, Snackbar, LinearProgress } from '@mui/material';
import { FileUpload, FileList, ProcessingStatus } from '../components/Files';
import { uploadFiles, fetchFiles } from '../store/slices/fileSlice';

function Upload() {
    const dispatch = useDispatch();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [jobId, setJobId] = useState(null);
    const [status, setStatus] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleUpload = async (files) => {
        setUploading(true);
        setUploadProgress(0);
        
        try {
            const result = await dispatch(uploadFiles({
                files,
                onProgress: (progress) => setUploadProgress(progress)
            }));
            
            if (result.payload?.data?.jobId) {
                setJobId(result.payload.data.jobId);
                setStatus('processing');
                setSnackbar({
                    open: true,
                    message: `${files.length} 个文件上传成功，正在处理中...`,
                    severity: 'success'
                });
            }
            
            // 刷新文件列表
            await dispatch(fetchFiles());
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message || '上传失败',
                severity: 'error'
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                📤 文件上传
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <FileUpload
                    onUpload={handleUpload}
                    maxFiles={20}
                    maxSize={50 * 1024 * 1024}
                    acceptedTypes={['.csv', '.xlsx', '.xls', '.json', '.txt', '.zip']}
                />
            </Paper>

            {uploading && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        上传进度: {uploadProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                </Paper>
            )}

            {jobId && status && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <ProcessingStatus
                        jobId={jobId}
                        status={status}
                        progress={uploadProgress}
                        message="文件正在处理中..."
                    />
                </Paper>
            )}

            <FileList title="已上传文件" />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
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

export default Upload;