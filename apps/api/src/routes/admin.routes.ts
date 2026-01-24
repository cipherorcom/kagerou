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

  // 创建用户
  app.post('/admin/users', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' },
          role: { type: 'string', enum: ['user', 'admin'] },
          quota: { type: 'number', minimum: 0, maximum: 1000 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password, name, role, quota } = request.body as {
        email: string;
        password: string;
        name?: string;
        role?: 'user' | 'admin';
        quota?: number;
      };
      
      const user = await adminService.createUser(email, password, name, role, quota);
      return { user };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // 更新用户信息
  app.put('/admin/users/:id', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['user', 'admin'] },
          quota: { type: 'number', minimum: 0, maximum: 1000 },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as {
        email?: string;
        name?: string;
        role?: 'user' | 'admin';
        quota?: number;
        isActive?: boolean;
      };
      
      const user = await adminService.updateUser(id, updateData);
      return { user };
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // 删除用户
  app.delete('/admin/users/:id', {
    onRequest: [requireAdmin],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await adminService.deleteUser(id);
      return result;
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // 重置用户密码
  app.patch('/admin/users/:id/reset-password', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { password } = request.body as { password: string };
      
      const user = await adminService.resetUserPassword(id, password);
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

  // 禁用子域名管理
  app.get('/admin/blocked-subdomains', {
    onRequest: [requireAdmin],
  }, async () => {
    const blockedSubdomains = await adminService.getBlockedSubdomains();
    return { blockedSubdomains };
  });

  app.post('/admin/blocked-subdomains', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['subdomain'],
        properties: {
          subdomain: { type: 'string' },
          reason: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { subdomain, reason } = request.body as any;
    const blockedSubdomain = await adminService.createBlockedSubdomain(subdomain, reason);
    return { blockedSubdomain };
  });

  app.put('/admin/blocked-subdomains/:id', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params as any;
    const { reason } = request.body as any;
    const blockedSubdomain = await adminService.updateBlockedSubdomain(id, { reason });
    return { blockedSubdomain };
  });

  app.delete('/admin/blocked-subdomains/:id', {
    onRequest: [requireAdmin],
  }, async (request) => {
    const { id } = request.params as any;
    await adminService.deleteBlockedSubdomain(id);
    return { success: true };
  });

  // 管理员域名管理
  app.patch('/admin/domains/:id/status', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['active', 'pending', 'rejected'] }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params as any;
    const { status } = request.body as any;
    const domain = await adminService.updateDomainStatus(id, status);
    return { domain };
  });

  app.patch('/admin/domains/:id/value', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['value'],
        properties: {
          value: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params as any;
    const { value } = request.body as any;
    const domain = await adminService.updateDomainValue(id, value);
    return { domain };
  });

  app.delete('/admin/domains/:id', {
    onRequest: [requireAdmin],
  }, async (request) => {
    const { id } = request.params as any;
    await adminService.deleteDomainAsAdmin(id);
    return { success: true };
  });

  // 系统设置管理
  app.get('/admin/settings', {
    onRequest: [requireAdmin],
  }, async () => {
    const settings = await adminService.getSystemSettings();
    return { settings };
  });

  app.put('/admin/settings/:key', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['value'],
        properties: {
          value: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { key } = request.params as any;
    const { value } = request.body as any;
    const setting = await adminService.updateSystemSetting(key, value);
    return { setting };
  });

  // 邀请码管理
  app.get('/admin/invite-codes', {
    onRequest: [requireAdmin]
  }, async () => {
    const inviteCodes = await adminService.getInviteCodes();
    return { inviteCodes };
  });

  app.post('/admin/invite-codes', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['maxUses', 'isActive'],
        properties: {
          code: { type: 'string' },
          description: { type: 'string' },
          maxUses: { type: 'number', minimum: 1 },
          expiresAt: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request) => {
    const user = (request as any).user;
    const data = request.body as {
      code?: string;
      description?: string;
      maxUses: number;
      expiresAt?: string;
      isActive: boolean;
    };
    
    const inviteCode = await adminService.createInviteCode(user.id, data);
    return { inviteCode };
  });

  app.put('/admin/invite-codes/:id', {
    onRequest: [requireAdmin],
    schema: {
      body: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          maxUses: { type: 'number', minimum: 1 },
          expiresAt: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as {
      description?: string;
      maxUses?: number;
      expiresAt?: string;
      isActive?: boolean;
    };
    
    const inviteCode = await adminService.updateInviteCode(id, data);
    return { inviteCode };
  });

  app.delete('/admin/invite-codes/:id', {
    onRequest: [requireAdmin]
  }, async (request) => {
    const { id } = request.params as { id: string };
    await adminService.deleteInviteCode(id);
    return { success: true };
  });
}