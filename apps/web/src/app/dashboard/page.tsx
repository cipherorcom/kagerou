'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainApi } from '@/lib/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const domainSchema = z.object({
  availableDomainId: z.string().min(1, '请选择可用域名'),
  subdomain: z.string().min(1, '请输入子域名'),
  recordType: z.enum(['A', 'AAAA', 'CNAME']),
  value: z.string().min(1, '请输入记录值'),
  proxied: z.boolean().optional(),
})

const updateDomainSchema = z.object({
  value: z.string().min(1, '请输入记录值'),
  proxied: z.boolean().optional(),
})

type DomainForm = z.infer<typeof domainSchema>
type UpdateDomainForm = z.infer<typeof updateDomainSchema>

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDomain, setEditingDomain] = useState<any>(null)

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const res = await domainApi.list()
      return res.data.domains
    },
  })

  const { data: availableDomains } = useQuery({
    queryKey: ['available-domains'],
    queryFn: async () => {
      const res = await domainApi.getAvailableDomains()
      return res.data.domains
    },
  })

  const createMutation = useMutation({
    mutationFn: domainApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      setShowForm(false)
      reset()
      setError('')
    },
    onError: (error: any) => {
      console.error('创建域名失败:', error)
      // 优先显示API返回的具体错误信息
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          '创建域名失败，请重试'
      setError(errorMessage)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDomainForm }) => domainApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      setEditingDomain(null)
      resetUpdate()
      setError('')
    },
    onError: (error: any) => {
      console.error('更新域名失败:', error)
      // 优先显示API返回的具体错误信息
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          '更新域名失败，请重试'
      setError(errorMessage)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: domainApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      setError('')
    },
    onError: (error: any) => {
      console.error('删除域名失败:', error)
      // 优先显示API返回的具体错误信息
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          '删除域名失败，请重试'
      setError(errorMessage)
    },
  })

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<DomainForm>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      recordType: 'A',
      proxied: false,
    },
  })

  const { register: registerUpdate, handleSubmit: handleSubmitUpdate, formState: { errors: errorsUpdate }, reset: resetUpdate } = useForm<UpdateDomainForm>({
    resolver: zodResolver(updateDomainSchema),
  })

  const selectedDomainId = watch('availableDomainId')
  const selectedDomain = availableDomains?.find((d: any) => d.id === selectedDomainId)
  const subdomainValue = watch('subdomain')

  const onSubmit = (data: DomainForm) => {
    createMutation.mutate(data)
  }

  const onUpdateSubmit = (data: UpdateDomainForm) => {
    if (editingDomain) {
      updateMutation.mutate({ id: editingDomain.id, data })
    }
  }

  const startEdit = (domain: any) => {
    setEditingDomain(domain)
    resetUpdate({
      value: domain.value,
      proxied: domain.proxied || false,
    })
  }

  const cancelEdit = () => {
    setEditingDomain(null)
    resetUpdate()
  }

  const getRecordTypeDescription = (type: string) => {
    const descriptions = {
      A: 'IPv4 地址记录',
      AAAA: 'IPv6 地址记录',
      CNAME: '别名记录'
    }
    return descriptions[type as keyof typeof descriptions] || type
  }

  const getRecordTypePlaceholder = (type: string) => {
    const placeholders = {
      A: '192.168.1.1',
      AAAA: '2001:db8::1',
      CNAME: 'example.com'
    }
    return placeholders[type as keyof typeof placeholders] || ''
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
    <div className="min-h-screen">
      {/* 我的域名卡片 */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="px-8 py-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    我的域名
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>管理你的所有域名记录，当前已使用 <span className="font-semibold text-blue-600 dark:text-blue-400">{domains?.length || 0}</span> 个域名</span>
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="group relative inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加域名
                </div>
              </button>
            </div>
          </div>

          {/* 添加域名表单 */}
          {showForm && (
            <div className="border-b border-gray-200 dark:border-gray-600">
              <div className="px-8 py-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-700/30 dark:to-gray-600/30">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">添加新域名</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        创建一个新的子域名记录，支持多种记录类型
                      </p>
                    </div>
                  </div>

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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* 域名选择 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        <span>选择可用域名</span>
                      </span>
                    </label>
                    <select
                      {...register('availableDomainId')}
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">请选择一个可用域名</option>
                      {availableDomains?.map((domain: any) => (
                        <option key={domain.id} value={domain.id}>
                          {domain.domain} ({domain.dnsAccount.provider.displayName})
                        </option>
                      ))}
                    </select>
                    {errors.availableDomainId && (
                      <p className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errors.availableDomainId.message}</span>
                      </p>
                    )}
                  </div>

                  {/* 子域名输入 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>子域名</span>
                      </span>
                    </label>
                    <div className="flex items-center rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                      <input
                        {...register('subdomain')}
                        placeholder="www"
                        className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                      />
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 text-gray-600 dark:text-gray-300 font-mono text-sm border-l border-gray-300 dark:border-gray-600">
                        .{selectedDomain?.domain || 'example.com'}
                      </div>
                    </div>
                    {subdomainValue && selectedDomain && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>完整域名: <span className="font-semibold font-mono">{subdomainValue}.{selectedDomain.domain}</span></span>
                        </p>
                      </div>
                    )}
                    {errors.subdomain && (
                      <p className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errors.subdomain.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 记录类型 */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>记录类型</span>
                        </span>
                      </label>
                      <select
                        {...register('recordType')}
                        className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="A">A - IPv4 地址记录</option>
                        <option value="AAAA">AAAA - IPv6 地址记录</option>
                        <option value="CNAME">CNAME - 别名记录</option>
                      </select>
                    </div>

                    {/* TTL */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>TTL (生存时间)</span>
                        </span>
                      </label>
                      <div className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-xl shadow-sm cursor-not-allowed">
                        自动 (300秒)
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>系统将自动设置最优的 TTL 值</span>
                      </p>
                    </div>
                  </div>

                  {/* 记录值 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>记录值</span>
                      </span>
                    </label>
                    <input
                      {...register('value')}
                      placeholder={getRecordTypePlaceholder(watch('recordType'))}
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{getRecordTypeDescription(watch('recordType'))}</span>
                    </p>
                    {errors.value && (
                      <p className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errors.value.message}</span>
                      </p>
                    )}
                  </div>

                  {/* 代理选项 - 仅对 A、AAAA、CNAME 记录显示 */}
                  {['A', 'AAAA', 'CNAME'].includes(watch('recordType')) && (
                    <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 shadow-lg">
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center h-5">
                          <input
                            {...register('proxied')}
                            type="checkbox"
                            id="proxied"
                            className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded transition-colors"
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="proxied" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>启用 Cloudflare 代理</span>
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-start space-x-2">
                            <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>启用后将通过 Cloudflare 代理流量，提供 DDoS 防护、缓存、SSL 等功能</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 按钮 */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        reset()
                      }}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {createMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          创建中...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          创建域名
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 域名列表或空状态 */}
          {domains && domains.length > 0 ? (
            <>
              {/* 错误提示 */}
              {error && (
                <div className="mx-8 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
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

              {/* 域名列表内容 */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {domains.map((domain: any) => (
                  <div key={domain.id} className="p-8 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                              {domain.subdomain}.{domain.availableDomain.domain}
                            </h4>
                            <div className="flex items-center flex-wrap gap-3 mb-3">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 shadow-sm">
                                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {domain.recordType}
                              </span>
                              {domain.proxied && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 text-orange-800 dark:text-orange-200 shadow-sm">
                                  <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                  代理
                                </span>
                              )}
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-800 dark:text-blue-200 shadow-sm">
                                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                {domain.dnsAccount.provider.displayName}
                              </span>
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                                domain.status === 'active' 
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200' 
                                  : domain.status === 'pending'
                                  ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 text-yellow-800 dark:text-yellow-200'
                                  : 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 text-red-800 dark:text-red-200'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-1.5 ${
                                  domain.status === 'active' ? 'bg-green-500' : domain.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                {domain.status === 'active' ? '正常' : domain.status === 'pending' ? '待处理' : '拒绝'}
                              </span>
                              {domain.status !== 'active' && (
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  {domain.status === 'pending' ? '等待管理员审核，暂时无法编辑' : '域名已被拒绝，无法编辑'}
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">记录值:</span>
                                <span className="ml-2 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">{domain.value}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
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
                                  创建时间: {new Date(domain.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-6">
                        {domain.status === 'active' && (
                          <button
                            onClick={() => startEdit(domain)}
                            className="group relative inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-xl text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            编辑
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`确定要删除域名 ${domain.subdomain}.${domain.availableDomain.domain} 吗？此操作不可恢复。`)) {
                              deleteMutation.mutate(domain.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="group relative inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-xl text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          {deleteMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                          删除
                        </button>
                      </div>
                    </div>
                    
                    {/* 编辑表单 */}
                    {editingDomain?.id === domain.id && domain.status === 'active' && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                            编辑域名: {domain.subdomain}.{domain.availableDomain.domain}
                          </h5>
                        </div>
                        
                        <form onSubmit={handleSubmitUpdate(onUpdateSubmit)} className="space-y-4">
                          {/* 记录值 */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                              记录值
                            </label>
                            <input
                              {...registerUpdate('value')}
                              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                            {errorsUpdate.value && (
                              <p className="text-sm text-red-600 dark:text-red-400">{errorsUpdate.value.message}</p>
                            )}
                          </div>

                          {/* TTL 显示 */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                              TTL (生存时间)
                            </label>
                            <div className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-lg shadow-sm cursor-not-allowed">
                              自动 ({domain.ttl}秒)
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              系统将自动设置最优的 TTL 值
                            </p>
                          </div>

                          {/* 代理选项 - 仅对 A、AAAA、CNAME 记录显示 */}
                          {['A', 'AAAA', 'CNAME'].includes(domain.recordType) && (
                            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                              <div className="flex items-start space-x-3">
                                <div className="flex items-center h-5">
                                  <input
                                    {...registerUpdate('proxied')}
                                    type="checkbox"
                                    id={`proxied-${domain.id}`}
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded transition-colors"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label htmlFor={`proxied-${domain.id}`} className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span>启用 Cloudflare 代理</span>
                                  </label>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    启用后将通过 Cloudflare 代理流量，提供 DDoS 防护、缓存、SSL 等功能
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 按钮 */}
                          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium"
                            >
                              取消
                            </button>
                            <button
                              type="submit"
                              disabled={updateMutation.isPending}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                              {updateMutation.isPending ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  更新中...
                                </div>
                              ) : (
                                '保存更改'
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : !showForm ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                还没有域名记录
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                开始创建你的第一个域名记录吧！支持 A、AAAA、CNAME 记录类型，还可以启用 Cloudflare 代理功能。
              </p>
              
              <button
                onClick={() => setShowForm(true)}
                className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl hover:shadow-3xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加第一个域名
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            </div>
          ) : null}
        </div>
    </div>
  )
}