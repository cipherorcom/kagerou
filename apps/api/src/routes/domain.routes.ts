import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { DNSService } from '../services/dns.service';
import { requireAuth } from '../middleware/admin.middleware';

const createDomainSchema = z.object({
  availableDomainId: z.string(),
  subdomain: z.string(),
  recordType: z.enum(['A', 'AAAA', 'CNAME']),
  value: z.string(),
  ttl: z.number().optional(),
  proxied: z.boolean().optional(),
});

const updateDomainSchema = z.object({
  value: z.string().optional(),
  proxied: z.boolean().optional(),
});

export async function domainRoutes(app: FastifyInstance) {
  const dnsService = new DNSService();

  // 获取可用域名列表
  app.get('/available-domains', {
    onRequest: [requireAuth],
  }, async () => {
    const domains = await dnsService.getAvailableDomains();
    return { domains };
  });

  app.post('/domains', {
    onRequest: [requireAuth],
  }, async (request, reply) => {
    try {
      const body = createDomainSchema.parse(request.body);
      const domain = await dnsService.createDomain(
        (request as any).user.id,
        body.availableDomainId,
        body.subdomain,
        body.recordType,
        body.value,
        body.ttl,
        body.proxied
      );
      return { domain };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.get('/domains', {
    onRequest: [requireAuth],
  }, async (request) => {
    const domains = await dnsService.listDomains((request as any).user.id);
    return { domains };
  });

  app.patch('/domains/:id', {
    onRequest: [requireAuth],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateDomainSchema.parse(request.body);
      const domain = await dnsService.updateDomain((request as any).user.id, id, body);
      return { domain };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.delete('/domains/:id', {
    onRequest: [requireAuth],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await dnsService.deleteDomain((request as any).user.id, id);
      return { success: true };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });
}
