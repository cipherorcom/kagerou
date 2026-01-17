import { prisma } from '@kagerou/database';
import { DNSProviderFactory } from '@kagerou/dns-providers';
import { encrypt, decrypt } from '../utils/crypto';

export class DNSAccountService {
  async createAccount(userId: string, providerId: string, credentials: any, isDefault = false) {
    const provider = await prisma.dNSProvider.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw new Error('Provider not found');
    }

    const dnsProvider = DNSProviderFactory.create({
      type: provider.name,
      credentials,
    });

    const isValid = await dnsProvider.validateCredentials();
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const encryptedCredentials = encrypt(JSON.stringify(credentials));

    if (isDefault) {
      await prisma.dNSAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const account = await prisma.dNSAccount.create({
      data: {
        userId,
        providerId,
        credentials: encryptedCredentials,
        isDefault,
      },
      include: { provider: true },
    });

    return account;
  }

  async listAccounts(userId: string) {
    return prisma.dNSAccount.findMany({
      where: { userId, isActive: true },
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAccount(userId: string, accountId: string) {
    const account = await prisma.dNSAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const domainCount = await prisma.domain.count({
      where: { dnsAccountId: accountId, status: 'active' },
    });

    if (domainCount > 0) {
      throw new Error('Cannot delete account with active domains');
    }

    await prisma.dNSAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });
  }
}
