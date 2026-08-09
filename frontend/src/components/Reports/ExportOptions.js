// frontend/src/components/Reports/ExportOptions.js
import React, { useState } from 'react';
import {
    Paper,
    Box,
    Typography,
    Grid,
    Button,
    RadioGroup,
    Radio,
    FormControlLabel,
    FormControl,
    FormLabel,
    Select,
    MenuItem,
    InputLabel,
    Chip,
    Divider,
    Switch,
    Tooltip,
    IconButton,
    Alert,
    Collapse,
    Slider
} from '@mui/material';
import {
    Download as DownloadIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Code as JsonIcon,
    Description as CsvIcon,
    Print as PrintIcon,
    Share as ShareIcon,
    Email as EmailIcon,
    Info as InfoIcon
} from '@mui/icons-material';

/**
 * 导出选项组件
 * @param {Object} props
 * @param {Function} props.onExport - 导出回调
 * @param {Function} props.onPrint - 打印回调
 * @param {Function} props.onShare - 分享回调
 * @param {Function} props.onEmail - 邮件发送回调
 * @param {Array} props.availableFormats - 可用格式 ['pdf', 'xlsx', 'csv', 'json']
 * @param {Object} props.defaultOptions - 默认选项
 */
function ExportOptions({
    onExport,
    onPrint,
    onShare,
    onEmail,
    availableFormats = ['xlsx', 'csv', 'json'],
    defaultOptions = {}
}) {
    const [format, setFormat] = useState(defaultOptions.format || 'xlsx');
    const [includeCharts, setIncludeCharts] = useState(defaultOptions.includeCharts !== false);
    const [includeSummary, setIncludeSummary] = useState(defaultOptions.includeSummary !== false);
    const [includeDetails, setIncludeDetails] = useState(defaultOptions.includeDetails !== false);
    const [pageSize, setPageSize] = useState(defaultOptions.pageSize || 'a4');
    const [orientation, setOrientation] = useState(defaultOptions.orientation || 'portrait');
    const [compression, setCompression] = useState(defaultOptions.compression !== false);
    const [password, setPassword] = useState(defaultOptions.password || '');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedRange, setSelectedRange] = useState('all');

    // 格式配置
    const formatConfigs = {
        pdf: {
            icon: <PdfIcon />,
            label: 'PDF',
            color: '#d32f2f',
            description: '适用于打印和正式提交'
        },
        xlsx: {
            icon: <ExcelIcon />,
            label: 'Excel',
            color: '#2e7d32',
            description: '完整数据报表，可编辑'
        },
        csv: {
            icon: <CsvIcon />,
            label: 'CSV',
            color: '#1976d2',
            description: '通用数据格式，兼容性好'
        },
        json: {
            icon: <JsonIcon />,
            label: 'JSON',
            color: '#ed6c02',
            description: 'API数据格式，便于集成'
        }
    };

    const handleExport = () => {
        const options = {
            format,
            includeCharts,
            includeSummary,
            includeDetails,
            pageSize,
            orientation,
            compression,
            password,
            range: selectedRange
        };
        if (onExport) {
            onExport(options);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    📤 导出选项
                </Typography>
                <Box>
                    {onPrint && (
                        <Tooltip title="打印">
                            <IconButton onClick={onPrint}>
                                <PrintIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onShare && (
                        <Tooltip title="分享">
                            <IconButton onClick={onShare}>
                                <ShareIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onEmail && (
                        <Tooltip title="发送邮件">
                            <IconButton onClick={onEmail}>
                                <EmailIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* 格式选择 */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <FormControl component="fieldset" fullWidth>
                        <FormLabel component="legend">选择导出格式</FormLabel>
                        <RadioGroup
                            row
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            sx={{ flexWrap: 'wrap', gap: 1 }}
                        >
                            {availableFormats.map((fmt) => {
                                const config = formatConfigs[fmt];
                                if (!config) return null;
                                return (
                                    <FormControlLabel
                                        key={fmt}
                                        value={fmt}
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span style={{ color: config.color }}>{config.icon}</span>
                                                {config.label}
                                                <Chip
                                                    label={config.description}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.6rem', height: 20 }}
                                                />
                                            </Box>
                                        }
                                        sx={{
                                            border: '1px solid',
                                            borderColor: format === fmt ? 'primary.main' : 'divider',
                                            borderRadius: 1,
                                            px: 1,
                                            py: 0.5,
                                            m: 0,
                                            '& .MuiFormControlLabel-label': {
                                                width: 'auto'
                                            }
                                        }}
                                    />
                                );
                            })}
                        </RadioGroup>
                    </FormControl>
                </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* 基本选项 */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>页面大小</InputLabel>
                        <Select
                            value={pageSize}
                            onChange={(e) => setPageSize(e.target.value)}
                            label="页面大小"
                            disabled={format !== 'pdf'}
                        >
                            <MenuItem value="a4">A4</MenuItem>
                            <MenuItem value="a3">A3</MenuItem>
                            <MenuItem value="letter">Letter</MenuItem>
                            <MenuItem value="legal">Legal</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>方向</InputLabel>
                        <Select
                            value={orientation}
                            onChange={(e) => setOrientation(e.target.value)}
                            label="方向"
                            disabled={format !== 'pdf'}
                        >
                            <MenuItem value="portrait">纵向</MenuItem>
                            <MenuItem value="landscape">横向</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>数据范围</InputLabel>
                        <Select
                            value={selectedRange}
                            onChange={(e) => setSelectedRange(e.target.value)}
                            label="数据范围"
                        >
                            <MenuItem value="all">全部数据</MenuItem>
                            <MenuItem value="current">当前视图</MenuItem>
                            <MenuItem value="selected">选中数据</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* 高级选项开关 */}
            <Box sx={{ mt: 2 }}>
                <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    endIcon={showAdvanced ? '▲' : '▼'}
                >
                    {showAdvanced ? '收起高级选项' : '展开高级选项'}
                </Button>
            </Box>

            <Collapse in={showAdvanced}>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2">包含图表</Typography>
                                <Switch
                                    checked={includeCharts}
                                    onChange={(e) => setIncludeCharts(e.target.checked)}
                                    disabled={format === 'csv' || format === 'json'}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2">包含汇总</Typography>
                                <Switch
                                    checked={includeSummary}
                                    onChange={(e) => setIncludeSummary(e.target.checked)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2">包含明细</Typography>
                                <Switch
                                    checked={includeDetails}
                                    onChange={(e) => setIncludeDetails(e.target.checked)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2">文件压缩</Typography>
                                <Switch
                                    checked={compression}
                                    onChange={(e) => setCompression(e.target.checked)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="密码保护（可选）"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                fullWidth
                                size="small"
                                helperText="设置密码后，打开文件需要密码验证"
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Collapse>

            {/* 操作按钮 */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                >
                    导出报告
                </Button>
                {onEmail && (
                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={<EmailIcon />}
                        onClick={onEmail}
                    >
                        邮件发送
                    </Button>
                )}
                <Button
                    variant="outlined"
                    size="large"
                    onClick={() => {
                        setFormat(defaultOptions.format || 'xlsx');
                        setIncludeCharts(true);
                        setIncludeSummary(true);
                        setIncludeDetails(true);
                        setPageSize('a4');
                        setOrientation('portrait');
                        setCompression(true);
                        setPassword('');
                    }}
                >
                    重置选项
                </Button>
            </Box>

            {format === 'pdf' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    💡 PDF格式包含完整排版，适合打印和正式提交。
                </Alert>
            )}
            {format === 'csv' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    ⚠️ CSV格式仅包含数据，不支持图表和样式。如需完整报表请选择Excel或PDF。
                </Alert>
            )}
        </Paper>
    );
}

export default ExportOptions;