// backend/src/middleware/rbac.js
const { logger } = require('../utils/logger');

const ROLES = {
    admin: {
        name: 'Admin',
        permissions: ['*']
    },
    user: {
        name: 'User',
        permissions: [
            'file:upload',
            'file:list',
            'file:view',
            'file:delete',
            'report:generate',
            'report:list',
            'report:view',
            'report:download',
            'transaction:list',
            'transaction:view',
            'dashboard:view'
        ]
    },
    viewer: {
        name: 'Viewer',
        permissions: [
            'report:list',
            'report:view',
            'transaction:list',
            'transaction:view',
            'dashboard:view'
        ]
    }
};

function hasPermission(role, permission) {
    const roleConfig = ROLES[role];
    if (!roleConfig) return false;
    if (roleConfig.permissions.includes('*')) return true;
    return roleConfig.permissions.includes(permission);
}

function requirePermission(permissions) {
    const required = Array.isArray(permissions) ? permissions : [permissions];

    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized'
                });
            }

            const role = user.role || 'user';
            const hasAllPermissions = required.every(p => hasPermission(role, p));

            if (!hasAllPermissions) {
                return res.status(403).json({
                    success: false,
                    error: 'Permission denied'
                });
            }

            next();
        } catch (error) {
            logger.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                error: 'Permission check failed'
            });
        }
    };
}

function requireRole(roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized'
                });
            }

            const role = user.role || 'user';

            if (!allowed.includes(role) && !allowed.includes('*')) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient role'
                });
            }

            next();
        } catch (error) {
            logger.error('Role check error:', error);
            return res.status(500).json({
                success: false,
                error: 'Role check failed'
            });
        }
    };
}

function tenantIsolation(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        req.tenantId = user.tenantId;

        if (user.role === 'admin') {
            const targetTenantId = req.params.tenantId || req.query.tenantId;
            if (targetTenantId) {
                req.targetTenantId = targetTenantId;
            }
            return next();
        }

        const targetTenantId = req.params.tenantId || req.query.tenantId;
        if (targetTenantId && targetTenantId !== user.tenantId) {
            return res.status(403).json({
                success: false,
                error: 'Cannot access other tenant data'
            });
        }

        next();
    } catch (error) {
        logger.error('Tenant isolation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Tenant isolation check failed'
        });
    }
}

module.exports = {
    ROLES,
    hasPermission,
    requirePermission,
    requireRole,
    tenantIsolation
};