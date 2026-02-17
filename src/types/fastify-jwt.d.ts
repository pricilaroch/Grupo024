import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number; status: string };
    user: { id: number; status: string };
  }
}
