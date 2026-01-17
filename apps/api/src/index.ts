import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { authPlugin } from './plugins/auth.plugin';
import { rateLimitPlugin } from './plugins/rate-limit.plugin';
import { authRoutes } from './routes/auth.routes';
import { domainRoutes } from './routes/domain.routes';
import { dnsAccountRoutes } from './routes/dns-account.routes';
import { providerRoutes } from './routes/provider.routes';
import { redis } from './utils/redis';

const app = Fastify({
  logger: true,
});

async function start() {
  try {
    // CORS
    await app.register(cors, {
      origin: true,
    });

    // 插件
    await app.register(authPlugin);
    await app.register(rateLimitPlugin);

    // 路由
    app.register(authRoutes, { prefix: '/api/auth' });
    app.register(domainRoutes, { prefix: '/api' });
    app.register(dnsAccountRoutes, { prefix: '/api' });
    app.register(providerRoutes, { prefix: '/api' });

    // 健康检查
    app.get('/health', async () => {
      const redisStatus = redis.status === 'ready' ? 'ok' : 'error';
      return { 
        status: 'ok',
        redis: redisStatus,
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
  await redis.quit();
  await app.close();
  process.exit(0);
});

start();
