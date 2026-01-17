'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainApi, dnsAccountApi } from '@/lib/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const domainSchema = z.object({
  dnsAccountId: z.string().min(1, '请选择 DNS 账号'),
  subdomain: z.string().min(1, '请输入子域名'),
  recordType: z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'MX']),
  value: z.string().min(1, '请输入记录值'),
  ttl: z.number().optional(),
})

type DomainForm = z.infer<typeof domainSchema>

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingDomain, setEditingDomain] = useState<any>(null)

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const res = await domainApi.list()
      return res.data.domains
    },
  })

  const { data: accounts } = useQuery({
    queryKey: ['dns-accounts'],
    queryFn: async () => {
      const res = await dnsAccountApi.list()
      return res.data.accounts
    },
  })

  const createMutation = useMutation({
    mutationFn: domainApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: domainApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
    },
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<DomainForm>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      recordType: 'A',
      ttl: 300,
    },
  })

  const onSubmit = (data: DomainForm) => {
    createMutation.mutate(data)
  }

  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">域名列表</h1>
          <p className="mt-2 text-sm text-gray-700">
            管理你的所有域名记录
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            添加域名
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">DNS 账号</label>
              <select
                {...register('dnsAccountId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">选择 DNS 账号</option>
                {accounts?.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.provider.displayName}
                  </option>
                ))}
              </select>
              {errors.dnsAccountId && (
                <p className="mt-1 text-sm text-red-600">{errors.dnsAccountId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">子域名</label>
                <input
                  {...register('subdomain')}
                  placeholder="test.example.com"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.subdomain && (
                  <p className="mt-1 text-sm text-red-600">{errors.subdomain.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">记录类型</label>
                <select
                  {...register('recordType')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                  <option value="TXT">TXT</option>
                  <option value="MX">MX</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">记录值</label>
              <input
                {...register('value')}
                placeholder="1.2.3.4"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
              )}
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
                {createMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">子域名</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">类型</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">值</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">DNS 服务商</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">状态</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {domains?.map((domain: any) => (
                    <tr key={domain.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{domain.subdomain}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{domain.recordType}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{domain.value}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {domain.dnsAccount.provider.displayName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          domain.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {domain.status}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            if (confirm('确定删除此域名？')) {
                              deleteMutation.mutate(domain.id)
                            }
                          }}
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
          </div>
        </div>
      </div>
    </div>
  )
}
