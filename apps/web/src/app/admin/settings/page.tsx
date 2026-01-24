'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminApi } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'

interface SystemSetting {
  id: string
  key: string
  value: string
  description?: string
  createdAt: string
  updatedAt: string
}

export default function SystemSettingsPage() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    if (!isAdmin()) {
      router.push('/dashboard')
      return
    }

    loadSettings()
  }, [isAuthenticated, isAdmin, router])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getSettings()
      setSettings(response.data.settings)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: string) => {
    try {
      setSaving(key)
      await adminApi.updateSetting(key, value)
      await loadSettings()
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || '更新设置失败')
    } finally {
      setSaving(null)
    }
  }

  const getSettingDisplayName = (key: string) => {
    const names: Record<string, string> = {
      'default_domain_status': '新域名默认状态',
      'default_user_quota': '新用户默认配额',
      'allow_registration': '允许用户注册',
      'login_rate_limit': '登录限流次数',
      'register_rate_limit': '注册限流次数'
    }
    return names[key] || key
  }

  const renderSettingControl = (setting: SystemSetting) => {
    switch (setting.key) {
      case 'default_domain_status':
        return (
          <select
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            disabled={saving === setting.key}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="active">正常 (直接添加DNS记录)</option>
            <option value="pending">待处理 (仅保存到数据库，需要管理员审核)</option>
          </select>
        )
      
      case 'default_user_quota':
        return (
          <input
            type="number"
            min="1"
            max="1000"
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            disabled={saving === setting.key}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="输入数字，如：10"
          />
        )

      case 'allow_registration':
        return (
          <select
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            disabled={saving === setting.key}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="true">允许注册</option>
            <option value="false">禁止注册</option>
          </select>
        )

      case 'login_rate_limit':
      case 'register_rate_limit':
        return (
          <input
            type="number"
            min="1"
            max="100"
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            disabled={saving === setting.key}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="每小时最大次数"
          />
        )
      
      default:
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            disabled={saving === setting.key}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        )
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
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">系统设置</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                配置系统行为和默认选项
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* 设置列表 */}
        <div className="space-y-6">
          {settings
            .filter(setting => setting.key !== 'require_admin_approval' && setting.key !== 'require_invite_code') // 过滤掉不需要的设置
            .map((setting) => (
            <div key={setting.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {getSettingDisplayName(setting.key)}
                  </h3>
                  {setting.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {setting.description}
                    </p>
                  )}
                  <div className="max-w-md">
                    {renderSettingControl(setting)}
                  </div>
                  {saving === setting.key && (
                    <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      保存中...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {settings.filter(setting => setting.key !== 'require_admin_approval' && setting.key !== 'require_invite_code').length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">暂无系统设置</p>
          </div>
        )}

        {/* 说明信息 */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">设置说明</h4>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>新域名默认状态：</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• <strong>正常</strong>：用户创建域名后立即调用DNS API添加记录，域名直接生效</li>
                <li>• <strong>待处理</strong>：用户创建域名后仅保存到数据库，不调用DNS API，需要管理员审核</li>
              </ul>
            </div>
            <div>
              <strong>新用户默认配额：</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• 设置新注册用户的默认域名配额数量</li>
                <li>• 管理员可以在用户管理页面单独调整每个用户的配额</li>
                <li>• 建议设置合理的初始值，避免资源滥用</li>
              </ul>
            </div>
            <div>
              <strong>用户注册控制：</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• <strong>允许注册</strong>：用户可以自由注册账号</li>
                <li>• <strong>禁止注册</strong>：关闭注册功能，只有管理员可以创建账号</li>
                <li>• 禁止注册时，登录页面不会显示注册链接</li>
              </ul>
            </div>
            <div>
              <strong>API限流设置：</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• <strong>登录限流</strong>：每小时每IP最大登录尝试次数，防止暴力破解</li>
                <li>• <strong>注册限流</strong>：每小时每IP最大注册尝试次数，防止恶意注册</li>
                <li>• 建议设置：登录10次/小时，注册5次/小时</li>
                <li>• 限流基于IP地址，重启服务后计数重置</li>
                <li>• 配置更改后立即生效，无需重启服务</li>
              </ul>
            </div>
            <div>
              <strong>审核流程：</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• 当设置为"待处理"时，用户创建的域名会显示为"待处理"状态</li>
                <li>• 管理员在域名管理页面将状态改为"正常"时，系统会自动调用DNS API添加记录</li>
                <li>• 如果DNS API调用失败，状态会自动设置为"拒绝"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}