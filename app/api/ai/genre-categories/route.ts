import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import type { Movie, TVShow } from '@/lib/tmdb';

export async function POST(request: NextRequest) {
    try {
        const { genre, items, contentType } = await request.json();

        if (!genre || !items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Invalid genre or items array' },
                { status: 400 }
            );
        }

        if (!contentType || !['movie', 'tv'].includes(contentType)) {
            return NextResponse.json(
                { error: 'Content type must be "movie" or "tv"' },
                { status: 400 }
            );
        }

        const enhancedItems = await AIService.generateGenreCategoryPicks(
            items as (Movie | TVShow)[],
            genre,
            contentType
        );

        return NextResponse.json({ items: enhancedItems });
    } catch (error) {
        console.error('Error in genre-categories API:', error);
        return NextResponse.json(
            { error: 'Failed to generate genre category picks' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'Use POST method to generate genre category picks' },
        { status: 405 }
    );
} 