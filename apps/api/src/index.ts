import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { domainRoutes } from './routes/domain.routes';
import { providerRoutes } from './routes/provider.routes';
import { adminRoutes } from './routes/admin.routes';

const app = Fastify({
  logger: true,
});

async function start() {
  try {
    // CORS
    await app.register(cors, {
      origin: true,
    });

    // 路由
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(domainRoutes, { prefix: '/api' });
    await app.register(providerRoutes, { prefix: '/api' });
    await app.register(adminRoutes, { prefix: '/api' });

    // 健康检查
    app.get('/health', async () => {
      return { 
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    });

    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await app.close();
  process.exit(0);
});

start();
