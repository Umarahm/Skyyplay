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

        // Get current month date range
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const startDate = firstDay.toISOString().split('T')[0] // YYYY-MM-DD format
        const endDate = lastDay.toISOString().split('T')[0] // YYYY-MM-DD format

        // Use discover API to find TV shows airing this month
        const response = await fetch(
            `${BASE_URL}/discover/tv?api_key=${getApiKey()}&language=${language}&page=${page}&air_date.gte=${startDate}&air_date.lte=${endDate}&sort_by=popularity.desc&vote_count.gte=10`
        )

        if (!response.ok) {
            throw new Error('Failed to fetch TV shows airing this month')
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching TV shows airing this month:', error)
        return NextResponse.json(
            { error: 'Failed to fetch TV shows airing this month' },
            { status: 500 }
        )
    }
} 