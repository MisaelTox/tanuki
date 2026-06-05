import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from '../middleware/auth'
import pool from '../config/db'

export async function listsRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user as JWTPayload
    const { status, media_type, favorites } = request.query as {
      status?: string
      media_type?: string
      favorites?: string
    }

    let query = `SELECT * FROM user_lists WHERE user_id = $1`
    const params: (string | number | boolean)[] = [userId]
    let paramIndex = 2

    if (status) {
      query += ` AND status = $${paramIndex++}`
      params.push(status)
    }
    if (media_type) {
      query += ` AND media_type = $${paramIndex++}`
      params.push(media_type.toUpperCase())
    }
    if (favorites === 'true') {
      query += ` AND is_favorite = $${paramIndex++}`
      params.push(true)
    }

    query += ` ORDER BY updated_at DESC`

    const result = await pool.query(query, params)
    return reply.send(result.rows)
  })

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user as JWTPayload
    const { media_id, media_type, status, score, progress, notes, is_favorite } = request.body as {
      media_id: number
      media_type: 'ANIME' | 'MANGA'
      status: string
      score?: number
      progress?: number
      notes?: string
      is_favorite?: boolean
    }

    if (!media_id || !media_type || !status) {
      return reply.status(400).send({ error: 'media_id, media_type, and status are required' })
    }

    const result = await pool.query(
      `INSERT INTO user_lists (user_id, media_id, media_type, status, score, progress, notes, is_favorite)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, media_id, media_type)
       DO UPDATE SET
         status = EXCLUDED.status,
         score = COALESCE(EXCLUDED.score, user_lists.score),
         progress = COALESCE(EXCLUDED.progress, user_lists.progress),
         notes = COALESCE(EXCLUDED.notes, user_lists.notes),
         is_favorite = COALESCE(EXCLUDED.is_favorite, user_lists.is_favorite),
         updated_at = NOW()
       RETURNING *`,
      [userId, media_id, media_type, status, score, progress, notes, is_favorite ?? false]
    )

    return reply.status(201).send(result.rows[0])
  })

  fastify.delete('/:media_id/:media_type', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user as JWTPayload
    const { media_id, media_type } = request.params as {
      media_id: string
      media_type: string
    }

    const result = await pool.query(
      `DELETE FROM user_lists
       WHERE user_id = $1 AND media_id = $2 AND media_type = $3
       RETURNING id`,
      [userId, parseInt(media_id), media_type.toUpperCase()]
    )

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Entry not found' })
    }

    return reply.send({ message: 'Entry removed from list' })
  })

  fastify.get('/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user as JWTPayload

    const result = await pool.query(
      `SELECT
         media_type,
         status,
         COUNT(*) as count
       FROM user_lists
       WHERE user_id = $1
       GROUP BY media_type, status
       ORDER BY media_type, status`,
      [userId]
    )

    return reply.send(result.rows)
  })
}

export async function listsUpdateRoute(fastify: FastifyInstance) {
  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user as JWTPayload
    const { id } = request.params as { id: string }
    const { status, score, progress, notes, is_favorite } = request.body as {
      status?: string
      score?: number
      progress?: number
      notes?: string
      is_favorite?: boolean
    }

    const result = await pool.query(
      `UPDATE user_lists
       SET
         status = COALESCE($1, status),
         score = COALESCE($2, score),
         progress = COALESCE($3, progress),
         notes = COALESCE($4, notes),
         is_favorite = COALESCE($5, is_favorite),
         updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [status, score, progress, notes, is_favorite, parseInt(id), userId]
    )

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Entry not found' })
    }

    return reply.send(result.rows[0])
  })
}
