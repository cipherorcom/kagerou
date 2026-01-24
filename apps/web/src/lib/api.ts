import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  // 确保在浏览器环境下才访问 localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 只有在不是登录页面时才清除token并跳转
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
          localStorage.removeItem('token')
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; name?: string; inviteCode?: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data: { name?: string; email?: string; password?: string }) => 
    api.put('/api/auth/profile', data),
  createAdmin: (data: { email: string; password: string; name?: string }) =>
    api.post('/api/auth/create-admin', data),
  getRegistrationSettings: () => api.get('/api/auth/registration-settings'),
}

export const adminApi = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: (page = 1, limit = 20) => api.get(`/api/admin/users?page=${page}&limit=${limit}`),
  updateUserQuota: (id: string, quota: number) => api.patch(`/api/admin/users/${id}/quota`, { quota }),
  toggleUserStatus: (id: string) => api.patch(`/api/admin/users/${id}/toggle-status`),
  promoteUser: (id: string) => api.patch(`/api/admin/users/${id}/promote`),
  demoteUser: (id: string) => api.patch(`/api/admin/users/${id}/demote`),
  createUser: (data: { email: string; password: string; name?: string; role?: 'user' | 'admin'; quota?: number }) =>
    api.post('/api/admin/users', data),
  updateUser: (id: string, data: { email?: string; name?: string; role?: 'user' | 'admin'; quota?: number; isActive?: boolean }) =>
    api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),
  resetUserPassword: (id: string, password: string) => api.patch(`/api/admin/users/${id}/reset-password`, { password }),
  getProviders: () => api.get('/api/admin/providers'),
  createProvider: (data: { name: string; displayName: string; configSchema?: any }) =>
    api.post('/api/admin/providers', data),
  updateProvider: (id: string, data: { displayName?: string; configSchema?: any; isActive?: boolean }) =>
    api.patch(`/api/admin/providers/${id}`, data),
  deleteProvider: (id: string) => api.delete(`/api/admin/providers/${id}`),
  getDnsAccounts: () => api.get('/api/admin/dns-accounts'),
  createDnsAccount: (data: { name: string; providerId: string; credentials: any; isDefault?: boolean }) =>
    api.post('/api/admin/dns-accounts', data),
  updateDnsAccount: (id: string, data: { 
    name?: string;
    credentials?: any;
    isActive?: boolean; 
    isDefault?: boolean;
  }) =>
    api.patch(`/api/admin/dns-accounts/${id}`, data),
  deleteDnsAccount: (id: string) => api.delete(`/api/admin/dns-accounts/${id}`),
  getDnsAccountDomains: (id: string) => api.get(`/api/admin/dns-accounts/${id}/domains`),
  getAvailableDomains: () => api.get('/api/admin/available-domains'),
  createAvailableDomain: (data: { dnsAccountId: string; domain: string }) =>
    api.post('/api/admin/available-domains', data),
  updateAvailableDomain: (id: string, data: { isActive?: boolean }) =>
    api.patch(`/api/admin/available-domains/${id}`, data),
  deleteAvailableDomain: (id: string) => api.delete(`/api/admin/available-domains/${id}`),
  getDomains: (page = 1, limit = 50, status?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    return api.get(`/api/admin/domains?${params}`);
  },
  getLogs: (page = 1, limit = 50, userId?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (userId) params.append('userId', userId);
    return api.get(`/api/admin/logs?${params}`);
  },
  getBlockedSubdomains: () => api.get('/api/admin/blocked-subdomains'),
  createBlockedSubdomain: (data: { subdomain: string; reason?: string }) =>
    api.post('/api/admin/blocked-subdomains', data),
  updateBlockedSubdomain: (id: string, data: { reason?: string }) =>
    api.put(`/api/admin/blocked-subdomains/${id}`, data),
  deleteBlockedSubdomain: (id: string) => api.delete(`/api/admin/blocked-subdomains/${id}`),
  updateDomainStatus: (id: string, status: string) => api.patch(`/api/admin/domains/${id}/status`, { status }),
  updateDomainValue: (id: string, value: string) => api.patch(`/api/admin/domains/${id}/value`, { value }),
  deleteDomain: (id: string) => api.delete(`/api/admin/domains/${id}`),
  getSettings: () => api.get('/api/admin/settings'),
  updateSetting: (key: string, value: string) => api.put(`/api/admin/settings/${key}`, { value }),
  
  // 邀请码管理
  getInviteCodes: () => api.get('/api/admin/invite-codes'),
  createInviteCode: (data: {
    code?: string;
    description?: string;
    maxUses: number;
    expiresAt?: string;
    isActive: boolean;
  }) => api.post('/api/admin/invite-codes', data),
  updateInviteCode: (id: string, data: {
    description?: string;
    maxUses?: number;
    expiresAt?: string;
    isActive?: boolean;
  }) => api.put(`/api/admin/invite-codes/${id}`, data),
  deleteInviteCode: (id: string) => api.delete(`/api/admin/invite-codes/${id}`),
}

export const domainApi = {
  getAvailableDomains: () => api.get('/api/available-domains'),
  list: () => api.get('/api/domains'),
  create: (data: {
    availableDomainId: string
    subdomain: string
    recordType: string
    value: string
    proxied?: boolean
  }) => api.post('/api/domains', data),
  update: (id: string, data: { value?: string; proxied?: boolean }) =>
    api.patch(`/api/domains/${id}`, data),
  delete: (id: string) => api.delete(`/api/domains/${id}`),
}
