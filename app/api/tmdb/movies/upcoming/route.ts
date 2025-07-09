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
        const page = searchParams.get('page') || '1'

        const response = await fetch(
            `${BASE_URL}/movie/upcoming?api_key=${getApiKey()}&language=${language}&page=${page}&region=US`
        )

        if (!response.ok) {
            throw new Error('Failed to fetch upcoming movies')
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching upcoming movies:', error)
        return NextResponse.json(
            { error: 'Failed to fetch upcoming movies' },
            { status: 500 }
        )
    }
} 