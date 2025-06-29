import { NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';

export async function GET() {
    try {
        const status = AIService.getStatus();

        return NextResponse.json({
            success: true,
            status,
            message: status.enabled ? 'AI service is enabled' : 'AI service is disabled'
        });
    } catch (error) {
        console.error('Failed to get AI status:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to get AI status'
            },
            { status: 500 }
        );
    }
} 