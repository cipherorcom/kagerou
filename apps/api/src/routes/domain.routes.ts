import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DNSService } from '../services/dns.service';

const createDomainSchema = z.object({
  dnsAccountId: z.string(),
  subdomain: z.string(),
  recordType: z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'MX']),
  value: z.string(),
  ttl: z.number().optional(),
});

const updateDomainSchema = z.object({
  value: z.string(),
  ttl: z.number().optional(),
});

export async function domainRoutes(app: FastifyInstance) {
  const dnsService = new DNSService();

  app.post('/domains', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    try {
      const body = createDomainSchema.parse(request.body);
      const domain = await dnsService.createDomain(
        request.user.userId,
        body.dnsAccountId,
        body.subdomain,
        body.recordType,
        body.value,
        body.ttl
      );
      return { domain };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.get('/domains', {
    onRequest: [app.authenticate],
  }, async (request) => {
    const domains = await dnsService.listDomains(request.user.userId);
    return { domains };
  });

  app.patch('/domains/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateDomainSchema.parse(request.body);
      const domain = await dnsService.updateDomain(request.user.userId, id, body.value, body.ttl);
      return { domain };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.delete('/domains/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await dnsService.deleteDomain(request.user.userId, id);
      return { success: true };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });
}
