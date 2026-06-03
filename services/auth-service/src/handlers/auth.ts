import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcrypt'
import { RegisterBody, LoginBody } from '../types/index.js'

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) {
  const { email, password, username } = request.body
  const client = await request.server.pg.connect()

  try {
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    if (existing.rows.length > 0) {
      return reply.status(409).send({ error: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const result = await client.query(
      'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, hashedPassword, username]
    )

    const user = result.rows[0]
    const token = await reply.jwtSign(
      { userId: user.id, email: user.email },
      { expiresIn: '7d' }
    )

    return reply.status(201).send({ token, user })
  } finally {
    client.release()
  }
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  const { email, password } = request.body
  const client = await request.server.pg.connect()

  try {
    const result = await client.query(
      'SELECT id, email, username, password_hash FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const token = await reply.jwtSign(
      { userId: user.id, email: user.email },
      { expiresIn: '7d' }
    )

    return reply.send({
      token,
      user: { id: user.id, email: user.email, username: user.username }
    })
  } finally {
    client.release()
  }
}

export async function verifyHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await request.jwtVerify()
  return reply.send({ valid: true, user: request.user })
}
