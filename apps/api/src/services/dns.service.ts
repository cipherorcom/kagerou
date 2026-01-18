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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const domainCount = await prisma.domain.count({ where: { userId } });

    if (domainCount >= user!.quota) {
      throw new Error('Domain quota exceeded');
    }

    const credentials = JSON.parse(decrypt(availableDomain.dnsAccount.credentials));
    const provider = DNSProviderFactory.create({
      type: availableDomain.dnsAccount.provider.name,
      credentials,
    });

    const existing = await prisma.domain.findFirst({
      where: { subdomain, availableDomainId },
    });

    if (existing) {
      throw new Error('Subdomain already exists');
    }

    // 构建完整域名
    const fullDomain = `${subdomain}.${availableDomain.domain}`;

    try {
      const dnsRecord = await provider.createRecord(availableDomain.domain, {
        name: fullDomain,
        type: recordType as any,
        value,
        ttl: ttl || 300,
        proxied: proxied || false,
      });

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
          providerRecordId: dnsRecord.id,
          status: 'active',
        },
        include: {
          availableDomain: true,
          dnsAccount: {
            include: { provider: true }
          }
        }
      });

      return domain;
    } catch (error: any) {
      throw new Error(`Failed to create DNS record: ${error.message}`);
    }
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

      await prisma.domain.update({
        where: { id: domainId },
        data: { status: 'deleted' },
      });
    } catch (error: any) {
      throw new Error(`Failed to delete DNS record: ${error.message}`);
    }
  }

  async listDomains(userId: string) {
    return prisma.domain.findMany({
      where: { userId, status: { not: 'deleted' } },
      include: { 
        dnsAccount: { include: { provider: true } },
        availableDomain: true
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
