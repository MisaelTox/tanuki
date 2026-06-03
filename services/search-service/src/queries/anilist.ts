export const SEARCH_ANIME_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          color
        }
        bannerImage
        description(asHtml: false)
        status
        episodes
        season
        seasonYear
        averageScore
        popularity
        genres
        format
        startDate {
          year
          month
          day
        }
      }
    }
  }
`

export const SEARCH_MANGA_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          color
        }
        bannerImage
        description(asHtml: false)
        status
        chapters
        volumes
        averageScore
        popularity
        genres
        format
        startDate {
          year
          month
          day
        }
      }
    }
  }
`

export const GET_MEDIA_BY_ID_QUERY = `
  query ($id: Int, $type: MediaType) {
    Media(id: $id, type: $type) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        extraLarge
        color
      }
      bannerImage
      description(asHtml: false)
      status
      episodes
      chapters
      volumes
      season
      seasonYear
      averageScore
      meanScore
      popularity
      favourites
      genres
      tags {
        name
        rank
        isMediaSpoiler
      }
      format
      source
      studios(isMain: true) {
        nodes {
          id
          name
          siteUrl
        }
      }
      staff(perPage: 6) {
        nodes {
          id
          name {
            full
          }
          primaryOccupations
          image {
            medium
          }
        }
      }
      characters(perPage: 6, sort: ROLE) {
        nodes {
          id
          name {
            full
          }
          image {
            medium
          }
        }
      }
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      siteUrl
      trailer {
        id
        site
      }
    }
  }
`

export const TRENDING_QUERY = `
  query ($page: Int, $perPage: Int, $type: MediaType) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(sort: TRENDING_DESC, type: $type, isAdult: false) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
          color
        }
        bannerImage
        status
        episodes
        chapters
        averageScore
        popularity
        genres
        format
        seasonYear
      }
    }
  }
`
