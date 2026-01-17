#!/usr/bin/env node

/**
 * 数据库初始化脚本 - 初始化 DNS Provider 数据
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
  console.error('请先运行: npm run db:generate');
  console.error('\n尝试过的路径:');
  possiblePaths.forEach(p => console.error('  -', p));
  process.exit(1);
}

const PrismaClient = findPrismaClient();
const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 开始初始化 DNS Provider 数据...\n');

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

  console.log('✅ DNS Provider 数据初始化成功！\n');
  console.log('   📌 Cloudflare');
  console.log('      ID:', cloudflare.id);
  console.log('      名称:', cloudflare.displayName);
  console.log('\n   📌 阿里云 DNS');
  console.log('      ID:', aliyun.id);
  console.log('      名称:', aliyun.displayName);
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n❌ 初始化失败:', e.message);
    if (e.code === 'P2002') {
      console.error('提示: Provider 数据已存在，这是正常的。');
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
