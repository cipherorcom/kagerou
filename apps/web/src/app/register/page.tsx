'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import Link from 'next/link'

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱'),
  password: z.string().min(6, '密码至少 6 位'),
  name: z.string().optional(),
  inviteCode: z.string().optional(),
})

type RegisterForm = z.infer<typeof registerSchema>

interface RegistrationSettings {
  allowRegistration: boolean
  requireInviteCode: boolean
  isFirstUser: boolean
}

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settings, setSettings] = useState<RegistrationSettings>({
    allowRegistration: true,
    requireInviteCode: false,
    isFirstUser: false
  })
  const [isFirstUser, setIsFirstUser] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  useEffect(() => {
    loadRegistrationSettings()
  }, [])

  const loadRegistrationSettings = async () => {
    try {
      const response = await authApi.getRegistrationSettings()
      setSettings(response.data)
      
      // 如果是第一个用户，允许注册（忽略系统设置）
      if (response.data.isFirstUser) {
        return
      }
      
      // 如果不允许注册，重定向到登录页面
      if (!response.data.allowRegistration) {
        router.push('/login')
        return
      }
    } catch (err) {
      console.error('Failed to load registration settings:', err)
    } finally {
      setSettingsLoading(false)
    }
  }

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await authApi.register(data)
      const { user, token } = response.data
      setAuth(user, token)
      
      // 根据用户角色跳转
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-900 dark:text-white">加载中...</div>
      </div>
    )
  }

  if (!settings.allowRegistration && !settings.isFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          
          <div className="text-center">
            <div className="mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              注册已关闭
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              系统管理员已关闭用户注册功能
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                返回登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div>
          <div className="text-center mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {settings.isFirstUser ? '创建管理员账号' : '注册新账号'}
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                邮箱地址
              </label>
              <input
                {...register('email')}
                type="email"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                姓名（可选）
              </label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="张三"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                密码
              </label>
              <input
                {...register('password')}
                type="password"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="至少 6 位"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {settings.requireInviteCode && !settings.isFirstUser && (
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  邀请码 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('inviteCode', { 
                    required: (settings.requireInviteCode && !settings.isFirstUser) ? '请输入邀请码' : false 
                  })}
                  type="text"
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="请输入邀请码"
                />
                {errors.inviteCode && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.inviteCode.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  需要有效的邀请码才能注册账号
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (settings.isFirstUser ? '创建管理员中...' : '注册中...') : (settings.isFirstUser ? '创建管理员' : '注册')}
            </button>
          </div>

          {/* 登录跳转链接 */}
          {!settings.isFirstUser && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                已有账号？
                <Link
                  href="/login"
                  className="ml-1 font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  立即登录
                </Link>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
