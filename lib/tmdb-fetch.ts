import { setCache, getCache } from "./client-cache";

interface TMDBFetchParams {
    requestID: string;
    id?: string | number;
    language?: string;
    page?: number;
    genreKeywords?: string;
    sortBy?: string;
    year?: number;
    country?: string;
    query?: string;
    season?: number;
    episode?: number;
    service?: string;
    type?: 'movie' | 'tv' | 'multi';
    with_genres?: string;
    with_keywords?: string;
    with_origin_country?: string;
    without_genres?: string;
    primary_release_date_gte?: string;
    first_air_date_gte?: string;
    vote_count_gte?: number;
    vote_average_gte?: number;
    append_to_response?: string;
}

export default async function tmdbFetch({
    requestID,
    id,
    language = "en-US",
    page = 1,
    genreKeywords,
    sortBy = "popularity.desc",
    year,
    country,
    query,
    season,
    episode,
    service,
    type = "movie",
    with_genres,
    with_keywords,
    with_origin_country,
    without_genres,
    primary_release_date_gte,
    first_air_date_gte,
    vote_count_gte,
    vote_average_gte,
    append_to_response
}: TMDBFetchParams) {
    const baseURL = "/api/tmdb";

    // Build request mapping similar to the inspiration example
    const requests: Record<string, string> = {
        // Popular/Latest content
        popularMovie: `${baseURL}?requestID=popularMovie&language=${language}&page=${page}&sortBy=${sortBy}`,
        popularTv: `${baseURL}?requestID=popularTv&language=${language}&page=${page}&sortBy=${sortBy}`,
        upcomingMovies: `${baseURL}?requestID=upcomingMovies&language=${language}&page=${page}`,
        airingThisMonth: `${baseURL}?requestID=airingThisMonth&language=${language}&page=${page}`,

        // Discovery/Filter endpoints
        discoverMovie: `${baseURL}?requestID=discoverMovie&language=${language}&page=${page}&sortBy=${sortBy}${with_genres ? `&with_genres=${with_genres}` : ''}${with_keywords ? `&with_keywords=${with_keywords}` : ''}${with_origin_country ? `&with_origin_country=${with_origin_country}` : ''}${without_genres ? `&without_genres=${without_genres}` : ''}${primary_release_date_gte ? `&primary_release_date_gte=${primary_release_date_gte}` : ''}${vote_count_gte ? `&vote_count_gte=${vote_count_gte}` : ''}${vote_average_gte ? `&vote_average_gte=${vote_average_gte}` : ''}${year ? `&year=${year}` : ''}${country ? `&country=${country}` : ''}`,
        discoverTv: `${baseURL}?requestID=discoverTv&language=${language}&page=${page}&sortBy=${sortBy}${with_genres ? `&with_genres=${with_genres}` : ''}${with_keywords ? `&with_keywords=${with_keywords}` : ''}${with_origin_country ? `&with_origin_country=${with_origin_country}` : ''}${without_genres ? `&without_genres=${without_genres}` : ''}${first_air_date_gte ? `&first_air_date_gte=${first_air_date_gte}` : ''}${vote_count_gte ? `&vote_count_gte=${vote_count_gte}` : ''}${vote_average_gte ? `&vote_average_gte=${vote_average_gte}` : ''}${year ? `&year=${year}` : ''}${country ? `&country=${country}` : ''}`,
        discover: `${baseURL}?requestID=discover&type=${type}&language=${language}&page=${page}&sortBy=${sortBy}${with_genres ? `&with_genres=${with_genres}` : ''}${with_keywords ? `&with_keywords=${with_keywords}` : ''}${with_origin_country ? `&with_origin_country=${with_origin_country}` : ''}${without_genres ? `&without_genres=${without_genres}` : ''}${type === 'movie' && primary_release_date_gte ? `&primary_release_date_gte=${primary_release_date_gte}` : ''}${type === 'tv' && first_air_date_gte ? `&first_air_date_gte=${first_air_date_gte}` : ''}${vote_count_gte ? `&vote_count_gte=${vote_count_gte}` : ''}${vote_average_gte ? `&vote_average_gte=${vote_average_gte}` : ''}`,
        discoverStreaming: `${baseURL}?requestID=discoverStreaming&service=${service}&type=${type}&language=${language}&page=${page}&sortBy=${sortBy}`,

        // Search endpoints
        searchMulti: `${baseURL}?requestID=searchMulti&query=${encodeURIComponent(query || '')}&language=${language}&page=${page}`,
        searchMovie: `${baseURL}?requestID=searchMovie&query=${encodeURIComponent(query || '')}&language=${language}&page=${page}`,
        searchTv: `${baseURL}?requestID=searchTv&query=${encodeURIComponent(query || '')}&language=${language}&page=${page}`,
        searchSuggestions: `${baseURL}?requestID=searchSuggestions&query=${encodeURIComponent(query || '')}&type=${type}&language=${language}`,

        // Details for specific content (with ID)
        movieDetails: `${baseURL}?requestID=movieDetails&id=${id}&language=${language}${append_to_response ? `&append_to_response=${append_to_response}` : ''}`,
        tvDetails: `${baseURL}?requestID=tvDetails&id=${id}&language=${language}${append_to_response ? `&append_to_response=${append_to_response}` : ''}`,
        collectionDetails: `${baseURL}?requestID=collectionDetails&id=${id}&language=${language}`,

        // Season/Episode specific
        tvSeason: `${baseURL}?requestID=tvSeason&id=${id}&season=${season}&language=${language}`,

        // Genres
        movieGenres: `${baseURL}?requestID=movieGenres&language=${language}`,
        tvGenres: `${baseURL}?requestID=tvGenres&language=${language}`,
        genres: `${baseURL}?requestID=genres&type=${type}&language=${language}`,

        // Genre specific lists
        genreMovieList: `${baseURL}?requestID=genreMovieList&genreKeywords=${genreKeywords}&language=${language}&page=${page}`,
        genreTvList: `${baseURL}?requestID=genreTvList&genreKeywords=${genreKeywords}&language=${language}&page=${page}`,
    };

    const finalRequest = requests[requestID];

    if (!finalRequest) {
        throw new Error(`Invalid requestID: ${requestID}`);
    }

    // Check if ID-based request has valid ID
    if ((requestID.includes('Details') || requestID.includes('Season')) && !id) {
        throw new Error(`ID is required for ${requestID}`);
    }

    // Client-side caching
    const cacheKey = finalRequest;
    const cachedResult = getCache(cacheKey);

    if (cachedResult && cachedResult !== null && cachedResult !== undefined && cachedResult !== "") {
        return cachedResult;
    }

    try {
        const response = await fetch(finalRequest);

        if (!response.ok) {
            throw new Error(`Failed to fetch ${requestID}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful responses
        if (data && data !== null) {
            setCache(cacheKey, data);
        }

        return data;
    } catch (error) {
        console.error(`Error fetching ${requestID}:`, error);
        throw error;
    }
} 