import { prisma } from '@kagerou/database';
import { encrypt, decrypt } from '../utils/crypto';
import { DNSProviderFactory } from '@kagerou/dns-providers';

export class AdminService {
  // 用户管理
  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          quota: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              domains: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateUserQuota(userId: string, quota: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { quota },
      select: {
        id: true,
        email: true,
        name: true,
        quota: true,
      }
    });
  }

  async toggleUserStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      }
    });
  }

  async promoteToAdmin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
  }

  async demoteFromAdmin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: 'user' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
  }

  // 创建用户
  async createUser(email: string, password: string, name?: string, role: 'user' | 'admin' = 'user', quota: number = 10) {
    const bcrypt = await import('bcrypt');
    
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role,
        quota,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        quota: true,
        isActive: true,
        createdAt: true,
      }
    });
  }

  // 更新用户信息
  async updateUser(userId: string, data: { email?: string; name?: string; role?: 'user' | 'admin'; quota?: number; isActive?: boolean }) {
    // 如果要更新邮箱，检查是否已存在
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          email: data.email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        quota: true,
        isActive: true,
        createdAt: true,
      }
    });
  }

  // 删除用户
  async deleteUser(userId: string) {
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        domains: true,
        _count: {
          select: {
            domains: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 检查是否有关联的域名
    if (user._count.domains > 0) {
      throw new Error('Cannot delete user with existing domains. Please delete all domains first.');
    }

    // 删除用户
    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true, message: 'User deleted successfully' };
  }

  // 重置用户密码
  async resetUserPassword(userId: string, newPassword: string) {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });
  }

  // 系统统计
  async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      totalDomains,
      activeDomains,
      totalDnsAccounts,
      recentUsers,
      recentDomains
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.domain.count(),
      prisma.domain.count({ where: { status: 'active' } }),
      prisma.dNSAccount.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
          }
        }
      }),
      prisma.domain.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
          }
        }
      })
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        recent: recentUsers
      },
      domains: {
        total: totalDomains,
        active: activeDomains,
        recent: recentDomains
      },
      dnsAccounts: {
        total: totalDnsAccounts
      }
    };
  }

  // DNS Provider 管理
  async getAllProviders() {
    return prisma.dNSProvider.findMany({
      include: {
        _count: {
          select: {
            dnsAccounts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createProvider(data: {
    name: string;
    displayName: string;
    configSchema?: any;
  }) {
    return prisma.dNSProvider.create({
      data: {
        ...data,
        configSchema: data.configSchema || {}
      }
    });
  }

  async updateProvider(id: string, data: {
    displayName?: string;
    configSchema?: any;
    isActive?: boolean;
  }) {
    return prisma.dNSProvider.update({
      where: { id },
      data
    });
  }

  async deleteProvider(id: string) {
    // 检查是否有关联的账号
    const accountCount = await prisma.dNSAccount.count({
      where: { providerId: id }
    });

    if (accountCount > 0) {
      throw new Error('Cannot delete provider with existing accounts');
    }

    return prisma.dNSProvider.delete({
      where: { id }
    });
  }

  // API 日志
  async getApiLogs(page = 1, limit = 50, userId?: string) {
    const skip = (page - 1) * limit;
    const where = userId ? { userId } : {};
    
    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.apiLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 可用域名管理
  async getAvailableDomains() {
    return prisma.availableDomain.findMany({
      include: {
        dnsAccount: {
          include: {
            provider: {
              select: { name: true, displayName: true }
            }
          }
        },
        _count: {
          select: {
            domains: true
          }
        }
      },
      orderBy: { domain: 'asc' }
    });
  }

  async createAvailableDomain(dnsAccountId: string, domain: string) {
    return prisma.availableDomain.create({
      data: {
        dnsAccountId,
        domain
      },
      include: {
        dnsAccount: {
          include: {
            provider: {
              select: { name: true, displayName: true }
            }
          }
        }
      }
    });
  }

  async updateAvailableDomain(id: string, data: { isActive?: boolean }) {
    return prisma.availableDomain.update({
      where: { id },
      data
    });
  }

  async deleteAvailableDomain(id: string) {
    // 检查是否有关联的域名
    const domainCount = await prisma.domain.count({
      where: { availableDomainId: id }
    });

    if (domainCount > 0) {
      throw new Error('Cannot delete domain with existing subdomains');
    }

    return prisma.availableDomain.delete({
      where: { id }
    });
  }

  // DNS 账号管理
  async getAllDnsAccounts() {
    return prisma.dNSAccount.findMany({
      include: {
        provider: {
          select: { id: true, name: true, displayName: true }
        },
        _count: {
          select: {
            domains: true,
            availableDomains: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createDnsAccount(data: {
    name: string;
    providerId: string;
    credentials: any;
    isDefault?: boolean;
  }) {
    // 验证 Provider 存在
    const provider = await prisma.dNSProvider.findUnique({
      where: { id: data.providerId }
    });

    if (!provider) {
      throw new Error('DNS Provider not found');
    }

    // 加密凭证
    const encryptedCredentials = encrypt(JSON.stringify(data.credentials));

    // 如果设为默认，先取消其他默认账号
    if (data.isDefault) {
      await prisma.dNSAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    return prisma.dNSAccount.create({
      data: {
        name: data.name,
        providerId: data.providerId,
        credentials: encryptedCredentials,
        isDefault: data.isDefault || false
      },
      include: {
        provider: {
          select: { id: true, name: true, displayName: true }
        },
        _count: {
          select: {
            availableDomains: true,
            domains: true
          }
        }
      }
    });
  }

  async updateDnsAccount(id: string, data: { 
    name?: string;
    credentials?: any;
    isActive?: boolean; 
    isDefault?: boolean;
  }) {
    const updateData: any = {};

    // 如果提供了名称，更新名称
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    // 如果提供了凭证，加密并更新
    if (data.credentials !== undefined) {
      updateData.credentials = encrypt(JSON.stringify(data.credentials));
    }

    // 如果提供了状态，更新状态
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    // 如果设为默认，先取消其他默认账号
    if (data.isDefault !== undefined) {
      updateData.isDefault = data.isDefault;
      if (data.isDefault) {
        await prisma.dNSAccount.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false }
        });
      }
    }

    return prisma.dNSAccount.update({
      where: { id },
      data: updateData,
      include: {
        provider: {
          select: { id: true, name: true, displayName: true }
        },
        _count: {
          select: {
            domains: true
          }
        }
      }
    });
  }

  async deleteDnsAccount(id: string) {
    // 检查是否有关联的可用域名
    const availableDomainCount = await prisma.availableDomain.count({
      where: { dnsAccountId: id }
    });

    if (availableDomainCount > 0) {
      throw new Error('Cannot delete DNS account with existing available domains');
    }

    // 检查是否有关联的域名
    const domainCount = await prisma.domain.count({
      where: { dnsAccountId: id }
    });

    if (domainCount > 0) {
      throw new Error('Cannot delete DNS account with existing domains');
    }

    return prisma.dNSAccount.delete({
      where: { id }
    });
  }

  // 获取DNS账号的域名列表
  async getDnsAccountDomains(accountId: string) {
    console.log(`Getting domains for DNS account: ${accountId}`);
    
    const account = await prisma.dNSAccount.findUnique({
      where: { id: accountId },
      include: {
        provider: true
      }
    });

    if (!account) {
      throw new Error('DNS account not found');
    }

    console.log(`Found DNS account: ${account.name}, Provider: ${account.provider.name}`);

    try {
      // 解密凭证
      const credentials = JSON.parse(decrypt(account.credentials));
      console.log(`Decrypted credentials for provider: ${account.provider.name}`, {
        hasApiToken: !!credentials.apiToken,
        hasApiKey: !!credentials.apiKey,
        hasEmail: !!credentials.email,
        useGlobalKey: credentials.useGlobalKey,
        credentialKeys: Object.keys(credentials)
      });
      
      // 动态导入DNS Provider
      const { DNSProviderFactory } = await import('@kagerou/dns-providers');
      
      const dnsProvider = DNSProviderFactory.create({
        type: account.provider.name,
        credentials
      });

      console.log(`Created DNS provider instance: ${dnsProvider.name}`);

      // 获取域名列表
      if (dnsProvider.listDomains) {
        console.log('Calling listDomains...');
        const domains = await dnsProvider.listDomains();
        console.log(`Retrieved ${domains.length} domains:`, domains);
        return domains;
      } else {
        throw new Error(`Provider ${account.provider.displayName} does not support listing domains`);
      }
    } catch (error) {
      console.error('Error in getDnsAccountDomains:', error);
      throw error;
    }
  }

  // 域名管理
  async getAllDomains(page = 1, limit = 50, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    
    const [domains, total] = await Promise.all([
      prisma.domain.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          },
          dnsAccount: {
            select: {
              id: true,
              provider: {
                select: { name: true, displayName: true }
              }
            }
          },
          availableDomain: {
            select: { id: true, domain: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.domain.count({ where })
    ]);

    return {
      domains,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 禁用子域名管理
  async getBlockedSubdomains() {
    return prisma.blockedSubdomain.findMany({
      where: { isActive: true },
      orderBy: { subdomain: 'asc' }
    });
  }

  async createBlockedSubdomain(subdomain: string, reason?: string) {
    // 检查是否已存在
    const existing = await prisma.blockedSubdomain.findFirst({
      where: { subdomain: subdomain.toLowerCase() }
    });

    if (existing) {
      if (existing.isActive) {
        throw new Error('该子域名已被禁用');
      } else {
        // 重新激活
        return prisma.blockedSubdomain.update({
          where: { id: existing.id },
          data: { isActive: true, reason, updatedAt: new Date() }
        });
      }
    }

    return prisma.blockedSubdomain.create({
      data: {
        subdomain: subdomain.toLowerCase(),
        reason
      }
    });
  }

  async updateBlockedSubdomain(id: string, data: { reason?: string }) {
    return prisma.blockedSubdomain.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    });
  }

  async deleteBlockedSubdomain(id: string) {
    return prisma.blockedSubdomain.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() }
    });
  }

  // 管理员域名管理
  async updateDomainStatus(id: string, status: string) {
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: { 
        dnsAccount: { include: { provider: true } },
        availableDomain: true
      },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    // 如果状态从非active改为active，且没有providerRecordId，则调用DNS API
    if (status === 'active' && domain.status !== 'active' && !domain.providerRecordId) {
      try {
        const credentials = JSON.parse(decrypt(domain.dnsAccount.credentials));
        const provider = DNSProviderFactory.create({
          type: domain.dnsAccount.provider.name,
          credentials,
        });

        const fullDomain = `${domain.subdomain}.${domain.availableDomain.domain}`;
        const dnsRecord = await provider.createRecord(domain.availableDomain.domain, {
          name: fullDomain,
          type: domain.recordType as any,
          value: domain.value,
          ttl: domain.ttl,
          proxied: domain.proxied,
        });

        // 更新数据库记录，包含DNS记录ID
        return prisma.domain.update({
          where: { id },
          data: { 
            status, 
            providerRecordId: dnsRecord.id,
            updatedAt: new Date() 
          },
          include: {
            user: { select: { id: true, email: true, name: true } },
            dnsAccount: { include: { provider: true } },
            availableDomain: true
          }
        });
      } catch (error: any) {
        // DNS API调用失败，将状态设置为rejected
        return prisma.domain.update({
          where: { id },
          data: { status: 'rejected', updatedAt: new Date() },
          include: {
            user: { select: { id: true, email: true, name: true } },
            dnsAccount: { include: { provider: true } },
            availableDomain: true
          }
        });
      }
    }

    // 普通状态更新
    return prisma.domain.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      include: {
        user: { select: { id: true, email: true, name: true } },
        dnsAccount: { include: { provider: true } },
        availableDomain: true
      }
    });
  }

  async deleteDomainAsAdmin(id: string) {
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: { 
        dnsAccount: { include: { provider: true } },
        availableDomain: true
      },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    // 如果有DNS记录ID，尝试从DNS提供商删除
    if (domain.providerRecordId) {
      try {
        const credentials = JSON.parse(decrypt(domain.dnsAccount.credentials));
        const provider = DNSProviderFactory.create({
          type: domain.dnsAccount.provider.name,
          credentials,
        });

        await provider.deleteRecord(domain.availableDomain.domain, domain.providerRecordId);
      } catch (error) {
        console.error('Failed to delete DNS record from provider:', error);
        // 继续删除数据库记录，即使DNS提供商删除失败
      }
    }

    // 删除数据库记录
    return prisma.domain.delete({
      where: { id }
    });
  }
  
  // 系统设置管理
  async getSystemSettings() {
    return prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    });
  }

  async getSystemSetting(key: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    return setting?.value || null;
  }

  async updateSystemSetting(key: string, value: string) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value }
    });
  }

  // 邀请码管理
  async getInviteCodes() {
    return prisma.inviteCode.findMany({
      include: {
        creator: {
          select: { id: true, email: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createInviteCode(createdBy: string, data: {
    code?: string;
    description?: string;
    maxUses: number;
    expiresAt?: string;
    isActive: boolean;
  }) {
    // 如果没有提供邀请码，生成随机邀请码
    const code = data.code || (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    
    // 检查邀请码是否已存在
    const existingCode = await prisma.inviteCode.findUnique({
      where: { code }
    });
    
    if (existingCode) {
      throw new Error('邀请码已存在，请使用其他邀请码');
    }
    
    return prisma.inviteCode.create({
      data: {
        code,
        description: data.description,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
        createdBy
      },
      include: {
        creator: {
          select: { id: true, email: true, name: true }
        }
      }
    });
  }

  async updateInviteCode(id: string, data: {
    description?: string;
    maxUses?: number;
    expiresAt?: string;
    isActive?: boolean;
  }) {
    return prisma.inviteCode.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: { id: true, email: true, name: true }
        }
      }
    });
  }

  async deleteInviteCode(id: string) {
    return prisma.inviteCode.delete({
      where: { id }
    });
  }

  async updateDomainValue(id: string, value: string) {
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: { 
        dnsAccount: { include: { provider: true } },
        availableDomain: true
      },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    // 更新DNS提供商记录
    if (domain.providerRecordId) {
      try {
        const credentials = JSON.parse(decrypt(domain.dnsAccount.credentials));
        const provider = DNSProviderFactory.create({
          type: domain.dnsAccount.provider.name,
          credentials,
        });

        const fullDomain = `${domain.subdomain}.${domain.availableDomain.domain}`;
        await provider.updateRecord(domain.availableDomain.domain, domain.providerRecordId, {
          name: fullDomain,
          type: domain.recordType as any,
          value,
          ttl: domain.ttl,
          proxied: domain.proxied,
        });
      } catch (error: any) {
        throw new Error(`Failed to update DNS record: ${error.message}`);
      }
    }

    // 更新数据库记录
    return prisma.domain.update({
      where: { id },
      data: { value, updatedAt: new Date() },
      include: {
        user: { select: { id: true, email: true, name: true } },
        dnsAccount: { include: { provider: true } },
        availableDomain: true
      }
    });
  }
}