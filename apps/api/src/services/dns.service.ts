import { prisma } from '@kagerou/database';
import { DNSProviderFactory } from '@kagerou/dns-providers';
import { decrypt } from '../utils/crypto';

export class DNSService {
  async createDomain(userId: string, dnsAccountId: string, subdomain: string, recordType: string, value: string, ttl?: number) {
    const account = await prisma.dNSAccount.findFirst({
      where: { id: dnsAccountId, userId },
      include: { provider: true },
    });

    if (!account) {
      throw new Error('DNS account not found');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const domainCount = await prisma.domain.count({ where: { userId } });

    if (domainCount >= user!.quota) {
      throw new Error('Domain quota exceeded');
    }

    const credentials = JSON.parse(decrypt(account.credentials));
    const provider = DNSProviderFactory.create({
      type: account.provider.name,
      credentials,
    });

    const existing = await prisma.domain.findFirst({
      where: { subdomain, dnsAccountId },
    });

    if (existing) {
      throw new Error('Subdomain already exists');
    }

    try {
      const dnsRecord = await provider.createRecord(subdomain, {
        name: subdomain,
        type: recordType as any,
        value,
        ttl: ttl || 300,
      });

      const domain = await prisma.domain.create({
        data: {
          userId,
          dnsAccountId,
          subdomain,
          recordType,
          value,
          ttl: ttl || 300,
          providerRecordId: dnsRecord.id,
          status: 'active',
        },
      });

      return domain;
    } catch (error: any) {
      throw new Error(`Failed to create DNS record: ${error.message}`);
    }
  }

  async updateDomain(userId: string, domainId: string, value: string, ttl?: number) {
    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId },
      include: { dnsAccount: { include: { provider: true } } },
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
      await provider.updateRecord(domain.subdomain, domain.providerRecordId!, {
        name: domain.subdomain,
        type: domain.recordType as any,
        value,
        ttl,
      });

      const updated = await prisma.domain.update({
        where: { id: domainId },
        data: { value, ttl: ttl || domain.ttl },
      });

      return updated;
    } catch (error: any) {
      throw new Error(`Failed to update DNS record: ${error.message}`);
    }
  }

  async deleteDomain(userId: string, domainId: string) {
    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId },
      include: { dnsAccount: { include: { provider: true } } },
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
        await provider.deleteRecord(domain.subdomain, domain.providerRecordId);
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
      include: { dnsAccount: { include: { provider: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
