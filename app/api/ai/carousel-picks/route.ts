import { NextRequest, NextResponse } from 'next/server'
import type { Movie, TVShow } from '@/lib/tmdb'

export async function POST(request: NextRequest) {
    try {
        const { items, contentType } = await request.json()

        console.log('🎯 Carousel Picks API Request (AI Disabled):', {
            itemCount: items?.length,
            contentType,
            timestamp: new Date().toISOString()
        })

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
        }

        if (!contentType || !['movie', 'tv'].includes(contentType)) {
            return NextResponse.json({ error: 'Valid contentType (movie/tv) is required' }, { status: 400 })
        }

        // AI features are disabled - return fallback deterministic shuffle
        const shuffledItems = items
            .sort((a: Movie | TVShow, b: Movie | TVShow) => {
                const hashA = (a.id * 17 + 13) % 1000
                const hashB = (b.id * 17 + 13) % 1000
                return hashA - hashB
            })
            .slice(0, 8)
            .map((item: Movie | TVShow) => ({ ...item, isAIPick: false }))

        console.log('✨ Fallback Carousel Result:', {
            originalCount: items.length,
            returnedCount: shuffledItems.length,
            aiEnabled: false
        })

        return NextResponse.json({
            items: shuffledItems,
            cached: false,
            aiEnabled: false,
            message: 'AI features disabled - using fallback selection'
        })

    } catch (error) {
        console.error('❌ Carousel picks API error:', error)
        return NextResponse.json(
            { error: 'Failed to process carousel picks request' },
            { status: 500 }
        )
    }
} 