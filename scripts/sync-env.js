#!/usr/bin/env node

/**
 * 同步根目录的 .env 到 packages/database/.env
 * 这样 Prisma 就能找到 DATABASE_URL 环境变量
 */

const fs = require('fs');
const path = require('path');

const rootEnvPath = path.join(__dirname, '../.env');
const dbEnvPath = path.join(__dirname, '../packages/database/.env');

try {
  // 检查根目录 .env 是否存在
  if (!fs.existsSync(rootEnvPath)) {
    console.error('❌ 根目录 .env 文件不存在，请先创建：');
    console.error('   cp .env.example .env');
    process.exit(1);
  }

  // 读取根目录 .env
  const envContent = fs.readFileSync(rootEnvPath, 'utf-8');
  
  // 提取 DATABASE_URL
  const databaseUrlMatch = envContent.match(/^DATABASE_URL=.+$/m);
  
  if (!databaseUrlMatch) {
    console.error('❌ .env 文件中未找到 DATABASE_URL');
    process.exit(1);
  }

  // 写入到 packages/database/.env
  const dbEnvContent = `# 这个文件由根目录的 .env 自动生成
# 请不要手动编辑，修改根目录的 .env 文件即可
${databaseUrlMatch[0]}
`;

  fs.writeFileSync(dbEnvPath, dbEnvContent);
  console.log('✅ 已同步 DATABASE_URL 到 packages/database/.env');
  
} catch (error) {
  console.error('❌ 同步环境变量失败:', error.message);
  process.exit(1);
}
