import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  searchAnime,
  searchManga,
  getMediaById,
  getTrending,
  getTopSeinen, getTopSeinenFiltered,
} from '../services/anilist'

interface SearchQuery {
  q: string
  page?: string
  perPage?: string
}

interface MediaParams {
  id: string
}

interface MediaQuery {
  type?: 'ANIME' | 'MANGA'
}

interface TrendingQuery {
  type?: 'ANIME' | 'MANGA'
  page?: string
  perPage?: string
}

export async function searchRoutes(fastify: FastifyInstance) {
  // GET /search/anime?q=naruto&page=1&perPage=20
  fastify.get(
    '/anime',
    async (
      request: FastifyRequest<{ Querystring: SearchQuery }>,
      reply: FastifyReply
    ) => {
      const { q, page = '1', perPage = '20' } = request.query
      if (!q || q.trim().length < 1) {
        return reply.status(400).send({ error: 'Query parameter "q" is required' })
      }
      const data = await searchAnime(q.trim(), parseInt(page), parseInt(perPage))
      return reply.send(data)
    }
  )

  // GET /search/manga?q=berserk&page=1&perPage=20
  fastify.get(
    '/manga',
    async (
      request: FastifyRequest<{ Querystring: SearchQuery }>,
      reply: FastifyReply
    ) => {
      const { q, page = '1', perPage = '20' } = request.query
      if (!q || q.trim().length < 1) {
        return reply.status(400).send({ error: 'Query parameter "q" is required' })
      }
      const data = await searchManga(q.trim(), parseInt(page), parseInt(perPage))
      return reply.send(data)
    }
  )

  // GET /search/media/:id?type=ANIME
  fastify.get(
    '/media/:id',
    async (
      request: FastifyRequest<{ Params: MediaParams; Querystring: MediaQuery }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params
      const { type = 'ANIME' } = request.query
      const numericId = parseInt(id)
      if (isNaN(numericId)) {
        return reply.status(400).send({ error: 'Invalid media ID' })
      }
      if (!['ANIME', 'MANGA'].includes(type)) {
        return reply.status(400).send({ error: 'Type must be ANIME or MANGA' })
      }
      const data = await getMediaById(numericId, type)
      return reply.send(data)
    }
  )

  // GET /search/trending?type=ANIME&page=1&perPage=20
  fastify.get(
    '/trending',
    async (
      request: FastifyRequest<{ Querystring: TrendingQuery }>,
      reply: FastifyReply
    ) => {
      const { type = 'ANIME', page = '1', perPage = '20' } = request.query
      const validType = ['ANIME', 'MANGA'].includes(type) ? type : 'ANIME'
      const data = await getTrending(
        validType as 'ANIME' | 'MANGA',
        parseInt(page),
        parseInt(perPage)
      )
      return reply.send(data)
    }
  )

  // GET /search/top-seinen?page=1&perPage=10
  fastify.get(
    '/top-seinen',
    async (
      request: FastifyRequest<{ Querystring: TrendingQuery }>,
      reply: FastifyReply
    ) => {
      const { page = '1', perPage = '10' } = request.query
      const data = await getTopSeinenFiltered(parseInt(page), parseInt(perPage))
      return reply.send(data)
    }
  )
}
