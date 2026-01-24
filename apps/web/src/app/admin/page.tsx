'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminApi } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'

interface Stats {
  users: {
    total: number
    active: number
    recent: number
  }
  domains: {
    total: number
    active: number
    recent: number
  }
  dnsAccounts: {
    total: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAdmin, isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogout = () => {
    useAuthStore.getState().logout()
    router.push('/')
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    if (!isAdmin()) {
      router.push('/dashboard')
      return
    }

    loadStats()
  }, [isAuthenticated, isAdmin, router])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getStats()
      setStats(response.data.stats)
    } catch (err: any) {
      setError(err.response?.data?.error || '加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-900 dark:text-white">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">管理员控制台</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">欢迎回来，{user?.name || user?.email}</p>
            </div>
            <div className="flex space-x-4">
              <ThemeToggle />
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                用户面板
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">用</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">总用户数</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats?.users.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">{stats?.users.active}</span>
                <span className="text-gray-500 dark:text-gray-400"> 活跃用户</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">域</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">总域名数</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats?.domains.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">{stats?.domains.active}</span>
                <span className="text-gray-500 dark:text-gray-400"> 活跃域名</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">账</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">DNS 账号</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats?.dnsAccounts.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">新</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">本周新增</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats?.users.recent}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <span className="text-blue-600 dark:text-blue-400 font-medium">{stats?.domains.recent}</span>
                <span className="text-gray-500 dark:text-gray-400"> 新域名</span>
              </div>
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">用户管理</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">管理系统用户，修改配额和权限</p>
              <button
                onClick={() => router.push('/admin/users')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                管理用户
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">DNS Provider</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">管理 DNS 服务商配置</p>
              <button
                onClick={() => router.push('/admin/providers')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                管理 Provider
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">DNS 账号</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">管理用户的 DNS 服务商账号</p>
              <button
                onClick={() => router.push('/admin/dns-accounts')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                管理 DNS 账号
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">可用域名</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">管理用户可注册的根域名</p>
              <button
                onClick={() => router.push('/admin/available-domains')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                管理可用域名
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">域名管理</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">查看和管理所有域名记录</p>
              <button
                onClick={() => router.push('/admin/domains')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                管理域名
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">禁用子域名</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">管理不允许用户创建的子域名</p>
              <button
                onClick={() => router.push('/admin/blocked-subdomains')}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                管理禁用子域名
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">系统设置</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">配置系统行为和默认选项</p>
              <button
                onClick={() => router.push('/admin/settings')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                系统设置
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">邀请码管理</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">创建和管理用户注册邀请码</p>
              <button
                onClick={() => router.push('/admin/invite-codes')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                管理邀请码
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}