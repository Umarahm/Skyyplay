import { NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';

export async function POST() {
    try {
        AIService.resetAI();

        return NextResponse.json({
            success: true,
            message: 'AI service reset successfully'
        });
    } catch (error) {
        console.error('Failed to reset AI service:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to reset AI service'
            },
            { status: 500 }
        );
    }
} 