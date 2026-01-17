import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rateLimiter } from '../utils/redis';

interface RateLimitOptions {
  max?: number;      // 最大请求次数
  window?: number;   // 时间窗口（秒）
  keyPrefix?: string; // 键前缀
}

export async function rateLimitPlugin(app: FastifyInstance) {
  app.decorate('rateLimit', (options: RateLimitOptions = {}) => {
    const {
      max = 100,
      window = 60,
      keyPrefix = 'rate_limit',
    } = options;

    return async (request: FastifyRequest, reply: FastifyReply) => {
      const ip = request.ip;
      const key = `${keyPrefix}:${ip}`;

      const allowed = await rateLimiter.check(key, max, window);

      if (!allowed) {
        const remaining = await rateLimiter.remaining(key, max);
        reply.code(429).send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again later.`,
          remaining,
        });
        return;
      }

      const remaining = await rateLimiter.remaining(key, max);
      reply.header('X-RateLimit-Limit', max);
      reply.header('X-RateLimit-Remaining', remaining);
    };
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    rateLimit: (options?: RateLimitOptions) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
