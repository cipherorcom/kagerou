import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
}

export const dnsAccountApi = {
  list: () => api.get('/api/dns-accounts'),
  create: (data: { providerId: string; credentials: any; isDefault?: boolean }) =>
    api.post('/api/dns-accounts', data),
  delete: (id: string) => api.delete(`/api/dns-accounts/${id}`),
}

export const domainApi = {
  list: () => api.get('/api/domains'),
  create: (data: {
    dnsAccountId: string
    subdomain: string
    recordType: string
    value: string
    ttl?: number
  }) => api.post('/api/domains', data),
  update: (id: string, data: { value: string; ttl?: number }) =>
    api.patch(`/api/domains/${id}`, data),
  delete: (id: string) => api.delete(`/api/domains/${id}`),
}
