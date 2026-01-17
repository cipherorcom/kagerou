import Redis from 'ioredis';
import { config } from '../config';

// 创建 Redis 客户端
export const redis = new Redis(config.redisUrl, {
  password: config.redisPassword,
  db: config.redisDb,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// 常用的缓存方法
export const cacheUtils = {
  // 设置缓存（带过期时间，单位：秒）
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  // 删除缓存
  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  // 批量删除（支持通配符）
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  // 检查键是否存在
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  // 设置过期时间
  async expire(key: string, ttl: number): Promise<void> {
    await redis.expire(key, ttl);
  },
};

// 限流工具
export const rateLimiter = {
  // 简单的计数器限流
  async check(key: string, limit: number, window: number): Promise<boolean> {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, window);
    }
    
    return current <= limit;
  },

  // 获取剩余次数
  async remaining(key: string, limit: number): Promise<number> {
    const current = await redis.get(key);
    const used = current ? parseInt(current, 10) : 0;
    return Math.max(0, limit - used);
  },
};

export default redis;
