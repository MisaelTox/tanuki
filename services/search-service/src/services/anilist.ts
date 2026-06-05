import axios from 'axios'
import { redis } from '../config/redis'
import {
  SEARCH_ANIME_QUERY,
  SEARCH_MANGA_QUERY,
  GET_MEDIA_BY_ID_QUERY,
  TRENDING_QUERY,
} from '../queries/anilist'

const ANILIST_URL = 'https://graphql.anilist.co'
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10)

async function queryAniList(query: string, variables: Record<string, unknown>) {
  const response = await axios.post(
    ANILIST_URL,
    { query, variables },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 10000,
    }
  )

  if (response.data.errors) {
    const error = response.data.errors[0]
    throw new Error(error.message || 'AniList API error')
  }

  return response.data.data
}

async function withCache<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch {
    // Redis fallo, continuamos sin cache
  }

  const result = await fn()

  try {
    await redis.setex(key, CACHE_TTL, JSON.stringify(result))
  } catch {
    // Redis fallo al guardar, no es bloqueante
  }

  return result
}

export async function searchAnime(
  search: string,
  page = 1,
  perPage = 20
) {
  const cacheKey = `anime:search:${search}:${page}:${perPage}`
  return withCache(cacheKey, () =>
    queryAniList(SEARCH_ANIME_QUERY, { search, page, perPage })
  )
}

export async function searchManga(
  search: string,
  page = 1,
  perPage = 20
) {
  const cacheKey = `manga:search:${search}:${page}:${perPage}`
  return withCache(cacheKey, () =>
    queryAniList(SEARCH_MANGA_QUERY, { search, page, perPage })
  )
}

export async function getMediaById(id: number, type: 'ANIME' | 'MANGA') {
  const cacheKey = `media:${type.toLowerCase()}:${id}`
  return withCache(cacheKey, () =>
    queryAniList(GET_MEDIA_BY_ID_QUERY, { id, type })
  )
}

export async function getTrending(
  type: 'ANIME' | 'MANGA' = 'ANIME',
  page = 1,
  perPage = 20
) {
  const cacheKey = `trending:${type.toLowerCase()}:${page}:${perPage}`
  return withCache(cacheKey, () =>
    queryAniList(TRENDING_QUERY, { type, page, perPage })
  )
}

export async function getTopSeinen(page = 1, perPage = 10) {
  const { TOP_SEINEN_QUERY } = require('../queries/anilist')
  const response = await axios.post(ANILIST_URL, {
    query: TOP_SEINEN_QUERY,
    variables: { page, perPage },
  })
  return response.data.data
}

export async function getTopSeinenFiltered(page = 1, perPage = 10) {
  const { TOP_SEINEN_QUERY } = require('../queries/anilist')
  let results: any[] = []
  let currentPage = 1

  while (results.length < perPage) {
    const response = await axios.post(ANILIST_URL, {
      query: TOP_SEINEN_QUERY,
      variables: { page: currentPage, perPage: 25 },
    })
    const media = response.data.data?.Page?.media || []
    if (media.length === 0) break

    const filtered = media.filter((m: any) =>
      m.tags?.some((t: any) => t.name === 'Seinen' && t.rank >= 60)
    )
    results = [...results, ...filtered]
    currentPage++

    if (currentPage > 5) break
  }

  return {
    Page: {
      media: results.slice(0, perPage)
    }
  }
}
