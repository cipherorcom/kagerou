import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DNSAccountService } from '../services/dns-account.service';

const createAccountSchema = z.object({
  providerId: z.string(),
  credentials: z.record(z.string()),
  isDefault: z.boolean().optional(),
});

export async function dnsAccountRoutes(app: FastifyInstance) {
  const accountService = new DNSAccountService();

  app.post('/dns-accounts', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    try {
      const body = createAccountSchema.parse(request.body);
      const account = await accountService.createAccount(
        request.user.userId,
        body.providerId,
        body.credentials,
        body.isDefault
      );
      return { account };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.get('/dns-accounts', {
    onRequest: [app.authenticate],
  }, async (request) => {
    const accounts = await accountService.listAccounts(request.user.userId);
    return { accounts };
  });

  app.delete('/dns-accounts/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await accountService.deleteAccount(request.user.userId, id);
      return { success: true };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });
}
