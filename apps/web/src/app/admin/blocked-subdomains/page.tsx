'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ThemeToggle } from '@/components/theme-toggle'

const blockedSubdomainSchema = z.object({
  subdomain: z.string().min(1, '请输入子域名').regex(/^[a-zA-Z0-9-]+$/, '子域名只能包含字母、数字和连字符'),
  reason: z.string().optional(),
})

type BlockedSubdomainForm = z.infer<typeof blockedSubdomainSchema>

export default function BlockedSubdomainsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [error, setError] = useState('')

  const { data: blockedSubdomains, isLoading } = useQuery({
    queryKey: ['blocked-subdomains'],
    queryFn: async () => {
      const res = await adminApi.getBlockedSubdomains()
      return res.data.blockedSubdomains
    },
  })

  const createMutation = useMutation({
    mutationFn: adminApi.createBlockedSubdomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-subdomains'] })
      setShowForm(false)
      reset()
      setError('')
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || error.message || '添加失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { reason?: string } }) => 
      adminApi.updateBlockedSubdomain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-subdomains'] })
      setEditingItem(null)
      setError('')
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteBlockedSubdomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-subdomains'] })
      setError('')
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || error.message || '删除失败')
    },
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BlockedSubdomainForm>({
    resolver: zodResolver(blockedSubdomainSchema),
  })

  const onSubmit = (data: BlockedSubdomainForm) => {
    createMutation.mutate(data)
  }

  const startEdit = (item: any) => {
    setEditingItem({ ...item, editReason: item.reason || '' })
  }

  const saveEdit = (id: string, reason: string) => {
    updateMutation.mutate({ id, data: { reason } })
  }

  if (isLoading) {
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">禁用子域名管理</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                管理不允许用户创建的子域名
              </p>
            </div>
            <div className="flex space-x-4">
              <ThemeToggle />
              <button
                onClick={() => window.history.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                返回
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

        {/* 添加按钮 */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {showForm ? '取消' : '添加禁用子域名'}
          </button>
        </div>

        {/* 添加表单 */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">添加禁用子域名</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  子域名
                </label>
                <input
                  {...register('subdomain')}
                  placeholder="例如: admin, api, www"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.subdomain && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subdomain.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  禁用原因（可选）
                </label>
                <input
                  {...register('reason')}
                  placeholder="例如: 系统保留域名"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    reset()
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 禁用子域名列表 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              已禁用的子域名 ({blockedSubdomains?.length || 0})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {blockedSubdomains && blockedSubdomains.length > 0 ? (
              blockedSubdomains.map((item: any) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-medium text-gray-900 dark:text-white">
                          {item.subdomain}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                          已禁用
                        </span>
                      </div>
                      {editingItem?.id === item.id ? (
                        <div className="mt-2 flex items-center space-x-2">
                          <input
                            value={editingItem.editReason}
                            onChange={(e) => setEditingItem({ ...editingItem, editReason: e.target.value })}
                            placeholder="禁用原因"
                            className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm"
                          />
                          <button
                            onClick={() => saveEdit(item.id, editingItem.editReason)}
                            disabled={updateMutation.isPending}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.reason || '无禁用原因'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            创建时间: {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingItem?.id !== item.id && (
                        <button
                          onClick={() => startEdit(item)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                        >
                          编辑
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`确定要删除禁用子域名 "${item.subdomain}" 吗？`)) {
                            deleteMutation.mutate(item.id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">暂无禁用的子域名</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}