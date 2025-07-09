import { NextResponse } from 'next/server'

const BASE_URL = "https://api.themoviedb.org/3"

function getApiKey() {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
        throw new Error('TMDB_API_KEY environment variable is not set. Please add it to your .env.local file.')
    }
    return apiKey
}

// Network IDs for major streaming services
const STREAMING_NETWORKS: Record<string, number[]> = {
    hbo: [49, 3186], // HBO & HBO Max
    disney: [2739, 2919], // Disney Channel & Disney+
    netflix: [213], // Netflix
    peacock: [3353], // Peacock
    prime: [1024], // Amazon Prime Video
    hulu: [453], // Hulu
    paramount: [4, 13], // CBS & Paramount+
    showtime: [67], // Showtime
    fox: [19], // FOX
    warner: [3186, 49], // Warner Bros/HBO Max
    discovery: [64, 2087], // Discovery Channel & Discovery+
    appletv: [2552] // Apple TV+
}

// Production company IDs for movies
const STREAMING_COMPANIES: Record<string, number[]> = {
    hbo: [49, 3268], // HBO & HBO Productions
    disney: [2, 6125], // Walt Disney Pictures & Walt Disney Studios
    netflix: [2907], // Netflix
    peacock: [11073], // Peacock
    prime: [1785, 5, 20580], // Amazon Studios & Columbia Pictures & Amazon MGM Studios
    hulu: [2319], // Hulu
    paramount: [4, 1281], // Paramount Pictures & Paramount+
    showtime: [694], // Showtime Networks
    fox: [25, 34], // 20th Century Studios & Fox
    warner: [174, 128], // Warner Bros & DC Entertainment
    discovery: [2698], // Discovery
    appletv: [420] // Apple
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const service = searchParams.get('service') // e.g., 'hbo', 'netflix', etc.
        const type = searchParams.get('type') || 'tv' // 'movie' or 'tv'
        const language = searchParams.get('language') || 'en'
        const page = searchParams.get('page') || '1'
        const sortBy = searchParams.get('sort_by') || 'popularity.desc'

        if (!service || !STREAMING_NETWORKS[service]) {
            return NextResponse.json(
                { error: 'Invalid or missing streaming service' },
                { status: 400 }
            )
        }

        const endpoint = type === 'movie' ? 'movie' : 'tv'
        const searchParamsObj = new URLSearchParams({
            api_key: getApiKey(),
            language,
            page,
            sort_by: sortBy,
        })

        if (type === 'tv') {
            // For TV shows, use network IDs
            const networks = STREAMING_NETWORKS[service]
            searchParamsObj.append('with_networks', networks.join('|'))
        } else {
            // For movies, use production company IDs
            const companies = STREAMING_COMPANIES[service]
            if (companies) {
                searchParamsObj.append('with_companies', companies.join('|'))
            }
        }

        const response = await fetch(`${BASE_URL}/discover/${endpoint}?${searchParamsObj}`)

        if (!response.ok) {
            throw new Error(`Failed to discover ${service} ${type} content`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error discovering streaming content:', error)
        return NextResponse.json(
            { error: 'Failed to discover streaming content' },
            { status: 500 }
        )
    }
} 