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
        const language = searchParams.get('language') || 'en'

        const response = await fetch(
            `${BASE_URL}/genre/movie/list?api_key=${getApiKey()}&language=${language}`
        )

        if (!response.ok) {
            throw new Error('Failed to fetch movie genres')
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching movie genres:', error)
        return NextResponse.json(
            { error: 'Failed to fetch movie genres' },
            { status: 500 }
        )
    }
} 