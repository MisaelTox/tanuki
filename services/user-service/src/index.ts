import dotenv from 'dotenv'
dotenv.config()
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { profileRoutes } from './routes/profile'
import { listsRoutes, listsUpdateRoute } from './routes/lists'

const PORT = parseInt(process.env.PORT || '3003', 10)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'
const isDev = process.env.NODE_ENV !== 'production'

async function buildApp() {
  const fastify = Fastify({
    logger: isDev
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : true,
  })

  await fastify.register(cors, { origin: true })
  await fastify.register(jwt, { secret: JWT_SECRET })

  fastify.decorate('authenticate', async function(request: any, reply: any) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.get('/health', async () => ({ status: 'ok', service: 'user-service' }))
  await fastify.register(profileRoutes, { prefix: '/profile' })
  await fastify.register(listsRoutes, { prefix: '/lists' })
  await fastify.register(listsUpdateRoute, { prefix: '/lists' })

  fastify.setErrorHandler(async (error, _request, reply) => {
    fastify.log.error(error)
    const message = (error as Error).message ?? ''
    if (message.includes('duplicate key')) {
      return reply.status(409).send({ error: 'Entry already exists' })
    }
    return reply.status(500).send({ error: 'Internal server error' })
  })

  return fastify
}

async function start() {
  try {
    const app = await buildApp()
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`[user-service] Running on port ${PORT}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

start()
