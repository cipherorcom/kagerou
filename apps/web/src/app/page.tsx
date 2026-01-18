'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, user } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查认证状态
    const checkAuth = () => {
      if (isAuthenticated()) {
        // 已登录用户根据角色跳转
        if (isAdmin()) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        setLoading(false)
      }
    }

    // 延迟检查，确保状态已更新
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [isAuthenticated, isAdmin, router, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kagerou</h1>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">DNS 管理系统</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                href="/login"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                注册
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main>
        {/* Hero 区域 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              简单高效的
              <span className="text-blue-600 dark:text-blue-400 block">DNS 管理平台</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              支持多个 DNS 服务商，统一管理您的域名记录。
              简单易用的界面，强大的功能，让域名管理变得轻松愉快。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                立即开始
              </Link>
              <Link
                href="/login"
                className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-8 py-3 rounded-lg text-lg font-medium border border-gray-300 dark:border-gray-600 transition-colors"
              >
                登录账号
              </Link>
            </div>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="bg-white dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">核心功能</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">为您提供专业的 DNS 管理解决方案</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">多 Provider 支持</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  支持 Cloudflare、阿里云等主流 DNS 服务商，统一管理多个平台的域名记录
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">简单易用</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  直观的用户界面，无需复杂配置，几分钟即可上手使用
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">安全可靠</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  凭证加密存储，完善的权限控制，保障您的数据安全
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 支持的 DNS 服务商 */}
        <div className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">支持的 DNS 服务商</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">与主流 DNS 服务商深度集成</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="text-center">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-orange-500 mb-2">Cloudflare</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">全球 CDN 领导者</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-500 mb-2">阿里云</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">国内领先云服务</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm opacity-50">
                  <div className="text-2xl font-bold text-gray-400 mb-2">AWS</div>
                  <p className="text-sm text-gray-400">即将支持</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm opacity-50">
                  <div className="text-2xl font-bold text-gray-400 mb-2">腾讯云</div>
                  <p className="text-sm text-gray-400">即将支持</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 区域 */}
        <div className="bg-blue-600 dark:bg-blue-700 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              准备开始了吗？
            </h2>
            <p className="text-xl text-blue-100 dark:text-blue-200 mb-8">
              立即注册，开始管理您的域名记录
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                免费注册
              </Link>
              <Link
                href="/create-admin"
                className="bg-blue-700 dark:bg-blue-800 hover:bg-blue-800 dark:hover:bg-blue-900 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                创建管理员
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 Kagerou DNS 管理系统. 保留所有权利.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
