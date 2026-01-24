import bcrypt from 'bcryptjs';
import { prisma } from '@kagerou/database';

export class AuthService {
  async register(email: string, password: string, name?: string, role: string = 'user', inviteCode?: string) {
    // 检查是否为第一个用户（自动成为管理员）
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;
    
    // 如果是第一个用户，自动设为管理员，跳过注册限制检查
    if (!isFirstUser) {
      // 检查是否允许注册
      const allowRegistrationSetting = await prisma.systemSetting.findUnique({
        where: { key: 'allow_registration' }
      });
      const allowRegistration = allowRegistrationSetting?.value === 'true';
      
      if (!allowRegistration && role !== 'admin') {
        throw new Error('注册功能已关闭');
      }

      // 检查是否需要邀请码
      const requireInviteCodeSetting = await prisma.systemSetting.findUnique({
        where: { key: 'require_invite_code' }
      });
      const requireInviteCode = requireInviteCodeSetting?.value === 'true';

      if (requireInviteCode && role !== 'admin') {
        if (!inviteCode) {
          throw new Error('请输入邀请码');
        }

        // 验证邀请码（但不更新使用次数，在事务中处理）
        const invite = await prisma.inviteCode.findUnique({
          where: { code: inviteCode }
        });

        if (!invite || !invite.isActive) {
          throw new Error('邀请码无效');
        }

        if (invite.expiresAt && invite.expiresAt < new Date()) {
          throw new Error('邀请码已过期');
        }

        if (invite.usedCount >= invite.maxUses) {
          throw new Error('邀请码使用次数已达上限');
        }
      }
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // 获取系统设置：默认用户配额
    const defaultQuotaSetting = await prisma.systemSetting.findUnique({
      where: { key: 'default_user_quota' }
    });
    const defaultQuota = parseInt(defaultQuotaSetting?.value || '10');
    
    // 第一个用户自动成为管理员
    const finalRole = isFirstUser ? 'admin' : role;
    
    // 使用事务确保用户创建和邀请码更新的原子性
    const result = await prisma.$transaction(async (tx) => {
      // 创建用户
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: finalRole,
          quota: defaultQuota,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          quota: true,
          createdAt: true,
        },
      });

      // 如果需要邀请码且不是第一个用户，更新邀请码使用次数
      if (!isFirstUser && inviteCode) {
        const requireInviteCodeSetting = await tx.systemSetting.findUnique({
          where: { key: 'require_invite_code' }
        });
        const requireInviteCode = requireInviteCodeSetting?.value === 'true';

        if (requireInviteCode && role !== 'admin') {
          await tx.inviteCode.update({
            where: { code: inviteCode },
            data: { 
              usedCount: { increment: 1 },
              updatedAt: new Date()
            }
          });
        }
      }

      return user;
    });

    return result;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      quota: user.quota,
    };
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        quota: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  // 用户更新个人信息
  async updateProfile(userId: string, data: { name?: string; email?: string; password?: string }) {
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

    // 如果要更新密码，进行哈希处理
    let updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      updateData.passwordHash = passwordHash;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        quota: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  // 创建第一个管理员账号（已废弃，第一个注册用户自动成为管理员）
  async createFirstAdmin(email: string, password: string, name?: string) {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      throw new Error('Admin already exists');
    }

    // 第一个用户自动成为管理员
    return this.register(email, password, name, 'admin');
  }
}
