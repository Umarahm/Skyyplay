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
        const with_genres = searchParams.get('with_genres')
        const language = searchParams.get('language') || 'en'
        const page = searchParams.get('page') || '1'
        const sort_by = searchParams.get('sort_by') || 'popularity.desc'

        const params = new URLSearchParams({
            api_key: getApiKey(),
            language,
            page,
            sort_by,
            ...(with_genres && { with_genres })
        })

        const response = await fetch(`${BASE_URL}/discover/tv?${params}`)

        if (!response.ok) {
            throw new Error('Failed to discover TV shows')
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error discovering TV shows:', error)
        return NextResponse.json(
            { error: 'Failed to discover TV shows' },
            { status: 500 }
        )
    }
} 