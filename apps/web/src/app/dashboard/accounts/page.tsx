'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dnsAccountApi, api } from '@/lib/api'
import { useForm } from 'react-hook-form'

export default function AccountsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('')

  const { data: accounts } = useQuery({
    queryKey: ['dns-accounts'],
    queryFn: async () => {
      const res = await dnsAccountApi.list()
      return res.data.accounts
    },
  })

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await api.get('/api/providers')
      return res.data.providers
    },
  })

  const createMutation = useMutation({
    mutationFn: dnsAccountApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-accounts'] })
      setShowForm(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: dnsAccountApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-accounts'] })
    },
  })

  const { register, handleSubmit, reset } = useForm()

  const onSubmit = (data: any) => {
    const credentials: any = {}
    
    if (selectedProvider === 'cloudflare') {
      credentials.apiToken = data.apiToken
    } else if (selectedProvider === 'aliyun') {
      credentials.accessKeyId = data.accessKeyId
      credentials.accessKeySecret = data.accessKeySecret
    }

    createMutation.mutate({
      providerId: data.providerId,
      credentials,
      isDefault: data.isDefault,
    })
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">DNS 账号</h1>
          <p className="mt-2 text-sm text-gray-700">
            管理你的 DNS 服务商账号
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            添加账号
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">DNS 服务商</label>
              <select
                {...register('providerId')}
                onChange={(e) => {
                  const provider = providers?.find((p: any) => p.id === e.target.value)
                  setSelectedProvider(provider?.name || '')
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">选择服务商</option>
                {providers?.map((provider: any) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.displayName}
                  </option>
                ))}
              </select>
            </div>

            {selectedProvider === 'cloudflare' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">API Token</label>
                <input
                  {...register('apiToken')}
                  type="password"
                  placeholder="Cloudflare API Token"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}

            {selectedProvider === 'aliyun' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Key ID</label>
                  <input
                    {...register('accessKeyId')}
                    type="text"
                    placeholder="阿里云 Access Key ID"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Key Secret</label>
                  <input
                    {...register('accessKeySecret')}
                    type="password"
                    placeholder="阿里云 Access Key Secret"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </>
            )}

            <div className="flex items-center">
              <input
                {...register('isDefault')}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm text-gray-900">
                设为默认账号
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? '添加中...' : '添加'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts?.map((account: any) => (
            <div key={account.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {account.provider.displayName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {account.isDefault && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          默认
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('确定删除此账号？')) {
                        deleteMutation.mutate(account.id)
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
