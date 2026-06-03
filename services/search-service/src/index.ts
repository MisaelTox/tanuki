import Fastify from 'fastify'
import cors from '@fastify/cors'
import { redis } from './config/redis'
import { searchRoutes } from './routes/search'

const PORT = parseInt(process.env.PORT || '3002', 10)

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  })

  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    methods: ['GET'],
  })

  fastify.get('/health', async () => {
    const redisStatus = redis.status === 'ready' ? 'ok' : 'degraded'
    return {
      status: 'ok',
      service: 'search-service',
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    }
  })

  await fastify.register(searchRoutes, { prefix: '/search' })

  fastify.setErrorHandler(async (error, _request, reply) => {
    fastify.log.error(error)

    const message = (error as Error).message ?? ''

    if (message.includes('Too Many Requests') || message.includes('429')) {
      return reply.status(429).send({
        error: 'Rate limit reached. Please try again in a moment.',
      })
    }

    return reply.status(500).send({
      error: 'Internal server error',
    })
  })

  return fastify
}

async function start() {
  try {
    await redis.connect()
    const app = await buildApp()
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`[search-service] Running on port ${PORT}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

start()
