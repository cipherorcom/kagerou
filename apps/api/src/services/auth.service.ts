import bcrypt from 'bcryptjs';
import { prisma } from '@kagerou/database';

export class AuthService {
  async register(email: string, password: string, name?: string, role: string = 'user') {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
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

    return user;
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

  // 创建第一个管理员账号
  async createFirstAdmin(email: string, password: string, name?: string) {
    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    });

    if (adminCount > 0) {
      throw new Error('Admin already exists');
    }

    return this.register(email, password, name, 'admin');
  }
}
