'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminApi } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'

interface InviteCode {
  id: string
  code: string
  description?: string
  maxUses: number
  usedCount: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
  creator: {
    name?: string
    email: string
  }
}

export default function InviteCodesPage() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [requireInviteCode, setRequireInviteCode] = useState(false)
  const [updatingSettings, setUpdatingSettings] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    maxUses: 1,
    expiresAt: '',
    isActive: true
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

    loadInviteCodes()
  }, [isAuthenticated, isAdmin, router])

  const loadInviteCodes = async () => {
    try {
      setLoading(true)
      const [inviteCodesResponse, settingsResponse] = await Promise.all([
        adminApi.getInviteCodes(),
        adminApi.getSettings()
      ])
      
      setInviteCodes(inviteCodesResponse.data.inviteCodes)
      
      // 获取邀请码设置
      const inviteCodeSetting = settingsResponse.data.settings.find(
        (s: any) => s.key === 'require_invite_code'
      )
      setRequireInviteCode(inviteCodeSetting?.value === 'true')
      
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '加载邀请码失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleRequireInviteCode = async () => {
    try {
      setUpdatingSettings(true)
      await adminApi.updateSetting('require_invite_code', requireInviteCode ? 'false' : 'true')
      setRequireInviteCode(!requireInviteCode)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '更新设置失败')
    } finally {
      setUpdatingSettings(false)
    }
  }

  const generateRandomCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setFormData({ ...formData, code: randomCode })
  }

  const createInviteCode = async () => {
    if (!formData.code.trim()) {
      setError('请输入邀请码或点击生成按钮')
      return
    }

    try {
      setCreating(true)
      await adminApi.createInviteCode(formData)
      await loadInviteCodes()
      setShowForm(false)
      setFormData({
        code: '',
        description: '',
        maxUses: 1,
        expiresAt: '',
        isActive: true
      })
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '创建邀请码失败')
    } finally {
      setCreating(false)
    }
  }

  const toggleInviteCode = async (id: string, isActive: boolean) => {
    try {
      await adminApi.updateInviteCode(id, { isActive: !isActive })
      await loadInviteCodes()
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '更新邀请码状态失败')
    }
  }

  const deleteInviteCode = async (id: string) => {
    if (!confirm('确定要删除这个邀请码吗？')) return

    try {
      await adminApi.deleteInviteCode(id)
      await loadInviteCodes()
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '删除邀请码失败')
    }
  }

  const getStatusColor = (inviteCode: InviteCode) => {
    if (!inviteCode.isActive) {
      return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
    }
    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    }
    if (inviteCode.expiresAt && new Date(inviteCode.expiresAt) < new Date()) {
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
    }
    return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
  }

  const getStatusText = (inviteCode: InviteCode) => {
    if (!inviteCode.isActive) return '已禁用'
    if (inviteCode.usedCount >= inviteCode.maxUses) return '已用完'
    if (inviteCode.expiresAt && new Date(inviteCode.expiresAt) < new Date()) return '已过期'
    return '可用'
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
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">邀请码管理</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                创建和管理用户注册邀请码
              </p>
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
        {/* 错误提示 */}
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

        {/* 邀请码功能开关 */}
        <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">邀请码功能</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {requireInviteCode 
                  ? '用户注册时需要输入有效的邀请码' 
                  : '用户可以直接注册，无需邀请码'
                }
              </p>
            </div>
            <button
              onClick={toggleRequireInviteCode}
              disabled={updatingSettings}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                requireInviteCode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              } ${updatingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  requireInviteCode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 创建邀请码按钮 */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!requireInviteCode}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              requireInviteCode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {showForm ? '取消创建' : '创建邀请码'}
          </button>
          {!requireInviteCode && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              请先启用邀请码功能
            </p>
          )}
        </div>

        {/* 创建表单 */}
        {showForm && requireInviteCode && (
          <div className="mb-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">创建新邀请码</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邀请码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入自定义邀请码或点击右侧按钮生成"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                    title="生成随机邀请码"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  邀请码必须唯一，建议使用字母和数字组合
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  描述（可选）
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="邀请码用途说明"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  最大使用次数
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  过期时间（可选）
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  立即启用
                </label>
              </div>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={createInviteCode}
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {creating ? '创建中...' : '创建邀请码'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 邀请码列表 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">邀请码列表</h3>
          </div>
          
          {inviteCodes.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              暂无邀请码
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      邀请码
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      使用情况
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      过期时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      创建者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {inviteCodes.map((inviteCode) => (
                    <tr key={inviteCode.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {inviteCode.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {inviteCode.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {inviteCode.usedCount} / {inviteCode.maxUses}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inviteCode)}`}>
                          {getStatusText(inviteCode)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {inviteCode.expiresAt 
                          ? new Date(inviteCode.expiresAt).toLocaleString()
                          : '永不过期'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {inviteCode.creator.name || inviteCode.creator.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleInviteCode(inviteCode.id, inviteCode.isActive)}
                          className={`${
                            inviteCode.isActive 
                              ? 'text-yellow-600 hover:text-yellow-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {inviteCode.isActive ? '禁用' : '启用'}
                        </button>
                        <button
                          onClick={() => deleteInviteCode(inviteCode.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}