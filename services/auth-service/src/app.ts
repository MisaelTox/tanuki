import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import postgresPlugin from './plugins/postgres.js'
import authRoutes from './routes/auth.js'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production'
  })

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  app.register(postgresPlugin)
  app.register(authRoutes, { prefix: '/auth' })

  app.get('/health', async () => ({ status: 'ok', service: 'auth-service' }))

  return app
}
