// backend/src/middleware/validator.js
const Joi = require('joi');

const schemas = {
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    }),

    tenantIdParam: Joi.object({
        tenantId: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).required()
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    }),

    createTenant: Joi.object({
        tenantId: Joi.string().pattern(/^[a-zA-Z0-9_]+$/),
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        company: Joi.string().max(200).allow(''),
        vatNumber: Joi.string().max(50).allow(''),
        country: Joi.string().length(2).required(),
        settings: Joi.object({
            autoProcess: Joi.boolean(),
            emailNotifications: Joi.boolean(),
            defaultRate: Joi.number().min(0).max(100),
            currency: Joi.string().length(3)
        }),
        taxConfig: Joi.object({
            ossEnabled: Joi.boolean(),
            mtdEnabled: Joi.boolean(),
            viesValidation: Joi.boolean(),
            defaultPeriod: Joi.string().valid('monthly', 'quarterly', 'annually')
        })
    }),

    updateTenant: Joi.object({
        name: Joi.string().min(2).max(100),
        email: Joi.string().email(),
        company: Joi.string().max(200).allow(''),
        vatNumber: Joi.string().max(50).allow(''),
        country: Joi.string().length(2),
        status: Joi.string().valid('active', 'inactive', 'pending'),
        settings: Joi.object({
            autoProcess: Joi.boolean(),
            emailNotifications: Joi.boolean(),
            defaultRate: Joi.number().min(0).max(100),
            currency: Joi.string().length(3)
        }),
        taxConfig: Joi.object({
            ossEnabled: Joi.boolean(),
            mtdEnabled: Joi.boolean(),
            viesValidation: Joi.boolean(),
            defaultPeriod: Joi.string().valid('monthly', 'quarterly', 'annually')
        })
    }),

    generateReport: Joi.object({
        tenantId: Joi.string().pattern(/^[a-zA-Z0-9_]+$/),
        period: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
        country: Joi.string().length(2),
        format: Joi.string().valid('xlsx', 'csv', 'json', 'pdf').default('xlsx'),
        includeCharts: Joi.boolean().default(true),
        includeSummary: Joi.boolean().default(true),
        includeDetails: Joi.boolean().default(true)
    }),

    createWebhook: Joi.object({
        url: Joi.string().uri().required(),
        events: Joi.array().items(Joi.string()).min(1).required(),
        secret: Joi.string().min(10),
        active: Joi.boolean().default(true)
    }),

    updateSettings: Joi.object({
        companyName: Joi.string().max(100),
        companyEmail: Joi.string().email(),
        language: Joi.string().length(5),
        timezone: Joi.string(),
        defaultRate: Joi.number().min(0).max(100),
        currency: Joi.string().length(3),
        ossEnabled: Joi.boolean(),
        mtdEnabled: Joi.boolean(),
        emailNotifications: Joi.boolean(),
        twoFactorAuth: Joi.boolean(),
        sessionTimeout: Joi.number().min(5).max(480)
    }),

    updatePassword: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).required()
    }),

    resetPassword: Joi.object({
        email: Joi.string().email().required()
    })
};

module.exports = {
    schemas
};