'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import Link from 'next/link'

export default function CreateAdminPage() {
  const router = useRouter()

  useEffect(() => {
    // 重定向到注册页面，因为第一个用户会自动成为管理员
    router.push('/register')
  }, [router])

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
            正在跳转...
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            第一个注册的用户将自动成为管理员
          </p>
          <div className="mt-6">
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              前往注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}