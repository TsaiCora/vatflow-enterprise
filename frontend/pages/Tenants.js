// frontend/src/pages/Tenants.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Chip, LinearProgress } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { TenantsList, TenantForm, TenantDetail } from '../components/Tenants';
import { fetchTenants, createTenant, updateTenant, deleteTenant, toggleTenantStatus } from '../store/slices/tenantSlice';

function Tenants() {
    const dispatch = useDispatch();
    const { tenants, loading, error } = useSelector((state) => state.tenants || { tenants: [], loading: false });
    
    const [formOpen, setFormOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [formMode, setFormMode] = useState('add');

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        await dispatch(fetchTenants());
    };

    const handleAdd = () => {
        setSelectedTenant(null);
        setFormMode('add');
        setFormOpen(true);
    };

    const handleEdit = (tenant) => {
        setSelectedTenant(tenant);
        setFormMode('edit');
        setFormOpen(true);
    };

    const handleView = (tenant) => {
        setSelectedTenant(tenant);
        setDetailOpen(true);
    };

    const handleSubmit = async (data) => {
        let result;
        if (formMode === 'add') {
            result = await dispatch(createTenant(data));
        } else {
            result = await dispatch(updateTenant({ tenantId: data.tenantId, data }));
        }
        if (!result.error) {
            setFormOpen(false);
            loadTenants();
        }
    };

    const handleDelete = async (tenant) => {
        const result = await dispatch(deleteTenant(tenant.tenantId));
        if (!result.error) {
            loadTenants();
        }
    };

    const handleToggleStatus = async (tenant) => {
        const result = await dispatch(toggleTenantStatus(tenant.tenantId));
        if (!result.error) {
            loadTenants();
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            
            <TenantsList
                tenants={tenants}
                loading={loading}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onRefresh={loadTenants}
            />

            <TenantForm
                open={formOpen}
                tenant={selectedTenant}
                mode={formMode}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSubmit}
            />

            <TenantDetail
                open={detailOpen}
                tenant={selectedTenant}
                onClose={() => setDetailOpen(false)}
                onEdit={() => {
                    setDetailOpen(false);
                    handleEdit(selectedTenant);
                }}
                onRefresh={loadTenants}
            />
        </Box>
    );
}

export default Tenants;