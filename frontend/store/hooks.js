// frontend/src/store/hooks.js
import { useDispatch, useSelector, useStore } from 'react-redux';

// 类型化 Hooks
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
export const useAppStore = useStore;

// 自定义 Hooks
export const useAuth = () => {
    const auth = useSelector((state) => state.auth);
    return auth;
};

export const useTenants = () => {
    const tenants = useSelector((state) => state.tenants);
    return tenants;
};

export const useFiles = () => {
    const files = useSelector((state) => state.files);
    return files;
};

// 认证状态 Hooks
export const useIsAuthenticated = () => {
    return useSelector((state) => state.auth.isAuthenticated);
};

export const useCurrentUser = () => {
    return useSelector((state) => state.auth.user);
};

export const useUserPermissions = () => {
    return useSelector((state) => state.auth.permissions);
};

// 客户相关 Hooks
export const useTenantList = () => {
    return useSelector((state) => state.tenants.tenants);
};

export const useSelectedTenant = () => {
    return useSelector((state) => state.tenants.selectedTenant);
};

export const useTenantFilters = () => {
    return useSelector((state) => state.tenants.filters);
};

export const useTenantPagination = () => {
    return useSelector((state) => state.tenants.pagination);
};

// 文件相关 Hooks
export const useFileList = () => {
    return useSelector((state) => state.files.files);
};

export const useProcessingJobs = () => {
    return useSelector((state) => state.files.processingJobs);
};

export const useFileStats = () => {
    return useSelector((state) => state.files.stats);
};

export const useUploadProgress = () => {
    return useSelector((state) => state.files.uploadProgress);
};

export const useIsUploading = () => {
    return useSelector((state) => state.files.isUploading);
};