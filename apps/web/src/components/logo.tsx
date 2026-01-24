'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  href?: string
  className?: string
}

export function Logo({ 
  size = 'md', 
  showText = true, 
  href = '/', 
  className = '' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }
  
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  const LogoContent = () => (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* 使用实际的 logo 图片文件 */}
      <Image
        src="/logo.png"
        alt="Kagerou Logo"
        width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
        height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
        className={`${sizeClasses[size]} object-contain`}
      />
      
      {showText && (
        <span className={`font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ${textSizeClasses[size]}`}>
          Kagerou
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}