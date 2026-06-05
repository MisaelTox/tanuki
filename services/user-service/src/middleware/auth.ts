import '@fastify/jwt'
import { FastifyRequest, FastifyReply } from 'fastify'

export interface JWTPayload {
  userId: number
  email: string
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload
    user: JWTPayload
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>
  }
}
