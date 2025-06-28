import { NextResponse } from 'next/server'

const BASE_URL = "https://api.themoviedb.org/3"

function getApiKey() {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
        throw new Error('TMDB_API_KEY environment variable is not set. Please add it to your .env.local file.')
    }
    return apiKey
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'multi' // multi, movie, tv, person

    if (!query || query.trim().length < 2) {
        return NextResponse.json({ suggestions: [] })
    }

    try {
        let endpoint = ''

        switch (type) {
            case 'movie':
                endpoint = `${BASE_URL}/search/movie?api_key=${getApiKey()}&query=${encodeURIComponent(query)}&page=1`
                break
            case 'tv':
                endpoint = `${BASE_URL}/search/tv?api_key=${getApiKey()}&query=${encodeURIComponent(query)}&page=1`
                break
            case 'person':
                endpoint = `${BASE_URL}/search/person?api_key=${getApiKey()}&query=${encodeURIComponent(query)}&page=1`
                break
            default:
                endpoint = `${BASE_URL}/search/multi?api_key=${getApiKey()}&query=${encodeURIComponent(query)}&page=1`
        }

        const response = await fetch(endpoint)
        const data = await response.json()

        // Format suggestions for autocomplete (limited to 3 results)
        const suggestions = data.results?.slice(0, 3).map((item: any) => {
            const mediaType = item.media_type || type

            if (mediaType === 'person') {
                return {
                    id: item.id,
                    title: item.name,
                    subtitle: item.known_for_department || 'Actor',
                    type: 'person',
                    image: item.profile_path ? `https://image.tmdb.org/t/p/w92${item.profile_path}` : null,
                    year: null,
                    rating: item.popularity?.toFixed(1) || null
                }
            }

            const title = item.title || item.name
            const year = item.release_date || item.first_air_date

            return {
                id: item.id,
                title,
                subtitle: mediaType === 'movie' ? 'Movie' : 'TV Show',
                type: mediaType === 'movie' ? 'movie' : 'tv',
                image: item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : null,
                year: year ? new Date(year).getFullYear() : null,
                rating: item.vote_average?.toFixed(1) || null
            }
        }) || []

        return NextResponse.json({ suggestions })
    } catch (error) {
        console.error('Search suggestions error:', error)
        return NextResponse.json({ suggestions: [] })
    }
} 