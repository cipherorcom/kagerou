import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { rateLimiter, getRateLimitConfig } from '../utils/memory-limiter';
import { config } from '../config';
import { requireAuth } from '../middleware/admin.middleware';
import { prisma } from '@kagerou/database';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  inviteCode: z.string().optional(),
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
    const config = await getRateLimitConfig();
    const allowed = await rateLimiter.check(key, config.registerLimit, 3600); // 每小时限制
    
    if (!allowed) {
      const remaining = await rateLimiter.remaining(key, config.registerLimit);
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
    const config = await getRateLimitConfig();
    const allowed = await rateLimiter.check(key, config.loginLimit, 3600); // 每小时限制
    
    if (!allowed) {
      const remaining = await rateLimiter.remaining(key, config.loginLimit);
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
      const user = await authService.register(body.email, body.password, body.name, 'user', body.inviteCode);
      
      const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
      
      return { user, token };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // 获取注册设置
  app.get('/registration-settings', async (request, reply) => {
    try {
      const [allowRegistration, requireInviteCode, userCount] = await Promise.all([
        prisma.systemSetting.findUnique({ where: { key: 'allow_registration' } }),
        prisma.systemSetting.findUnique({ where: { key: 'require_invite_code' } }),
        prisma.user.count()
      ]);

      return {
        allowRegistration: allowRegistration?.value === 'true',
        requireInviteCode: requireInviteCode?.value === 'true',
        isFirstUser: userCount === 0
      };
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
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

  // 更新个人信息
  app.put('/profile', {
    onRequest: [requireAuth],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const authService = new AuthService();
      const { name, email, password } = request.body as {
        name?: string;
        email?: string;
        password?: string;
      };
      
      const user = await authService.updateProfile((request as any).user.id, { name, email, password });
      return { user };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
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
