import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

const SYSTEM_PROMPT = `You are Jarvis, an AI movie companion that helps users discover movies and TV shows based on their mood, preferences, and interests. You have access to a vast database of movies and TV shows through TMDB.

Your role is to:
1. Understand the user's mood, preferences, or what they're looking for
2. Provide personalized movie and TV show recommendations
3. Explain why you're recommending specific content
4. Ask follow-up questions to better understand their preferences
5. Be conversational, friendly, and helpful

Guidelines:
- Always provide specific movie/show titles when possible
- Explain the reasoning behind your recommendations
- Consider factors like genre, mood, themes, actors, directors, etc.
- If the user mentions a mood (sad, happy, excited, etc.), suggest content that matches that emotional state
- If they mention specific preferences (action, comedy, romance, etc.), focus on those genres
- Be conversational and engaging, not just listing titles
- Ask clarifying questions when needed to provide better recommendations
- Keep responses concise but informative (2-4 sentences for recommendations)

Example responses:
"I understand you're feeling down today. For a mood lift, I'd recommend 'The Secret Life of Walter Mitty' - it's an uplifting adventure that will inspire you to step out of your comfort zone. The stunning visuals and Ben Stiller's performance make it perfect for when you need a boost of optimism."

"Looking for something thrilling? 'Inception' is a mind-bending sci-fi thriller that will keep you on the edge of your seat. Christopher Nolan's masterpiece combines stunning visuals with a complex plot that will make you question reality itself."

Remember to be helpful, engaging, and always focus on helping the user discover great content that matches their current needs and preferences.`

// Fallback responses for when AI is unavailable
const FALLBACK_RESPONSES = [
    "I'd love to help you find the perfect movie! Based on your message, here are some great options: 'The Grand Budapest Hotel' for a delightful comedy, 'Interstellar' for mind-bending sci-fi, or 'La La Land' for a musical romance. What genre interests you most?",
    "Great question! I'd recommend checking out 'The Martian' for survival sci-fi, 'The Social Network' for gripping drama, or 'Spirited Away' for animated magic. Would you like me to suggest more in any particular genre?",
    "Based on what you're looking for, I think you'd enjoy 'Mad Max: Fury Road' for action, 'The Big Lebowski' for comedy, or 'Her' for thoughtful sci-fi romance. What mood are you in today?",
    "I'd suggest 'The Shawshank Redemption' for inspiring drama, 'Guardians of the Galaxy' for fun adventure, or 'The Princess Bride' for classic fantasy. What type of story appeals to you right now?"
]

export async function POST(request: NextRequest) {
    try {
        // Check if API key is available
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.error('Jarvis AI: No API key found')
            const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
            return NextResponse.json({ response: fallbackResponse })
        }

        const { message, conversationHistory } = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

        // Build conversation context
        const conversation = [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: "Hello! I'm Jarvis, your AI movie companion. I'm ready to help you discover amazing movies and TV shows based on your mood, preferences, and interests. What would you like to watch today?" }] }
        ]

        // Add conversation history (limit to last 10 messages to avoid token limits)
        if (conversationHistory && conversationHistory.length > 0) {
            const recentHistory = conversationHistory.slice(-10)
            recentHistory.forEach((msg: any) => {
                conversation.push({
                    role: msg.role,
                    parts: [{ text: msg.content }]
                })
            })
        }

        // Add current message
        conversation.push({
            role: 'user',
            parts: [{ text: message }]
        })

        const result = await model.generateContent({
            contents: conversation,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 500,
            },
        })

        const response = await result.response
        const text = response.text()

        return NextResponse.json({ response: text })

    } catch (error: any) {
        console.error('Jarvis AI error:', error)

        // Check for specific rate limit errors
        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate limit')) {
            const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
            return NextResponse.json({ response: fallbackResponse })
        }

        // Check for API key errors
        if (error.message?.includes('API key') || error.message?.includes('authentication')) {
            console.error('Jarvis AI: API key error')
            return NextResponse.json({
                response: "I'm having trouble with my configuration. Please check your API settings and try again."
            })
        }

        // Check for network errors
        if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('connection')) {
            console.error('Jarvis AI: Network error')
            return NextResponse.json({
                response: "I'm having trouble connecting to my servers. Please check your internet connection and try again."
            })
        }

        // Generic error - use fallback
        const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]

        return NextResponse.json({ response: fallbackResponse })
    }
} 