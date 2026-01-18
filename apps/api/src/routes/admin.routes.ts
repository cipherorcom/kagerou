import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AdminService } from '../services/admin.service';
import { requireAdmin } from '../middleware/admin.middleware';

const updateQuotaSchema = z.object({
  quota: z.number().min(0).max(1000),
});

const createProviderSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  configSchema: z.any().default({}),
});

const updateProviderSchema = z.object({
  displayName: z.string().min(1).optional(),
  configSchema: z.any().optional(),
  isActive: z.boolean().optional(),
});

const createDnsAccountSchema = z.object({
  name: z.string().min(1),
  providerId: z.string().min(1),
  credentials: z.any(),
  isDefault: z.boolean().optional(),
});

const updateDnsAccountSchema = z.object({
  name: z.string().min(1).optional(),
  credentials: z.any().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const createAvailableDomainSchema = z.object({
  dnsAccountId: z.string().min(1),
  domain: z.string().min(1),
});

const updateAvailableDomainSchema = z.object({
  isActive: z.boolean().optional(),
});

export async function adminRoutes(app: FastifyInstance) {
  const adminService = new AdminService();

  // 系统统计
  app.get('/admin/stats', {
    onRequest: [requireAdmin],
  }, async () => {
    const stats = await adminService.getSystemStats();
    return { stats };
  });

  // 用户管理
  app.get('/admin/users', {
    onRequest: [requireAdmin],
  }, async (request) => {
    const { page = 1, limit = 20 } = request.query as any;
    const result = await adminService.getAllUsers(Number(page), Number(limit));
    return result;
  });

  app.patch('/admin/users/:id/quota', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateQuotaSchema.parse(request.body);
      const user = await adminService.updateUserQuota(id, body.quota);
      return { user };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.patch('/admin/users/:id/toggle-status', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = await adminService.toggleUserStatus(id);
      return { user };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.patch('/admin/users/:id/promote', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = await adminService.promoteToAdmin(id);
      return { user };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.patch('/admin/users/:id/demote', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = await adminService.demoteFromAdmin(id);
      return { user };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // DNS Provider 管理
  app.get('/admin/providers', {
    onRequest: [requireAdmin],
  }, async () => {
    const providers = await adminService.getAllProviders();
    return { providers };
  });

  app.post('/admin/providers', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const body = createProviderSchema.parse(request.body);
      const provider = await adminService.createProvider(body);
      return { provider };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.patch('/admin/providers/:id', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateProviderSchema.parse(request.body);
      const provider = await adminService.updateProvider(id, body);
      return { provider };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.delete('/admin/providers/:id', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await adminService.deleteProvider(id);
      return { success: true };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // DNS 账号管理
  app.get('/admin/dns-accounts', {
    onRequest: [requireAdmin],
  }, async () => {
    const accounts = await adminService.getAllDnsAccounts();
    return { accounts };
  });

  app.post('/admin/dns-accounts', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const body = createDnsAccountSchema.parse(request.body);
      const account = await adminService.createDnsAccount({
        name: body.name,
        providerId: body.providerId,
        credentials: body.credentials,
        isDefault: body.isDefault
      });
      return { account };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.patch('/admin/dns-accounts/:id', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateDnsAccountSchema.parse(request.body);
      const account = await adminService.updateDnsAccount(id, body);
      return { account };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.delete('/admin/dns-accounts/:id', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await adminService.deleteDnsAccount(id);
      return { success: true };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // 获取DNS账号的域名列表
  app.get('/admin/dns-accounts/:id/domains', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const domains = await adminService.getDnsAccountDomains(id);
      return { domains };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // 可用域名管理
  app.get('/admin/available-domains', {
    onRequest: [requireAdmin],
  }, async () => {
    const domains = await adminService.getAvailableDomains();
    return { domains };
  });

  app.post('/admin/available-domains', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const body = createAvailableDomainSchema.parse(request.body);
      const domain = await adminService.createAvailableDomain(body.dnsAccountId, body.domain);
      return { domain };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.patch('/admin/available-domains/:id', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateAvailableDomainSchema.parse(request.body);
      const domain = await adminService.updateAvailableDomain(id, body);
      return { domain };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  app.delete('/admin/available-domains/:id', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await adminService.deleteAvailableDomain(id);
      return { success: true };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // 域名管理
  app.get('/admin/domains', {
    onRequest: [requireAdmin],
  }, async (request) => {
    const { page = 1, limit = 50, status } = request.query as any;
    const result = await adminService.getAllDomains(Number(page), Number(limit), status);
    return result;
  });

  // API 日志
  app.get('/admin/logs', {
    onRequest: [requireAdmin],
  }, async (request) => {
    const { page = 1, limit = 50, userId } = request.query as any;
    const result = await adminService.getApiLogs(Number(page), Number(limit), userId);
    return result;
  });
}