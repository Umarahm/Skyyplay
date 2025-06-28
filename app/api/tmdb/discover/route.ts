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
        const type = searchParams.get('type') || 'movie' // 'movie' or 'tv'
        const withGenres = searchParams.get('with_genres')
        const language = searchParams.get('language') || 'en'
        const page = searchParams.get('page') || '1'
        const sortBy = searchParams.get('sort_by') || 'popularity.desc'

        const endpoint = type === 'tv' ? 'tv' : 'movie'
        const searchParamsObj = new URLSearchParams({
            api_key: getApiKey(),
            language,
            page,
            sort_by: sortBy,
        })

        if (withGenres) {
            searchParamsObj.append('with_genres', withGenres)
        }

        const response = await fetch(`${BASE_URL}/discover/${endpoint}?${searchParamsObj}`)

        if (!response.ok) {
            throw new Error(`Failed to discover ${type} content`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error discovering content:', error)
        return NextResponse.json(
            { error: 'Failed to discover content' },
            { status: 500 }
        )
    }
} 