import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
  interface FastifyRequest {
    user: {
      userId: string;
    };
  }
}

export async function authPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
