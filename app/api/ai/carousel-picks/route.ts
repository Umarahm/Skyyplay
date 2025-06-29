import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import type { Movie, TVShow } from '@/lib/tmdb';

export async function POST(request: NextRequest) {
    try {
        const { items, contentType } = await request.json();

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Invalid items array' },
                { status: 400 }
            );
        }

        if (!contentType || !['movie', 'tv'].includes(contentType)) {
            return NextResponse.json(
                { error: 'Content type must be "movie" or "tv"' },
                { status: 400 }
            );
        }

        const enhancedItems = await AIService.generateCarouselPicks(
            items as (Movie | TVShow)[],
            contentType
        );

        return NextResponse.json({ items: enhancedItems });
    } catch (error) {
        console.error('Error in carousel-picks API:', error);
        return NextResponse.json(
            { error: 'Failed to generate carousel picks' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'Use POST method to generate carousel picks' },
        { status: 405 }
    );
} 