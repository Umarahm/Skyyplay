import { NextResponse } from 'next/server'

const BASE_URL = "https://api.themoviedb.org/3"

function getApiKey() {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
        throw new Error('TMDB_API_KEY environment variable is not set. Please add it to your .env.local file.')
    }
    return apiKey
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
    try {
        const { searchParams } = new URL(request.url)
        const language = searchParams.get('language') || 'en'
        const { id, seasonNumber } = await params

        const response = await fetch(
            `${BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${getApiKey()}&language=${language}`
        )

        if (!response.ok) {
            throw new Error('Failed to fetch season details')
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching season details:', error)
        return NextResponse.json(
            { error: 'Failed to fetch season details' },
            { status: 500 }
        )
    }
} 