/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 从根目录加载环境变量
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // 启用 standalone 输出用于 Docker
  output: 'standalone',
}

module.exports = nextConfig
