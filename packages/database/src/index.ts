import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// 加载根目录的 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export * from '@prisma/client';
