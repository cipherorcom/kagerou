import { prisma } from '@kagerou/database';
import { DNSProviderFactory } from '@kagerou/dns-providers';
import { decrypt } from '../utils/crypto';

export class DNSService {
  // 获取用户可用的域名列表
  async getAvailableDomains() {
    return prisma.availableDomain.findMany({
      where: { isActive: true },
      include: {
        dnsAccount: {
          include: {
            provider: {
              select: { name: true, displayName: true }
            }
          }
        }
      },
      orderBy: { domain: 'asc' }
    });
  }

  async createDomain(userId: string, availableDomainId: string, subdomain: string, recordType: string, value: string, ttl?: number, proxied?: boolean) {
    const availableDomain = await prisma.availableDomain.findFirst({
      where: { id: availableDomainId, isActive: true },
      include: { 
        dnsAccount: { 
          include: { provider: true } 
        } 
      },
    });

    if (!availableDomain) {
      throw new Error('Available domain not found');
    }

    // 检查子域名是否被禁用
    const blockedSubdomain = await prisma.blockedSubdomain.findFirst({
      where: { 
        subdomain: subdomain.toLowerCase(),
        isActive: true 
      }
    });

    if (blockedSubdomain) {
      throw new Error(`子域名 "${subdomain}" 已被管理员禁用${blockedSubdomain.reason ? ': ' + blockedSubdomain.reason : ''}`);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const domainCount = await prisma.domain.count({ where: { userId } });

    if (domainCount >= user!.quota) {
      throw new Error('Domain quota exceeded');
    }

    const existing = await prisma.domain.findFirst({
      where: { subdomain, availableDomainId },
    });

    if (existing) {
      throw new Error('Subdomain already exists');
    }

    // 获取系统设置：默认域名状态
    const defaultStatusSetting = await prisma.systemSetting.findUnique({
      where: { key: 'default_domain_status' }
    });
    const defaultStatus = defaultStatusSetting?.value || 'active';

    // 构建完整域名
    const fullDomain = `${subdomain}.${availableDomain.domain}`;

    let providerRecordId: string | null = null;
    let finalStatus = defaultStatus;

    // 只有状态为 'active' 时才调用 DNS API
    if (defaultStatus === 'active') {
      try {
        const credentials = JSON.parse(decrypt(availableDomain.dnsAccount.credentials));
        const provider = DNSProviderFactory.create({
          type: availableDomain.dnsAccount.provider.name,
          credentials,
        });

        const dnsRecord = await provider.createRecord(availableDomain.domain, {
          name: fullDomain,
          type: recordType as any,
          value,
          ttl: ttl || 300,
          proxied: proxied || false,
        });

        providerRecordId = dnsRecord.id || null;
      } catch (error: any) {
        // DNS API 调用失败，将状态设置为 rejected
        finalStatus = 'rejected';
        console.error('Failed to create DNS record:', error);
      }
    }

    // 创建数据库记录
    const domain = await prisma.domain.create({
      data: {
        userId,
        dnsAccountId: availableDomain.dnsAccountId,
        availableDomainId,
        subdomain,
        recordType,
        value,
        ttl: ttl || 300,
        proxied: proxied || false,
        providerRecordId,
        status: finalStatus,
      },
      include: {
        availableDomain: true,
        dnsAccount: {
          include: { provider: true }
        }
      }
    });

    return domain;
  }

  async updateDomain(userId: string, domainId: string, data: { value?: string; proxied?: boolean }) {
    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId },
      include: { 
        dnsAccount: { include: { provider: true } },
        availableDomain: true
      },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    const credentials = JSON.parse(decrypt(domain.dnsAccount.credentials));
    const provider = DNSProviderFactory.create({
      type: domain.dnsAccount.provider.name,
      credentials,
    });

    const fullDomain = `${domain.subdomain}.${domain.availableDomain.domain}`;

    try {
      await provider.updateRecord(domain.availableDomain.domain, domain.providerRecordId!, {
        name: fullDomain,
        type: domain.recordType as any,
        value: data.value || domain.value,
        ttl: 300, // 固定使用300秒
        proxied: data.proxied !== undefined ? data.proxied : domain.proxied,
      });

      const updated = await prisma.domain.update({
        where: { id: domainId },
        data: { 
          value: data.value || domain.value, 
          ttl: 300, // 固定使用300秒
          proxied: data.proxied !== undefined ? data.proxied : domain.proxied,
        },
        include: {
          availableDomain: true,
          dnsAccount: {
            include: { provider: true }
          }
        }
      });

      return updated;
    } catch (error: any) {
      throw new Error(`Failed to update DNS record: ${error.message}`);
    }
  }

  async deleteDomain(userId: string, domainId: string) {
    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId },
      include: { 
        dnsAccount: { include: { provider: true } },
        availableDomain: true
      },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    const credentials = JSON.parse(decrypt(domain.dnsAccount.credentials));
    const provider = DNSProviderFactory.create({
      type: domain.dnsAccount.provider.name,
      credentials,
    });

    try {
      if (domain.providerRecordId) {
        await provider.deleteRecord(domain.availableDomain.domain, domain.providerRecordId);
      }

      // 真正删除记录而不是软删除
      await prisma.domain.delete({
        where: { id: domainId },
      });
    } catch (error: any) {
      throw new Error(`Failed to delete DNS record: ${error.message}`);
    }
  }

  async listDomains(userId: string) {
    return prisma.domain.findMany({
      where: { userId },
      include: { 
        dnsAccount: { include: { provider: true } },
        availableDomain: true
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
