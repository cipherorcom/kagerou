'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminApi } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'

interface Domain {
  id: string
  subdomain: string
  recordType: string
  value: string
  status: string
  ttl: number
  proxied: boolean
  createdAt: string
  user: {
    id: string
    email: string
    name?: string
  }
  dnsAccount: {
    id: string
    provider: {
      name: string
      displayName: string
    }
  }
  availableDomain: {
    id: string
    domain: string
  }
}

interface DomainsResponse {
  domains: Domain[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function DomainsManagement() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const [domains, setDomains] = useState<Domain[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [editingDomain, setEditingDomain] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    if (!isAdmin()) {
      router.push('/dashboard')
      return
    }

    loadDomains()
  }, [isAuthenticated, isAdmin, router, currentPage, statusFilter])

  const loadDomains = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getDomains(currentPage, 50, statusFilter || undefined)
      const data: DomainsResponse = response.data
      setDomains(data.domains)
      setPagination(data.pagination)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '加载域名列表失败')
    } finally {
      setLoading(false)
    }
  }

  const updateDomainStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateDomainStatus(id, status)
      await loadDomains()
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '更新域名状态失败')
    }
  }

  const updateDomainValue = async (id: string, value: string) => {
    try {
      await adminApi.updateDomainValue(id, value)
      await loadDomains()
      setEditingDomain(null)
      setEditValue('')
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '更新域名值失败')
    }
  }

  const deleteDomain = async (id: string) => {
    if (!confirm('确定要删除这个域名记录吗？此操作不可恢复。')) {
      return
    }

    try {
      await adminApi.deleteDomain(id)
      await loadDomains()
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '删除域名失败')
    }
  }

  const startEdit = (domain: Domain) => {
    setEditingDomain(domain.id)
    setEditValue(domain.value)
  }

  const cancelEdit = () => {
    setEditingDomain(null)
    setEditValue('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '正常'
      case 'pending':
        return '待处理'
      case 'rejected':
        return '拒绝'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-900 dark:text-white">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">域名管理</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">查看和管理所有域名记录</p>
            </div>
            <div className="flex space-x-4">
              <ThemeToggle />
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                返回控制台
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 筛选器 */}
        <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">状态筛选:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部</option>
              <option value="active">正常</option>
              <option value="pending">待处理</option>
              <option value="rejected">拒绝</option>
            </select>
          </div>
        </div>

        {/* 域名列表 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              域名记录 ({pagination?.total || 0})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {domains.map((domain) => (
              <div key={domain.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {domain.subdomain}.{domain.availableDomain.domain}
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {domain.recordType}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(domain.status)}`}>
                        {getStatusText(domain.status)}
                      </span>
                      {domain.proxied && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                          代理
                        </span>
                      )}
                    </div>
                    
                    {editingDomain === domain.id ? (
                      <div className="mb-3">
                        <div className="flex items-center space-x-2">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm"
                            placeholder="记录值"
                          />
                          <button
                            onClick={() => updateDomainValue(domain.id, editValue)}
                            className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                          >
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">记录值:</span>
                          <span className="ml-2 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            {domain.value}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {domain.user.name || domain.user.email}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        {domain.dnsAccount.provider.displayName}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        TTL: {domain.ttl}s
                      </div>
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                        {new Date(domain.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-6">
                    {/* 状态管理 */}
                    <select
                      value={domain.status}
                      onChange={(e) => updateDomainStatus(domain.id, e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1"
                    >
                      <option value="active">正常</option>
                      <option value="pending">待处理</option>
                      <option value="rejected">拒绝</option>
                    </select>

                    {editingDomain !== domain.id && (
                      <button
                        onClick={() => startEdit(domain)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                      >
                        编辑值
                      </button>
                    )}

                    <button
                      onClick={() => deleteDomain(domain.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {domains.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">暂无域名记录</p>
          </div>
        )}

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