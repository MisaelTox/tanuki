import dotenv from 'dotenv'
dotenv.config()
import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import pool from './config/db'
import { profileRoutes } from './routes/profile'
import { listsRoutes } from './routes/lists'
import './middleware/auth'

const PORT = parseInt(process.env.PORT || '3003', 10)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'

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
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })

  await fastify.register(jwt, { secret: JWT_SECRET })

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
    }
  )

  fastify.get('/health', async () => {
    try {
      await pool.query('SELECT 1')
      return { status: 'ok', service: 'user-service', db: 'ok', timestamp: new Date().toISOString() }
    } catch {
      return { status: 'degraded', service: 'user-service', db: 'error', timestamp: new Date().toISOString() }
    }
  })

  await fastify.register(profileRoutes, { prefix: '/profile' })
  await fastify.register(listsRoutes, { prefix: '/lists' })

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
