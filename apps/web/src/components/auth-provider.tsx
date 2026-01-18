'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializeAuth, isInitialized, isLoading, token } = useAuthStore()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth()
    }
    
    // 设置一个最大等待时间，避免无限加载
    const maxWaitTime = setTimeout(() => {
      setShowContent(true)
    }, 3000) // 3秒后强制显示内容

    if (isInitialized) {
      clearTimeout(maxWaitTime)
      setShowContent(true)
    }

    return () => clearTimeout(maxWaitTime)
  }, [initializeAuth, isInitialized])

  // 如果没有 token，立即显示内容
  if (!token) {
    return <>{children}</>
  }

  // 如果有 token 但还在初始化，显示加载状态（但有超时保护）
  if (!isInitialized && !showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-900 dark:text-white">验证登录状态...</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            如果长时间无响应，请刷新页面
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}