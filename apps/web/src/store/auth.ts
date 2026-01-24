import { create } from 'zustand'

interface User {
  id: string
  email: string
  name?: string
  role: string
  quota: number
  createdAt?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isInitialized: boolean
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
  initializeAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  isInitialized: false,
  
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
    set({ user, token })
  },

  setUser: (user) => {
    set({ user })
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    set({ user: null, token: null })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setInitialized: (initialized) => {
    set({ isInitialized: initialized })
  },
  
  isAuthenticated: () => !!get().token,
  
  isAdmin: () => get().user?.role === 'admin',

  initializeAuth: async () => {
    const { token, setUser, setLoading, setInitialized } = get()
    
    if (!token) {
      setInitialized(true)
      return
    }

    setLoading(true)
    
    try {
      // 动态导入 API 以避免 SSR 问题
      const { authApi } = await import('../lib/api')
      
      // 添加超时处理，5秒后自动放弃
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      })
      
      const response = await Promise.race([
        authApi.getMe(),
        timeoutPromise
      ]) as any
      
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to get user info:', error)
      // 如果获取用户信息失败，清除 token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      set({ user: null, token: null })
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  },
}))
