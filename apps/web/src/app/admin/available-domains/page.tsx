'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminApi } from '@/lib/api'

interface AvailableDomain {
  id: string
  domain: string
  isActive: boolean
  createdAt: string
  dnsAccount: {
    id: string
    provider: {
      name: string
      displayName: string
    }
  }
  _count: {
    domains: number
  }
}

interface DNSAccount {
  id: string
  name: string
  provider: {
    name: string
    displayName: string
  }
}

export default function AvailableDomainsManagement() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const [domains, setDomains] = useState<AvailableDomain[]>([])
  const [dnsAccounts, setDnsAccounts] = useState<DNSAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    dnsAccountId: '',
    domain: ''
  })
  const [availableDomainsFromProvider, setAvailableDomainsFromProvider] = useState<string[]>([])
  const [loadingDomains, setLoadingDomains] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    if (!isAdmin()) {
      router.push('/dashboard')
      return
    }

    loadData()
  }, [isAuthenticated, isAdmin, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [domainsRes, accountsRes] = await Promise.all([
        adminApi.getAvailableDomains(),
        adminApi.getDnsAccounts()
      ])
      setDomains(domainsRes.data.domains)
      setDnsAccounts(accountsRes.data.accounts)
    } catch (err: any) {
      setError(err.response?.data?.error || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadDnsAccountDomains = async (accountId: string) => {
    if (!accountId) {
      setAvailableDomainsFromProvider([])
      return
    }

    try {
      setLoadingDomains(true)
      const response = await adminApi.getDnsAccountDomains(accountId)
      setAvailableDomainsFromProvider(response.data.domains)
    } catch (err: any) {
      console.error('Failed to load domains:', err)
      setAvailableDomainsFromProvider([])
      alert(err.response?.data?.error || '获取域名列表失败')
    } finally {
      setLoadingDomains(false)
    }
  }

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await adminApi.createAvailableDomain({
        dnsAccountId: formData.dnsAccountId,
        domain: formData.domain
      })
      
      setShowCreateForm(false)
      setFormData({ dnsAccountId: '', domain: '' })
      setAvailableDomainsFromProvider([])
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.error || '创建可用域名失败')
    }
  }

  const handleToggleDomain = async (id: string, isActive: boolean) => {
    try {
      await adminApi.updateAvailableDomain(id, { isActive: !isActive })
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleDeleteDomain = async (id: string) => {
    if (!confirm('确定要删除这个可用域名吗？此操作不可恢复。')) {
      return
    }

    try {
      await adminApi.deleteAvailableDomain(id)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.error || '删除失败')
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">可用域名管理</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">管理用户可以注册子域名的根域名</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                添加可用域名
              </button>
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
          <div className="mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 创建表单 */}
        {showCreateForm && (
          <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">添加可用域名</h3>
            <form onSubmit={handleCreateDomain} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">DNS 账号</label>
                <select
                  value={formData.dnsAccountId}
                  onChange={(e) => {
                    const accountId = e.target.value
                    setFormData({ ...formData, dnsAccountId: accountId, domain: '' })
                    loadDnsAccountDomains(accountId)
                  }}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">选择 DNS 账号</option>
                  {dnsAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.provider.displayName})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  选择DNS账号后将自动加载该账号下的域名列表
                </p>
              </div>
              
              {formData.dnsAccountId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    选择域名
                    {loadingDomains && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">加载中...</span>
                    )}
                  </label>
                  {loadingDomains ? (
                    <div className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      正在从DNS服务商获取域名列表...
                    </div>
                  ) : availableDomainsFromProvider.length > 0 ? (
                    <select
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">选择域名</option>
                      {availableDomainsFromProvider.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      该DNS账号下没有找到域名，请确保在DNS服务商控制台中已添加域名
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    只能选择在DNS服务商控制台中已存在的域名
                  </p>
                </div>
              )}
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={!formData.domain || loadingDomains}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ dnsAccountId: '', domain: '' })
                    setAvailableDomainsFromProvider([])
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 域名列表 */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
            {domains.map((domain) => (
              <li key={domain.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        domain.isActive ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                        {domain.domain[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{domain.domain}</p>
                        {!domain.isActive && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            已禁用
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        DNS Provider: {domain.dnsAccount.provider.displayName}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        子域名数量: {domain._count.domains} | 创建时间: {new Date(domain.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleDomain(domain.id, domain.isActive)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        domain.isActive
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                      }`}
                    >
                      {domain.isActive ? '禁用' : '启用'}
                    </button>

                    <button
                      onClick={() => handleDeleteDomain(domain.id)}
                      disabled={domain._count.domains > 0}
                      className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 px-3 py-1 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title={domain._count.domains > 0 ? '有子域名，无法删除' : '删除可用域名'}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {domains.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">暂无可用域名</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              请先添加可用域名，用户才能注册子域名
            </p>
          </div>
        )}
      </div>
    </div>
  )
}