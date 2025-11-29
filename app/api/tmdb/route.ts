import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BASE_URL = "https://api.themoviedb.org/3"

function getApiKey() {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
        throw new Error('TMDB_API_KEY environment variable is not set. Please add it to your .env.local file.')
    }
    return apiKey
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const requestID = searchParams.get('requestID')

        if (!requestID) {
            return NextResponse.json(
                { error: 'requestID parameter is required' },
                { status: 400 }
            )
        }

        // Extract common parameters
        const id = searchParams.get('id')
        const language = searchParams.get('language') || 'en'
        const page = searchParams.get('page') || '1'
        const query = searchParams.get('query')
        const type = searchParams.get('type') || 'movie'
        const season = searchParams.get('season')
        const episode = searchParams.get('episode')
        const service = searchParams.get('service')
        const sortBy = searchParams.get('sortBy') || 'popularity.desc'
        const with_genres = searchParams.get('with_genres')
        const with_keywords = searchParams.get('with_keywords')
        const with_origin_country = searchParams.get('with_origin_country')
        const without_genres = searchParams.get('without_genres')
        const primary_release_date_gte = searchParams.get('primary_release_date_gte')
        const first_air_date_gte = searchParams.get('first_air_date_gte')
        const vote_count_gte = searchParams.get('vote_count_gte')
        const vote_average_gte = searchParams.get('vote_average_gte')
        const year = searchParams.get('year')
        const country = searchParams.get('country')
        const genreKeywords = searchParams.get('genreKeywords')
        const append_to_response = searchParams.get('append_to_response')

        let endpoint = ''
        let apiParams = new URLSearchParams({
            api_key: getApiKey(),
            language,
        })

        // Route based on requestID
        switch (requestID) {
            // Popular/Latest content
            case 'popularMovie':
                endpoint = 'movie/popular'
                apiParams.append('page', page)
                break

            case 'popularTv':
                endpoint = 'tv/popular'
                apiParams.append('page', page)
                break

            case 'upcomingMovies':
                endpoint = 'movie/upcoming'
                apiParams.append('page', page)
                break

            case 'airingThisMonth':
                endpoint = 'tv/on_the_air'
                apiParams.append('page', page)
                break

            // Discovery endpoints
            case 'discoverMovie':
            case 'discoverTv':
            case 'discover':
                const discoverType = requestID === 'discoverMovie' ? 'movie' :
                    requestID === 'discoverTv' ? 'tv' : type
                endpoint = `discover/${discoverType}`
                apiParams.append('page', page)
                apiParams.append('sort_by', sortBy)

                if (with_genres) apiParams.append('with_genres', with_genres)
                if (with_keywords) apiParams.append('with_keywords', with_keywords)
                if (with_origin_country) apiParams.append('with_origin_country', with_origin_country)
                if (without_genres) apiParams.append('without_genres', without_genres)
                if (discoverType === 'movie' && primary_release_date_gte) {
                    apiParams.append('primary_release_date.gte', primary_release_date_gte)
                }
                if (discoverType === 'tv' && first_air_date_gte) {
                    apiParams.append('first_air_date.gte', first_air_date_gte)
                }
                if (vote_count_gte) apiParams.append('vote_count.gte', vote_count_gte)
                if (vote_average_gte) apiParams.append('vote_average.gte', vote_average_gte)
                if (year) {
                    if (discoverType === 'movie') {
                        apiParams.append('year', year)
                    } else {
                        apiParams.append('first_air_date_year', year)
                    }
                }
                if (country) apiParams.append('with_origin_country', country)
                break

            case 'discoverStreaming':
                const streamingType = type || 'movie'
                endpoint = `discover/${streamingType}`
                apiParams.append('page', page)
                apiParams.append('sort_by', sortBy)

                // Map service to provider ID (you may need to expand this mapping)
                const providerMap: { [key: string]: string } = {
                    'netflix': '8',
                    'disney': '337',
                    'hulu': '15',
                    'amazon': '9',
                    'hbo': '384',
                    'apple': '350',
                    'paramount': '531',
                    'peacock': '386'
                }

                if (service && providerMap[service]) {
                    apiParams.append('with_watch_providers', providerMap[service])
                    apiParams.append('watch_region', 'US')
                }
                break

            // Search endpoints
            case 'searchMulti':
                if (!query) throw new Error('Query parameter is required for search')
                endpoint = 'search/multi'
                apiParams.append('query', query)
                apiParams.append('page', page)
                break

            case 'searchMovie':
                if (!query) throw new Error('Query parameter is required for search')
                endpoint = 'search/movie'
                apiParams.append('query', query)
                apiParams.append('page', page)
                break

            case 'searchTv':
                if (!query) throw new Error('Query parameter is required for search')
                endpoint = 'search/tv'
                apiParams.append('query', query)
                apiParams.append('page', page)
                break

            case 'searchSuggestions':
                if (!query) throw new Error('Query parameter is required for search')
                const searchType = type === 'person' ? 'person' : type === 'movie' ? 'movie' : type === 'tv' ? 'tv' : 'multi'
                endpoint = `search/${searchType}`
                apiParams.append('query', query)
                apiParams.append('page', '1')
                break

            // Details for specific content
            case 'movieDetails':
                if (!id) throw new Error('ID parameter is required for movie details')
                endpoint = `movie/${id}`
                if (append_to_response) {
                    apiParams.append('append_to_response', append_to_response)
                } else {
                    apiParams.append('append_to_response', 'credits,similar,videos,reviews,release_dates,keywords,images')
                }
                break

            case 'tvDetails':
                if (!id) throw new Error('ID parameter is required for TV details')
                endpoint = `tv/${id}`
                if (append_to_response) {
                    apiParams.append('append_to_response', append_to_response)
                } else {
                    apiParams.append('append_to_response', 'credits,similar,videos,reviews,keywords,images')
                }
                break

            // Season/Episode specific
            case 'tvSeason':
                if (!id || !season) throw new Error('ID and season parameters are required for TV season')
                endpoint = `tv/${id}/season/${season}`
                break

            // Genres
            case 'movieGenres':
                endpoint = 'genre/movie/list'
                break

            case 'tvGenres':
                endpoint = 'genre/tv/list'
                break

            case 'genres':
                const genreType = type === 'tv' ? 'tv' : 'movie'
                endpoint = `genre/${genreType}/list`
                break

            // Genre specific lists
            case 'genreMovieList':
                endpoint = 'discover/movie'
                apiParams.append('page', page)
                if (genreKeywords) apiParams.append('with_genres', genreKeywords)
                break

            case 'genreTvList':
                endpoint = 'discover/tv'
                apiParams.append('page', page)
                if (genreKeywords) apiParams.append('with_genres', genreKeywords)
                break

            default:
                return NextResponse.json(
                    { error: `Invalid requestID: ${requestID}` },
                    { status: 400 }
                )
        }

        // Make the API call to TMDB
        const response = await fetch(`${BASE_URL}/${endpoint}?${apiParams}`)

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // For search suggestions, format the response
        if (requestID === 'searchSuggestions') {
            const suggestions = data.results?.slice(0, 10).map((item: any) => ({
                id: item.id,
                title: item.title || item.name,
                type: item.media_type || type,
                year: item.release_date || item.first_air_date ?
                    new Date(item.release_date || item.first_air_date).getFullYear() :
                    null,
                poster_path: item.poster_path,
                vote_average: item.vote_average
            })) || []

            return NextResponse.json({ suggestions })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in unified TMDB API:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch data' },
            { status: 500 }
        )
    }
} 