'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminApi } from '@/lib/api'

interface User {
  id: string
  email: string
  name?: string
  role: string
  quota: number
  isActive: boolean
  createdAt: string
  _count: {
    domains: number
    dnsAccounts: number
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function UsersManagement() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingQuota, setEditingQuota] = useState<{ userId: string; quota: number } | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    if (!isAdmin()) {
      router.push('/dashboard')
      return
    }

    loadUsers()
  }, [isAuthenticated, isAdmin, router, currentPage])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getUsers(currentPage, 20)
      const data: UsersResponse = response.data
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.response?.data?.error || '加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId: string) => {
    try {
      await adminApi.toggleUserStatus(userId)
      loadUsers() // 重新加载列表
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handlePromoteUser = async (userId: string) => {
    try {
      await adminApi.promoteUser(userId)
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleDemoteUser = async (userId: string) => {
    try {
      await adminApi.demoteUser(userId)
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleUpdateQuota = async () => {
    if (!editingQuota) return

    try {
      await adminApi.updateUserQuota(editingQuota.userId, editingQuota.quota)
      setEditingQuota(null)
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || '更新配额失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-900 dark:text-white">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">用户管理</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">管理系统用户，修改配额和权限</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              返回控制台
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
            {users.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        user.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'
                      }`}>
                        {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name || user.email}</p>
                        {user.role === 'admin' && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                            管理员
                          </span>
                        )}
                        {!user.isActive && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            已禁用
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        配额: {user.quota} | 域名: {user._count.domains} | DNS账号: {user._count.dnsAccounts}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* 配额编辑 */}
                    {editingQuota?.userId === user.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editingQuota.quota}
                          onChange={(e) => setEditingQuota({ ...editingQuota, quota: Number(e.target.value) })}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm"
                          min="0"
                          max="1000"
                        />
                        <button
                          onClick={handleUpdateQuota}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingQuota(null)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingQuota({ userId: user.id, quota: user.quota })}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                      >
                        配额: {user.quota}
                      </button>
                    )}

                    {/* 状态切换 */}
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        user.isActive
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                      }`}
                    >
                      {user.isActive ? '禁用' : '启用'}
                    </button>

                    {/* 角色管理 */}
                    {user.role === 'admin' ? (
                      <button
                        onClick={() => handleDemoteUser(user.id)}
                        className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800 px-3 py-1 rounded text-xs font-medium"
                      >
                        降级
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePromoteUser(user.id)}
                        className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 px-3 py-1 rounded text-xs font-medium"
                      >
                        提升
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 分页 */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                上一页
              </button>
              
              <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                {currentPage} / {pagination.pages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                下一页
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}