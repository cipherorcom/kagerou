// 内存限流器，替代Redis
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class MemoryRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每分钟清理一次过期记录
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(key);
      }
    }
  }

  async check(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    const record = this.records.get(key);
    
    if (!record || now > record.resetTime) {
      // 创建新记录或重置过期记录
      this.records.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (record.count >= limit) {
      return false;
    }
    
    record.count++;
    return true;
  }

  async remaining(key: string, limit: number): Promise<number> {
    const record = this.records.get(key);
    if (!record || Date.now() > record.resetTime) {
      return limit;
    }
    return Math.max(0, limit - record.count);
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.records.clear();
  }
}

// 创建全局实例
export const rateLimiter = new MemoryRateLimiter();

// 获取限流配置的辅助函数
export async function getRateLimitConfig(): Promise<{ loginLimit: number; registerLimit: number }> {
  try {
    // 动态导入prisma以避免循环依赖
    const { prisma } = await import('@kagerou/database');
    
    const [loginSetting, registerSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'login_rate_limit' } }),
      prisma.systemSetting.findUnique({ where: { key: 'register_rate_limit' } })
    ]);

    return {
      loginLimit: parseInt(loginSetting?.value || '10'),
      registerLimit: parseInt(registerSetting?.value || '5')
    };
  } catch (error) {
    // 如果获取配置失败，使用默认值
    console.warn('Failed to get rate limit config, using defaults:', error);
    return {
      loginLimit: 10,
      registerLimit: 5
    };
  }
}

// 简单的内存缓存（可选，如果需要的话）
class MemoryCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每5分钟清理一次过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export const cache = new MemoryCache();