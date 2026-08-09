// frontend/src/pages/Reports.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, LinearProgress, Alert, Snackbar } from '@mui/material';
import { ReportList, ExportOptions, ReportViewer } from '../components/Reports';
import { fetchReports, deleteReport, generateReport } from '../store/slices/reportSlice';

function Reports() {
    const dispatch = useDispatch();
    const { reports, loading } = useSelector((state) => state.reports || { reports: [], loading: false });
    
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        await dispatch(fetchReports());
    };

    const handleView = (report) => {
        setSelectedReport(report);
        setViewerOpen(true);
    };

    const handleDownload = (report) => {
        setSnackbar({
            open: true,
            message: `正在下载: ${report.name}`,
            severity: 'success'
        });
    };

    const handleDelete = async (report) => {
        const result = await dispatch(deleteReport(report.id));
        if (!result.error) {
            setSnackbar({
                open: true,
                message: `报告 "${report.name}" 已删除`,
                severity: 'success'
            });
            loadReports();
        }
    };

    const handleGenerate = () => {
        setSnackbar({
            open: true,
            message: '报告生成任务已提交',
            severity: 'success'
        });
    };

    const handleExport = (format) => {
        setSnackbar({
            open: true,
            message: `正在导出 ${format.toUpperCase()} 格式...`,
            severity: 'success'
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                📄 申报报告
            </Typography>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <ExportOptions
                onExport={handleExport}
                availableFormats={['xlsx', 'csv', 'json']}
            />

            <Box sx={{ mt: 3 }}>
                <ReportList
                    reports={reports}
                    loading={loading}
                    onView={handleView}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onRefresh={loadReports}
                    onCreate={handleGenerate}
                />
            </Box>

            <ReportViewer
                report={selectedReport}
                open={viewerOpen}
                onClose={() => {
                    setViewerOpen(false);
                    setSelectedReport(null);
                }}
                onDownload={handleDownload}
                onExport={handleExport}
            />

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

export default Reports;