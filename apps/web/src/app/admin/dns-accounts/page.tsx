'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminApi } from '@/lib/api'

interface DNSAccount {
  id: string
  name: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  provider: {
    id: string
    name: string
    displayName: string
  }
  _count: {
    domains: number
    availableDomains: number
  }
}

interface DNSProvider {
  id: string
  name: string
  displayName: string
  isActive: boolean
}

export default function DNSAccountsManagement() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const [accounts, setAccounts] = useState<DNSAccount[]>([])
  const [providers, setProviders] = useState<DNSProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<DNSAccount | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    providerId: '',
    isDefault: false
  })
  const [credentials, setCredentials] = useState<any>({})
  const [selectedProvider, setSelectedProvider] = useState<DNSProvider | null>(null)

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
      const [accountsRes, providersRes] = await Promise.all([
        adminApi.getDnsAccounts(),
        adminApi.getProviders()
      ])
      setAccounts(accountsRes.data.accounts)
      setProviders(providersRes.data.providers.filter((p: DNSProvider) => p.isActive))
    } catch (err: any) {
      setError(err.response?.data?.error || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 验证必填字段
      if (!selectedProvider) {
        alert('请选择 DNS Provider')
        return
      }

      // 验证凭证字段
      if (selectedProvider.name === 'cloudflare') {
        if (credentials.useGlobalKey) {
          if (!credentials.apiKey || !credentials.email) {
            alert('请输入 Cloudflare Global API Key 和 Email')
            return
          }
        } else {
          if (!credentials.apiToken) {
            alert('请输入 Cloudflare API Token')
            return
          }
        }
      } else if (selectedProvider.name === 'aliyun') {
        if (!credentials.accessKeyId || !credentials.accessKeySecret) {
          alert('请输入阿里云 Access Key ID 和 Access Key Secret')
          return
        }
      }

      await adminApi.createDnsAccount({
        name: formData.name,
        providerId: formData.providerId,
        credentials,
        isDefault: formData.isDefault
      })
      
      setShowCreateForm(false)
      setFormData({ name: '', providerId: '', isDefault: false })
      setCredentials({})
      setSelectedProvider(null)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.error || '创建 DNS 账号失败')
    }
  }

  const handleEditAccount = (account: DNSAccount) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      providerId: account.provider.id,
      isDefault: account.isDefault
    })
    // 创建完整的provider对象
    const fullProvider: DNSProvider = {
      ...account.provider,
      isActive: true // 假设provider是活跃的，因为它能被使用
    }
    setSelectedProvider(fullProvider)
    setCredentials({}) // 重置凭证，需要重新输入
    setShowEditForm(true)
  }

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingAccount) return

    try {
      // 验证必填字段
      if (!selectedProvider) {
        alert('请选择 DNS Provider')
        return
      }

      // 验证凭证字段
      if (selectedProvider.name === 'cloudflare') {
        if (credentials.useGlobalKey) {
          if (!credentials.apiKey || !credentials.email) {
            alert('请输入 Cloudflare Global API Key 和 Email')
            return
          }
        } else {
          if (!credentials.apiToken) {
            alert('请输入 Cloudflare API Token')
            return
          }
        }
      } else if (selectedProvider.name === 'aliyun') {
        if (!credentials.accessKeyId || !credentials.accessKeySecret) {
          alert('请输入阿里云 Access Key ID 和 Access Key Secret')
          return
        }
      }

      await adminApi.updateDnsAccount(editingAccount.id, {
        name: formData.name,
        credentials,
        isDefault: formData.isDefault
      })
      
      setShowEditForm(false)
      setEditingAccount(null)
      setFormData({ name: '', providerId: '', isDefault: false })
      setCredentials({})
      setSelectedProvider(null)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.error || '更新 DNS 账号失败')
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await adminApi.updateDnsAccount(id, { isActive: !isActive })
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleToggleDefault = async (id: string, isDefault: boolean) => {
    try {
      await adminApi.updateDnsAccount(id, { isDefault: !isDefault })
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('确定要删除这个 DNS 账号吗？此操作不可恢复。')) {
      return
    }

    try {
      await adminApi.deleteDnsAccount(id)
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DNS 账号管理</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">管理用户的 DNS 服务商账号</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                创建 DNS 账号
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">创建 DNS 账号</h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">账号名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如: 主要 Cloudflare 账号"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  为此DNS账号起一个便于识别的名称
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">DNS Provider</label>
                <select
                  value={formData.providerId}
                  onChange={(e) => {
                    const provider = providers.find(p => p.id === e.target.value)
                    setFormData({ ...formData, providerId: e.target.value })
                    setSelectedProvider(provider || null)
                    setCredentials({}) // 清空凭证
                  }}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">选择 DNS Provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.displayName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 根据选择的Provider显示不同的认证字段 */}
              {selectedProvider && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedProvider.displayName} 认证信息
                  </h4>
                  
                  {selectedProvider.name === 'cloudflare' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="cloudflareAuthType"
                            value="token"
                            checked={!credentials.useGlobalKey}
                            onChange={() => setCredentials({ apiToken: '' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">API Token (推荐)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="cloudflareAuthType"
                            value="global"
                            checked={credentials.useGlobalKey}
                            onChange={() => setCredentials({ useGlobalKey: true, apiKey: '', email: '' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Global API Key</span>
                        </label>
                      </div>
                      
                      {credentials.useGlobalKey ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Email
                            </label>
                            <input
                              type="email"
                              value={credentials.email || ''}
                              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="输入 Cloudflare 账号邮箱"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Global API Key
                            </label>
                            <input
                              type="password"
                              value={credentials.apiKey || ''}
                              onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="输入 Cloudflare Global API Key"
                              required
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            在 Cloudflare 控制台的 "My Profile" → "API Tokens" → "Global API Key" 中获取
                          </p>
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            API Token
                          </label>
                          <input
                            type="password"
                            value={credentials.apiToken || ''}
                            onChange={(e) => setCredentials({ ...credentials, apiToken: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="输入 Cloudflare API Token"
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            在 Cloudflare 控制台的 "My Profile" → "API Tokens" 中创建
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedProvider.name === 'aliyun' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Access Key ID
                        </label>
                        <input
                          type="text"
                          value={credentials.accessKeyId || ''}
                          onChange={(e) => setCredentials({ ...credentials, accessKeyId: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="输入阿里云 Access Key ID"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Access Key Secret
                        </label>
                        <input
                          type="password"
                          value={credentials.accessKeySecret || ''}
                          onChange={(e) => setCredentials({ ...credentials, accessKeySecret: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="输入阿里云 Access Key Secret"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        在阿里云控制台的 "AccessKey 管理" 中创建
                      </p>
                    </>
                  )}
                  
                  {/* 其他Provider使用JSON格式 */}
                  {!['cloudflare', 'aliyun'].includes(selectedProvider.name) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        认证信息 (JSON 格式)
                      </label>
                      <textarea
                        value={JSON.stringify(credentials, null, 2)}
                        onChange={(e) => {
                          try {
                            setCredentials(JSON.parse(e.target.value))
                          } catch {
                            // 忽略JSON解析错误，让用户继续输入
                          }
                        }}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder='{"apiKey": "your-api-key"}'
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        请输入有效的 JSON 格式认证信息
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  设为默认账号
                </label>
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

        {/* 编辑表单 */}
        {showEditForm && editingAccount && (
          <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">编辑 DNS 账号</h3>
            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">账号名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如: 主要 Cloudflare 账号"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  为此DNS账号起一个便于识别的名称
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">DNS Provider</label>
                <div className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {selectedProvider?.displayName} (不可修改)
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  DNS Provider 创建后不能修改，如需更换请删除后重新创建
                </p>
              </div>
              
              {/* 根据选择的Provider显示不同的认证字段 */}
              {selectedProvider && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    更新 {selectedProvider.displayName} 认证信息
                  </h4>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    出于安全考虑，需要重新输入认证信息
                  </p>
                  
                  {selectedProvider.name === 'cloudflare' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="cloudflareAuthType"
                            value="token"
                            checked={!credentials.useGlobalKey}
                            onChange={() => setCredentials({ apiToken: '' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">API Token (推荐)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="cloudflareAuthType"
                            value="global"
                            checked={credentials.useGlobalKey}
                            onChange={() => setCredentials({ useGlobalKey: true, apiKey: '', email: '' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Global API Key</span>
                        </label>
                      </div>
                      
                      {credentials.useGlobalKey ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Email
                            </label>
                            <input
                              type="email"
                              value={credentials.email || ''}
                              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="输入 Cloudflare 账号邮箱"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Global API Key
                            </label>
                            <input
                              type="password"
                              value={credentials.apiKey || ''}
                              onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="输入 Cloudflare Global API Key"
                              required
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            API Token
                          </label>
                          <input
                            type="password"
                            value={credentials.apiToken || ''}
                            onChange={(e) => setCredentials({ ...credentials, apiToken: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="输入 Cloudflare API Token"
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedProvider.name === 'aliyun' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Access Key ID
                        </label>
                        <input
                          type="text"
                          value={credentials.accessKeyId || ''}
                          onChange={(e) => setCredentials({ ...credentials, accessKeyId: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="输入阿里云 Access Key ID"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Access Key Secret
                        </label>
                        <input
                          type="password"
                          value={credentials.accessKeySecret || ''}
                          onChange={(e) => setCredentials({ ...credentials, accessKeySecret: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="输入阿里云 Access Key Secret"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  {/* 其他Provider使用JSON格式 */}
                  {!['cloudflare', 'aliyun'].includes(selectedProvider.name) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        认证信息 (JSON 格式)
                      </label>
                      <textarea
                        value={JSON.stringify(credentials, null, 2)}
                        onChange={(e) => {
                          try {
                            setCredentials(JSON.parse(e.target.value))
                          } catch {
                            // 忽略JSON解析错误，让用户继续输入
                          }
                        }}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder='{"apiKey": "your-api-key"}'
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <label htmlFor="editIsDefault" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  设为默认账号
                </label>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  更新
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingAccount(null)
                    setFormData({ name: '', providerId: '', isDefault: false })
                    setCredentials({})
                    setSelectedProvider(null)
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 账号列表 */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
            {accounts.map((account) => (
              <li key={account.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        account.isActive ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                        {account.provider.displayName[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </p>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({account.provider.displayName})</span>
                        {account.isDefault && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            默认
                          </span>
                        )}
                        {!account.isActive && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            已禁用
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        可用域名: {account._count.availableDomains} | 域名记录: {account._count.domains} | 创建时间: {new Date(account.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditAccount(account)}
                      className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-1 rounded text-xs font-medium"
                    >
                      编辑
                    </button>

                    <button
                      onClick={() => handleToggleDefault(account.id, account.isDefault)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        account.isDefault
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
                      }`}
                    >
                      {account.isDefault ? '取消默认' : '设为默认'}
                    </button>

                    <button
                      onClick={() => handleToggleStatus(account.id, account.isActive)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        account.isActive
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                      }`}
                    >
                      {account.isActive ? '禁用' : '启用'}
                    </button>

                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      disabled={account._count.availableDomains > 0 || account._count.domains > 0}
                      className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 px-3 py-1 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title={account._count.availableDomains > 0 || account._count.domains > 0 ? '有关联数据，无法删除' : '删除 DNS 账号'}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">暂无 DNS 账号</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              请先创建 DNS 账号，然后才能添加可用域名
            </p>
          </div>
        )}
      </div>
    </div>
  )
}