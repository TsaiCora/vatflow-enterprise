// frontend/public/service-worker.js
self.addEventListener('install', (event) => {
    console.log('🔔 Service Worker 已安装');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('🔔 Service Worker 已激活');
    event.waitUntil(self.clients.claim());
});

// 接收推送消息
self.addEventListener('push', (event) => {
    console.log('📨 收到推送:', event);

    let data = {
        title: '📬 VATFlow 通知',
        body: '您有新的通知',
        icon: '/favicon.ico',
        url: '/'
    };

    if (event.data) {
        try {
            const parsed = event.data.json();
            data = { ...data, ...parsed };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: '查看详情' },
            { action: 'close', title: '关闭' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 点击通知
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});