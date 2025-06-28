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
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query')
        const page = searchParams.get('page') || '1'
        const language = searchParams.get('language') || 'en'

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            )
        }

        const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${getApiKey()}&query=${encodeURIComponent(query)}&language=${language}&page=${page}`
        )

        if (!response.ok) {
            throw new Error('Failed to search movies')
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error searching movies:', error)
        return NextResponse.json(
            { error: 'Failed to search movies' },
            { status: 500 }
        )
    }
} 