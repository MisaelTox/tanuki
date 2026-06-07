import Fastify from 'fastify';
import cors from '@fastify/cors';
import Redis from 'ioredis';

const PORT = parseInt(process.env.PORT || '3004');
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

fastify.get('/health', async () => {
  return { status: 'ok', service: 'notification-service' };
});

// Endpoint para enviar notificación (mock en desarrollo)
fastify.post<{ Body: { userId: string; message: string; type: string } }>(
  '/notify',
  async (request, reply) => {
    const { userId, message, type } = request.body;

    // En desarrollo solo logueamos — en producción aquí iría SendGrid
    fastify.log.info({ userId, message, type }, '[notification] Event received');

    // Guardamos en Redis como historial
    await redis.lpush(
      `notifications:${userId}`,
      JSON.stringify({ message, type, timestamp: new Date().toISOString() })
    );
    await redis.ltrim(`notifications:${userId}`, 0, 49); // máximo 50 por usuario

    return { success: true };
  }
);

// Endpoint para leer notificaciones de un usuario
fastify.get<{ Params: { userId: string } }>(
  '/notifications/:userId',
  async (request, reply) => {
    const { userId } = request.params;
    const raw = await redis.lrange(`notifications:${userId}`, 0, 49);
    const notifications = raw.map((n) => JSON.parse(n));
    return { notifications };
  }
);

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`[notification-service] Running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
