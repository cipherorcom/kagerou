'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminApi } from '@/lib/api'

interface Provider {
  id: string
  name: string
  displayName: string
  isActive: boolean
  configSchema: any
  createdAt: string
  _count: {
    accounts: number
  }
}

export default function ProvidersManagement() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    configSchema: '{}'
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    if (!isAdmin()) {
      router.push('/dashboard')
      return
    }

    loadProviders()
  }, [isAuthenticated, isAdmin, router])

  const loadProviders = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getProviders()
      setProviders(response.data.providers)
    } catch (err: any) {
      setError(err.response?.data?.error || '加载 Provider 列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let configSchema = {}
      try {
        configSchema = JSON.parse(formData.configSchema)
      } catch {
        alert('配置 Schema 必须是有效的 JSON')
        return
      }

      await adminApi.createProvider({
        name: formData.name,
        displayName: formData.displayName,
        configSchema
      })
      
      setShowCreateForm(false)
      setFormData({ name: '', displayName: '', configSchema: '{}' })
      loadProviders()
    } catch (err: any) {
      alert(err.response?.data?.error || '创建 Provider 失败')
    }
  }

  const handleToggleProvider = async (id: string, isActive: boolean) => {
    try {
      await adminApi.updateProvider(id, { isActive: !isActive })
      loadProviders()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('确定要删除这个 Provider 吗？此操作不可恢复。')) {
      return
    }

    try {
      await adminApi.deleteProvider(id)
      loadProviders()
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DNS Provider 管理</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">管理 DNS 服务商配置</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                添加 Provider
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">添加新 Provider</h3>
            <form onSubmit={handleCreateProvider} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">名称 (英文标识)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如: cloudflare"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">显示名称</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如: Cloudflare"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">配置 Schema (JSON)</label>
                <textarea
                  value={formData.configSchema}
                  onChange={(e) => setFormData({ ...formData, configSchema: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder='{"apiToken": {"type": "string", "required": true}}'
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Provider 列表 */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
            {providers.map((provider) => (
              <li key={provider.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        provider.isActive ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                        {provider.displayName[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{provider.displayName}</p>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({provider.name})</span>
                        {!provider.isActive && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            已禁用
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        关联账号: {provider._count.accounts}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        创建时间: {new Date(provider.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleProvider(provider.id, provider.isActive)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        provider.isActive
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                      }`}
                    >
                      {provider.isActive ? '禁用' : '启用'}
                    </button>

                    <button
                      onClick={() => handleDeleteProvider(provider.id)}
                      disabled={provider._count.accounts > 0}
                      className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 px-3 py-1 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title={provider._count.accounts > 0 ? '有关联账号，无法删除' : '删除 Provider'}
                    >
                      删除
                    </button>
                  </div>
                </div>
                
                {/* 配置 Schema 预览 */}
                <div className="mt-3 text-xs">
                  <details className="text-gray-600 dark:text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">配置 Schema</summary>
                    <pre className="mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto text-gray-900 dark:text-gray-100">
                      {JSON.stringify(provider.configSchema, null, 2)}
                    </pre>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {providers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">暂无 DNS Provider</p>
          </div>
        )}
      </div>
    </div>
  )
}