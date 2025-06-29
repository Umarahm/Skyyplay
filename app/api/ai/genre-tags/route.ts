import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import type { Genre } from '@/lib/tmdb';

export async function POST(request: NextRequest) {
    try {
        const { genres, contentType } = await request.json();

        if (!genres || !Array.isArray(genres)) {
            return NextResponse.json(
                { error: 'Invalid genres array' },
                { status: 400 }
            );
        }

        if (!contentType || !['movie', 'tv'].includes(contentType)) {
            return NextResponse.json(
                { error: 'Content type must be "movie" or "tv"' },
                { status: 400 }
            );
        }

        const moodTags = await AIService.generateGenreMoodTags(genres as Genre[], contentType);

        return NextResponse.json({ moodTags });
    } catch (error) {
        console.error('Error in genre-tags API:', error);
        return NextResponse.json(
            { error: 'Failed to generate mood tags' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'Use POST method to generate genre mood tags' },
        { status: 405 }
    );
} 