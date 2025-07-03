import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-service'
import type { Movie, TVShow } from '@/lib/tmdb'

export async function POST(request: NextRequest) {
    try {
        const { items, contentType } = await request.json()

        console.log('🎯 Carousel Picks AI Request:', {
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

        // Check AI status first
        const aiStatus = AIService.getStatus()
        console.log('🤖 AI Status:', aiStatus)

        // Use AIService to generate optimized carousel picks (2 AI + 2 regular)
        const enhancedItems = await AIService.generateOptimizedCarouselPicks(
            items as (Movie | TVShow)[],
            contentType as 'movie' | 'tv'
        )

        console.log('✨ AI Carousel Result (Optimized):', {
            originalCount: items.length,
            enhancedCount: enhancedItems.length,
            aiPicksCount: enhancedItems.filter((item: any) => item.isAIPick).length,
            regularPicksCount: enhancedItems.filter((item: any) => !item.isAIPick).length,
            hasAIReasons: enhancedItems.some((item: any) => item.aiReason),
            aiEnabled: aiStatus.enabled
        })

        return NextResponse.json({
            items: enhancedItems,
            enhanced: true,
            count: enhancedItems.length,
            aiStatus: aiStatus.enabled,
            debug: {
                originalCount: items.length,
                enhancedCount: enhancedItems.length,
                hasAIReasons: enhancedItems.some((item: any) => item.aiReason)
            }
        })

    } catch (error) {
        console.error('❌ Carousel picks AI error:', error)

        // Return fallback response on error
        const { items } = await request.json()
        const fallbackItems = items.slice(0, 4)

        return NextResponse.json({
            items: fallbackItems,
            enhanced: false,
            error: 'AI enhancement failed, using fallback',
            debug: {
                errorMessage: error instanceof Error ? error.message : String(error),
                fallbackCount: fallbackItems.length
            }
        })
    }
} 