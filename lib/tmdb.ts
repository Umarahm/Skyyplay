import tmdbFetch from "./tmdb-fetch"

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
    return tmdbFetch({
      requestID: "popularMovie",
      language,
      page
    })
  }

  static async getPopularTVShows(page = 1, language = "en"): Promise<{ results: TVShow[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "popularTv",
      language,
      page
    })
  }

  static async getMovieDetails(id: number, language = "en", append_to_response = "credits,reviews,similar,images"): Promise<Movie> {
    return tmdbFetch({
      requestID: "movieDetails",
      id,
      language,
      append_to_response
    })
  }

  static async getTVShowDetails(id: number, language = "en", append_to_response = "credits,reviews,similar,images"): Promise<TVShow> {
    return tmdbFetch({
      requestID: "tvDetails",
      id,
      language,
      append_to_response
    })
  }

  static async getSeasonDetails(tvId: number, seasonNumber: number, language = "en"): Promise<Season> {
    return tmdbFetch({
      requestID: "tvSeason",
      id: tvId,
      season: seasonNumber,
      language
    })
  }

  static async searchMovies(
    query: string,
    page = 1,
    language = "en",
  ): Promise<{ results: Movie[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "searchMovie",
      query,
      language,
      page
    })
  }

  static async searchTVShows(
    query: string,
    page = 1,
    language = "en",
  ): Promise<{ results: TVShow[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "searchTv",
      query,
      language,
      page
    })
  }

  static async discoverMovies(params: {
    with_genres?: number
    language?: string
    page?: number
    sort_by?: string
  }): Promise<{ results: Movie[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "discoverMovie",
      language: params.language || "en",
      page: params.page || 1,
      sortBy: params.sort_by || "popularity.desc",
      with_genres: params.with_genres?.toString()
    })
  }

  static async discoverTVShows(params: {
    with_genres?: number
    language?: string
    page?: number
    sort_by?: string
  }): Promise<{ results: TVShow[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "discoverTv",
      language: params.language || "en",
      page: params.page || 1,
      sortBy: params.sort_by || "popularity.desc",
      with_genres: params.with_genres?.toString()
    })
  }

  static async getMovieGenres(language = "en"): Promise<{ genres: Genre[] }> {
    return tmdbFetch({
      requestID: "movieGenres",
      language
    })
  }

  static async getTVGenres(language = "en"): Promise<{ genres: Genre[] }> {
    return tmdbFetch({
      requestID: "tvGenres",
      language
    })
  }

  static async discoverStreamingContent(params: {
    service: string
    type: 'movie' | 'tv'
    language?: string
    page?: number
    sort_by?: string
  }): Promise<{ results: (Movie | TVShow)[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "discoverStreaming",
      service: params.service,
      type: params.type,
      language: params.language || "en",
      page: params.page || 1,
      sortBy: params.sort_by || "popularity.desc"
    })
  }

  // Additional helper methods that match existing usage patterns
  static async getUpcomingMovies(page = 1, language = "en"): Promise<{ results: Movie[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "upcomingMovies",
      language,
      page
    })
  }

  static async getAiringThisMonth(page = 1, language = "en"): Promise<{ results: TVShow[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "airingThisMonth",
      language,
      page
    })
  }

  static async discover(params: {
    type: 'movie' | 'tv'
    with_genres?: string
    with_keywords?: string
    with_origin_country?: string
    without_genres?: string
    primary_release_date_gte?: string
    first_air_date_gte?: string
    vote_count_gte?: number
    vote_average_gte?: number
    language?: string
    page?: number
    sort_by?: string
  }): Promise<{ results: (Movie | TVShow)[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "discover",
      type: params.type,
      with_genres: params.with_genres,
      with_keywords: params.with_keywords,
      with_origin_country: params.with_origin_country,
      without_genres: params.without_genres,
      primary_release_date_gte: params.primary_release_date_gte,
      first_air_date_gte: params.first_air_date_gte,
      vote_count_gte: params.vote_count_gte,
      vote_average_gte: params.vote_average_gte,
      language: params.language || "en",
      page: params.page || 1,
      sortBy: params.sort_by || "popularity.desc"
    })
  }

  static async searchMulti(
    query: string,
    page = 1,
    language = "en",
  ): Promise<{ results: (Movie | TVShow)[]; total_pages: number }> {
    return tmdbFetch({
      requestID: "searchMulti",
      query,
      language,
      page
    })
  }

  static async getSearchSuggestions(
    query: string,
    type: 'movie' | 'tv' | 'multi' = 'multi',
    language = "en"
  ) {
    return tmdbFetch({
      requestID: "searchSuggestions",
      query,
      type,
      language
    })
  }

  static async getGenres(type: 'movie' | 'tv', language = "en"): Promise<{ genres: Genre[] }> {
    return tmdbFetch({
      requestID: "genres",
      type,
      language
    })
  }
}
