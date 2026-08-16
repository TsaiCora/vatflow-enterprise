// frontend/src/components/PushNotification.js
import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Alert, Box, Typography, CircularProgress } from '@mui/material';
import { NotificationsActive as NotificationsIcon, NotificationsOff as NotificationsOffIcon } from '@mui/icons-material';

function PushNotification() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // ===== 使用您生成的 VAPID 公钥 =====
    const VAPID_PUBLIC_KEY = 'BEobUnzx9wE8IEpDppXBKASYyyP2FN9A8e_-PPnKxh3DHgaqSBIECKLV95uKildiikOHSnK_EUupuVxD4AltLYs';

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (err) {
            console.error('检查订阅状态失败:', err);
        }
    };

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ Service Worker 注册成功');

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setSnackbar({ open: true, message: '❌ 需要允许通知权限', severity: 'error' });
                setLoading(false);
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('✅ 推送订阅成功:', subscription);

            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            const userRole = localStorage.getItem('userRole') || 'user';

            const response = await fetch('https://api.vatapex.com/api/v1/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || '',
                    'X-User-Role': userRole
                },
                body: JSON.stringify(subscription)
            });

            const result = await response.json();
            console.log('📥 订阅保存结果:', result);

            if (result && result.success) {
                setIsSubscribed(true);
                setSnackbar({ open: true, message: '✅ 推送通知已开启', severity: 'success' });
            } else {
                setSnackbar({ open: true, message: '❌ 订阅保存失败', severity: 'error' });
            }
        } catch (err) {
            console.error('❌ 订阅失败:', err);
            setSnackbar({ open: true, message: '❌ 订阅失败: ' + err.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                console.log('✅ 取消订阅成功');

                const token = localStorage.getItem('token');
                const tenantId = localStorage.getItem('tenantId');
                const userRole = localStorage.getItem('userRole') || 'user';

                await fetch('https://api.vatapex.com/api/v1/push/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Tenant-ID': tenantId || '',
                        'X-User-Role': userRole
                    },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });

                setIsSubscribed(false);
                setSnackbar({ open: true, message: '✅ 推送通知已关闭', severity: 'success' });
            }
        } catch (err) {
            console.error('❌ 取消订阅失败:', err);
            setSnackbar({ open: true, message: '❌ 取消订阅失败', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isSupported) {
        return <Typography variant="caption" color="text.secondary">⚠️ 当前浏览器不支持推送通知</Typography>;
    }

    return (
        <Box>
            {isSubscribed ? (
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={unsubscribeFromPush}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <NotificationsOffIcon />}
                >
                    {loading ? '处理中...' : '关闭推送'}
                </Button>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={subscribeToPush}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <NotificationsIcon />}
                >
                    {loading ? '请求中...' : '开启推送'}
                </Button>
            )}

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

export default PushNotification;