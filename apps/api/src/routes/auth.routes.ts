import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService();

  app.post('/register', {
    onRequest: [app.rateLimit({ max: 5, window: 3600 })], // 每小时最多 5 次注册
  }, async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      const user = await authService.register(body.email, body.password, body.name);
      
      const token = app.jwt.sign({ userId: user.id });
      
      return { user, token };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.post('/login', {
    onRequest: [app.rateLimit({ max: 10, window: 300 })], // 5 分钟最多 10 次登录
  }, async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const user = await authService.login(body.email, body.password);
      
      const token = app.jwt.sign({ userId: user.id });
      
      return { user, token };
    } catch (error: any) {
      reply.code(401).send({ error: error.message });
    }
  });

  app.get('/me', {
    onRequest: [app.authenticate],
  }, async (request) => {
    const authService = new AuthService();
    const user = await authService.getUserById(request.user.userId);
    return { user };
  });
}
