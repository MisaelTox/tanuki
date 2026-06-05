import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from '../middleware/auth'
import pool from '../config/db'

export async function profileRoutes(fastify: FastifyInstance) {
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user as JWTPayload

    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.created_at,
              p.bio, p.avatar_url
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'User not found' })
    }

    return reply.send(result.rows[0])
  })

  fastify.put('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user as JWTPayload
    const { username, bio, avatar_url } = request.body as {
      username?: string
      bio?: string
      avatar_url?: string
    }

    await pool.query(
      `INSERT INTO user_profiles (user_id, username, bio, avatar_url, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         username = COALESCE(EXCLUDED.username, user_profiles.username),
         bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
         avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
         updated_at = NOW()`,
      [userId, username, bio, avatar_url]
    )

    return reply.send({ message: 'Profile updated' })
  })
}
