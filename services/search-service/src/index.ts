import Fastify from 'fastify';
import cors from '@fastify/cors';
import Redis from 'ioredis';
import { searchRoutes } from './routes/search';

const PORT = parseInt(process.env.PORT || '3002');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const isDev = process.env.NODE_ENV !== 'production';

const fastify = Fastify({
  logger: isDev
    ? { transport: { target: 'pino-pretty' } }
    : true,
});

const redis = new Redis(REDIS_URL);
redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.error('[Redis] Error:', err));

fastify.register(cors, { origin: true });
fastify.decorate('redis', redis);
fastify.get('/health', async () => ({ status: 'ok', service: 'search-service' }))
fastify.register(searchRoutes, { prefix: '/search' });

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
