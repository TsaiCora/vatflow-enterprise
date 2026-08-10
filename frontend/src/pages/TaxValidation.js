// frontend/src/pages/TaxValidation.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { taxAPI } from '../services/api';

function TaxValidation() {
    const [loading, setLoading] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [error, setError] = useState(null);

    const handleValidate = async () => {
        setLoading(true);
        setError(null);
        try {
            // 示例验证数据
            const testData = {
                vatNumber: 'GB123456789',
                amount: 1000,
                country: 'UK'
            };
            const result = await taxAPI.validate(testData);
            console.log('✅ 税务校验结果:', result);
            if (result && result.success) {
                setValidationResult(result.data);
            } else {
                setValidationResult(result);
            }
        } catch (err) {
            console.error('❌ 校验失败:', err);
            setError(typeof err === 'string' ? err : '税务校验失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    ✅ 税务校验
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                    onClick={handleValidate}
                    disabled={loading}
                >
                    {loading ? '校验中...' : '执行校验'}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                校验信息
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography>VAT号码: GB123456789</Typography>
                                <Typography>金额: €1000</Typography>
                                <Typography>国家: 英国</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                校验结果
                            </Typography>
                            {validationResult ? (
                                <Box sx={{ mt: 2 }}>
                                    <Typography color="success.main">
                                        ✅ 校验通过
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        返回数据: {JSON.stringify(validationResult, null, 2)}
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography color="textSecondary" sx={{ mt: 2 }}>
                                    点击"执行校验"查看结果
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default TaxValidation;