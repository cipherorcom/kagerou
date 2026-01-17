import { FastifyInstance } from 'fastify';
import { prisma } from '@kagerou/database';

export async function providerRoutes(app: FastifyInstance) {
  app.get('/providers', async () => {
    const providers = await prisma.dNSProvider.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' },
    });
    return { providers };
  });
}
