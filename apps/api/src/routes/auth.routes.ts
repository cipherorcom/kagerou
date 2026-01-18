import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { rateLimiter } from '../utils/redis';
import { config } from '../config';
import { requireAuth } from '../middleware/admin.middleware';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService();

  // 注册限流中间件
  const registerRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
    const key = `rate_limit:register:${request.ip}`;
    const allowed = await rateLimiter.check(key, 5, 3600); // 每小时最多 5 次
    
    if (!allowed) {
      const remaining = await rateLimiter.remaining(key, 5);
      reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Registration rate limit exceeded. Try again later.',
        remaining,
      });
      return;
    }
  };

  const loginRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
    const key = `rate_limit:login:${request.ip}`;
    const allowed = await rateLimiter.check(key, 10, 300); // 5 分钟最多 10 次
    
    if (!allowed) {
      const remaining = await rateLimiter.remaining(key, 10);
      reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Login rate limit exceeded. Try again later.',
        remaining,
      });
      return;
    }
  };

  app.post('/register', {
    onRequest: [registerRateLimit],
  }, async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      const user = await authService.register(body.email, body.password, body.name);
      
      const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
      
      return { user, token };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.post('/login', {
    onRequest: [loginRateLimit],
  }, async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const user = await authService.login(body.email, body.password);
      
      const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
      
      return { user, token };
    } catch (error: any) {
      reply.code(401).send({ error: error.message });
    }
  });

  app.get('/me', {
    onRequest: [requireAuth],
  }, async (request) => {
    const authService = new AuthService();
    const user = await authService.getUserById((request as any).user.id);
    return { user };
  });

  // 创建第一个管理员账号（仅在没有管理员时可用）
  app.post('/create-admin', async (request, reply) => {
    try {
      const body = createAdminSchema.parse(request.body);
      const user = await authService.createFirstAdmin(body.email, body.password, body.name);
      
      const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
      
      return { user, token };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });
}
