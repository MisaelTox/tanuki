import { FastifyInstance } from 'fastify'
import { registerHandler, loginHandler, verifyHandler } from '../handlers/auth.js'
import { RegisterBody, LoginBody } from '../types/index.js'

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterBody }>(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password', 'username'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            username: { type: 'string', minLength: 3 }
          }
        }
      }
    },
    registerHandler
  )

  fastify.post<{ Body: LoginBody }>(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        }
      }
    },
    loginHandler
  )

  fastify.get(
    '/verify',
    { preHandler: [fastify.authenticate] },
    verifyHandler
  )
}
