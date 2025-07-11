const BASE_URL = "/api/tmdb"

export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  genres?: Genre[]
  adult: boolean
  runtime?: number
  status?: string
  tagline?: string
  belongs_to_collection?: {
    id: number
    name: string
    poster_path: string
    backdrop_path: string
  } | null
  production_companies?: ProductionCompany[]
  production_countries?: ProductionCountry[]
  spoken_languages?: SpokenLanguage[]
  budget?: number
  revenue?: number
  credits?: Credits
  similar?: { results: Movie[] }
  videos?: { results: Video[] }
  images?: Images
  reviews?: { results: Review[] }
}

export interface TVShow {
  id: number
  name: string
  overview: string
  poster_path: string
  backdrop_path: string
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  genres?: Genre[]
  number_of_seasons?: number
  number_of_episodes?: number
  episode_run_time?: number[]
  seasons?: {
    air_date: string
    episode_count: number
    id: number
    name: string
    overview: string
    poster_path: string
    season_number: number
  }[]
  status?: string
  production_companies?: ProductionCompany[]
  production_countries?: ProductionCountry[]
  spoken_languages?: SpokenLanguage[]
  credits?: Credits
  similar?: { results: TVShow[] }
  videos?: { results: Video[] }
  images?: Images
  reviews?: { results: Review[] }
}

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  name: string
  logo_path?: string
}

export interface ProductionCountry {
  iso_3166_1: string
  name: string
}

export interface SpokenLanguage {
  iso_639_1: string
  english_name: string
  name: string
}

export interface Credits {
  cast: CastMember[]
  crew: CrewMember[]
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path?: string
}

export interface CrewMember {
  id: number
  name: string
  job: string
  profile_path?: string
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
}

export interface Images {
  logos: ImageFile[]
  backdrops: ImageFile[]
  posters: ImageFile[]
}

export interface ImageFile {
  file_path: string
  width: number
  height: number
  iso_639_1?: string
}

export interface Season {
  id: number
  season_number: number
  name: string
  overview: string
  poster_path?: string
  air_date: string
  episode_count: number
  episodes?: Episode[]
}

export interface Episode {
  id: number
  episode_number: number
  name: string
  overview: string
  still_path?: string
  air_date: string
  vote_average: number
}

export interface Review {
  id: string
  author: string
  content: string
  author_details: {
    name: string
    username: string
    avatar_path: string | null
    rating: number | null
  }
}

export function isMovie(content: Movie | TVShow): content is Movie {
  return "title" in content;
}

export class TMDBApi {
  static async getPopularMovies(page = 1, language = "en"): Promise<{ results: Movie[]; total_pages: number }> {
    const response = await fetch(`${BASE_URL}/movies/popular?language=${language}&page=${page}`)
    return response.json()
  }

  static async getPopularTVShows(page = 1, language = "en"): Promise<{ results: TVShow[]; total_pages: number }> {
    const response = await fetch(`${BASE_URL}/tv/popular?language=${language}&page=${page}`)
    return response.json()
  }

  static async getMovieDetails(id: number, language = "en"): Promise<Movie> {
    const response = await fetch(`${BASE_URL}/movies/${id}?language=${language}`)
    return response.json()
  }

  static async getTVShowDetails(id: number, language = "en"): Promise<TVShow> {
    const response = await fetch(`${BASE_URL}/tv/${id}?language=${language}`)
    return response.json()
  }

  static async getSeasonDetails(tvId: number, seasonNumber: number, language = "en"): Promise<Season> {
    const response = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?language=${language}`)
    return response.json()
  }

  static async searchMovies(
    query: string,
    page = 1,
    language = "en",
  ): Promise<{ results: Movie[]; total_pages: number }> {
    const response = await fetch(
      `${BASE_URL}/search/movies?query=${encodeURIComponent(query)}&language=${language}&page=${page}`,
    )
    return response.json()
  }

  static async searchTVShows(
    query: string,
    page = 1,
    language = "en",
  ): Promise<{ results: TVShow[]; total_pages: number }> {
    const response = await fetch(
      `${BASE_URL}/search/tv?query=${encodeURIComponent(query)}&language=${language}&page=${page}`,
    )
    return response.json()
  }

  static async discoverMovies(params: {
    with_genres?: number
    language?: string
    page?: number
    sort_by?: string
  }): Promise<{ results: Movie[]; total_pages: number }> {
    const searchParams = new URLSearchParams({
      language: params.language || "en",
      page: (params.page || 1).toString(),
      sort_by: params.sort_by || "popularity.desc",
      ...(params.with_genres && { with_genres: params.with_genres.toString() }),
    })

    const response = await fetch(`${BASE_URL}/discover/movie?${searchParams}`)
    return response.json()
  }

  static async discoverTVShows(params: {
    with_genres?: number
    language?: string
    page?: number
    sort_by?: string
  }): Promise<{ results: TVShow[]; total_pages: number }> {
    const searchParams = new URLSearchParams({
      language: params.language || "en",
      page: (params.page || 1).toString(),
      sort_by: params.sort_by || "popularity.desc",
      ...(params.with_genres && { with_genres: params.with_genres.toString() }),
    })

    const response = await fetch(`${BASE_URL}/discover/tv?${searchParams}`)
    return response.json()
  }

  static async getMovieGenres(language = "en"): Promise<{ genres: Genre[] }> {
    const response = await fetch(`${BASE_URL}/genre/movie/list?language=${language}`)
    return response.json()
  }

  static async getTVGenres(language = "en"): Promise<{ genres: Genre[] }> {
    const response = await fetch(`${BASE_URL}/genre/tv/list?language=${language}`)
    return response.json()
  }

  static async discoverStreamingContent(params: {
    service: string
    type: 'movie' | 'tv'
    language?: string
    page?: number
    sort_by?: string
  }): Promise<{ results: (Movie | TVShow)[]; total_pages: number }> {
    const searchParams = new URLSearchParams({
      service: params.service,
      type: params.type,
      language: params.language || 'en',
      page: params.page?.toString() || '1',
      sort_by: params.sort_by || 'popularity.desc'
    })

    const response = await fetch(`${BASE_URL}/discover/streaming?${searchParams}`)
    return response.json()
  }
}
