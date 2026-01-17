import dotenv from 'dotenv';
import path from 'path';

// 加载根目录的 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://kagerou:kagerou123@localhost:5432/kagerou',
  redisUrl: process.env.REDIS_URL || 'redis://:redis_password_123@localhost:6379/0',
  redisPassword: process.env.REDIS_PASSWORD || 'redis_password_123',
  redisDb: parseInt(process.env.REDIS_DB || '0', 10),
  encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key-32-chars!!',
  
  // 环境
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
};
