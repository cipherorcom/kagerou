import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '@kagerou/database';
import { config } from '../config';

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      reply.code(401).send({ error: 'User not found or inactive' });
      return;
    }

    (request as any).user = user;
  } catch (err) {
    reply.code(401).send({ error: 'Invalid token' });
  }
};

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  // 先验证用户身份
  await requireAuth(request, reply);
  
  // 检查是否已经发送了响应（认证失败）
  if (reply.sent) return;

  const user = (request as any).user;
  if (user.role !== 'admin') {
    reply.code(403).send({ error: 'Admin access required' });
    return;
  }
};