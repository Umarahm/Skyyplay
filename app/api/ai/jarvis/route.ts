import { NextRequest, NextResponse } from 'next/server'

// Fallback responses for when AI is disabled
const FALLBACK_RESPONSES = [
    "I'd love to help you find the perfect movie! Here are some great options: 'The Grand Budapest Hotel' for a delightful comedy, 'Interstellar' for mind-bending sci-fi, or 'La La Land' for a musical romance. What genre interests you most?",
    "Great question! I'd recommend checking out 'The Martian' for survival sci-fi, 'The Social Network' for gripping drama, or 'Spirited Away' for animated magic. Would you like me to suggest more in any particular genre?",
    "Based on what you're looking for, I think you'd enjoy 'Mad Max: Fury Road' for action, 'The Big Lebowski' for comedy, or 'Her' for thoughtful sci-fi romance. What mood are you in today?",
    "I'd suggest 'The Shawshank Redemption' for inspiring drama, 'Guardians of the Galaxy' for fun adventure, or 'The Princess Bride' for classic fantasy. What type of story appeals to you right now?",
    "AI features are currently disabled, but I can still help with some classic recommendations! How about 'Pulp Fiction' for crime thriller, 'The Princess Mononoke' for animated adventure, or 'Blade Runner 2049' for sci-fi?",
    "While my AI is offline, here are some crowd favorites: 'Parasite' for international thriller, 'Knives Out' for mystery comedy, or 'Everything Everywhere All at Once' for sci-fi adventure. What sounds interesting?"
]

export async function POST(request: NextRequest) {
    try {
        console.log('Jarvis AI: AI features are disabled, using fallback responses')

        const { message } = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // AI is disabled - always use fallback responses
        const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]

        return NextResponse.json({
            response: fallbackResponse,
            aiEnabled: false,
            message: 'AI chat features are currently disabled'
        })

    } catch (error: any) {
        console.error('Jarvis API error:', error)

        // Generic error fallback
        const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
        return NextResponse.json({ response: fallbackResponse })
    }
} 