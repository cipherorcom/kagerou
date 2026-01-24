#!/usr/bin/env node

/**
 * 数据库初始化脚本 - 创建数据库结构并初始化基础数据
 * 使用根目录的 node_modules，不需要 scripts 自己的依赖
 */

const path = require('path');
const fs = require('fs');

// 加载根目录的 .env 文件
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 查找 Prisma Client 的路径
function findPrismaClient() {
  const possiblePaths = [
    // packages/database 生成的 client
    path.resolve(__dirname, '../packages/database/node_modules/.prisma/client'),
    path.resolve(__dirname, '../packages/database/node_modules/@prisma/client'),
    // 根目录的 node_modules（如果有的话）
    path.resolve(__dirname, '../node_modules/.prisma/client'),
    path.resolve(__dirname, '../node_modules/@prisma/client'),
  ];

  for (const clientPath of possiblePaths) {
    if (fs.existsSync(clientPath)) {
      try {
        const { PrismaClient } = require(clientPath);
        console.log('✅ 找到 Prisma Client:', clientPath);
        return PrismaClient;
      } catch (e) {
        // 继续尝试下一个路径
      }
    }
  }

  console.error('❌ 找不到 Prisma Client！');
  console.error('请先运行: npx prisma generate');
  console.error('\n尝试过的路径:');
  possiblePaths.forEach(p => console.error('  -', p));
  process.exit(1);
}

const PrismaClient = findPrismaClient();
const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 开始初始化数据库基础数据...\n');

  // 初始化 DNS Providers
  const cloudflare = await prisma.dNSProvider.upsert({
    where: { name: 'cloudflare' },
    update: {},
    create: {
      name: 'cloudflare',
      displayName: 'Cloudflare',
      isActive: true,
      configSchema: {
        type: 'object',
        required: ['apiToken'],
        properties: {
          apiToken: {
            type: 'string',
            description: 'Cloudflare API Token',
          },
        },
      },
    },
  });

  const aliyun = await prisma.dNSProvider.upsert({
    where: { name: 'aliyun' },
    update: {},
    create: {
      name: 'aliyun',
      displayName: '阿里云 DNS',
      isActive: true,
      configSchema: {
        type: 'object',
        required: ['accessKeyId', 'accessKeySecret'],
        properties: {
          accessKeyId: {
            type: 'string',
            description: 'Access Key ID',
          },
          accessKeySecret: {
            type: 'string',
            description: 'Access Key Secret',
          },
        },
      },
    },
  });

  console.log('✅ DNS Provider 数据初始化成功！');
  console.log('   📌 Cloudflare:', cloudflare.displayName);
  console.log('   📌 阿里云 DNS:', aliyun.displayName);

  // 初始化系统设置
  const systemSettings = [
    {
      key: 'default_domain_status',
      value: 'active',
      description: '新创建域名的默认状态：active(正常，直接添加DNS记录), pending(待处理，仅保存到数据库)'
    },
    {
      key: 'default_user_quota',
      value: '10',
      description: '新用户默认域名配额'
    },
    {
      key: 'allow_registration',
      value: 'true',
      description: '是否允许用户注册：true(允许), false(禁止)'
    },
    {
      key: 'require_invite_code',
      value: 'false',
      description: '是否需要邀请码注册：true(需要), false(不需要)'
    },
    {
      key: 'login_rate_limit',
      value: '10',
      description: '登录限流：每小时最大尝试次数'
    },
    {
      key: 'register_rate_limit',
      value: '5',
      description: '注册限流：每小时最大尝试次数'
    }
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ 系统设置初始化成功！');

  // 初始化禁用子域名
  const blockedSubdomains = [
    { subdomain: 'admin', reason: '系统管理保留域名' },
    { subdomain: 'api', reason: 'API接口保留域名' },
    { subdomain: 'www', reason: '主站保留域名' },
    { subdomain: 'mail', reason: '邮件服务保留域名' },
    { subdomain: 'ftp', reason: 'FTP服务保留域名' },
    { subdomain: 'root', reason: '系统保留域名' },
    { subdomain: 'test', reason: '测试保留域名' },
    { subdomain: 'support', reason: '客服支持保留域名' },
    { subdomain: 'help', reason: '帮助页面保留域名' },
    { subdomain: 'blog', reason: '博客保留域名' }
  ];

  for (const blocked of blockedSubdomains) {
    await prisma.blockedSubdomain.upsert({
      where: { subdomain: blocked.subdomain },
      update: {},
      create: {
        subdomain: blocked.subdomain,
        reason: blocked.reason,
        isActive: true,
      },
    });
  }

  console.log('✅ 禁用子域名初始化成功！');
  console.log('\n🎉 数据库基础数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('\n❌ 初始化失败:', e.message);
    if (e.code === 'P2002') {
      console.error('提示: 基础数据已存在，这是正常的。');
    } else {
      console.error('错误详情:', e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
