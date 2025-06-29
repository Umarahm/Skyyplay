import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Movie, TVShow, Genre } from './tmdb';

// Initialize Gemini AI lazily to avoid client-side issues
let genAI: GoogleGenerativeAI | null = null;
let aiEnabled = true; // Flag to disable AI if there are issues
let aiErrorCount = 0; // Track consecutive errors
const MAX_AI_ERRORS = 3; // Allow up to 3 consecutive errors before disabling

// Rate limiting and caching
let lastApiCall = 0;
const MIN_API_CALL_INTERVAL = 2000; // Minimum 2 seconds between API calls
let rateLimitResetTime = 0;

// Enhanced cache interface for AI responses
interface AICache {
    genreTags: { [key: string]: string };
    carouselPicks: any[];
    genreCategories: { [key: string]: any[] };
    lastUpdated: number;
}

// In-memory cache (in production, you'd use Redis or similar)
let aiCache: AICache = {
    genreTags: {},
    carouselPicks: [],
    genreCategories: {},
    lastUpdated: 0
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.warn('GOOGLE_GENERATIVE_AI_API_KEY is not set, disabling AI features');
            aiEnabled = false;
            throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
        }
        try {
            genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        } catch (error) {
            console.error('Failed to initialize Google Generative AI:', error);
            aiErrorCount++;
            if (aiErrorCount >= MAX_AI_ERRORS) {
                aiEnabled = false;
            }
            throw error;
        }
    }
    return genAI;
}

// Rate limiting function
function checkRateLimit(): boolean {
    const now = Date.now();

    // Check if we're still in rate limit cooldown
    if (now < rateLimitResetTime) {
        return false;
    }

    // Check minimum interval between calls
    if (now - lastApiCall < MIN_API_CALL_INTERVAL) {
        return false;
    }

    lastApiCall = now;
    return true;
}

// Handle rate limit errors
function handleRateLimitError(error: any): void {
    if (error.status === 429) {
        // Extract retry delay from error response
        const retryDelay = error.errorDetails?.[2]?.retryDelay || '24s';
        const delayMs = parseInt(retryDelay) * 1000;
        rateLimitResetTime = Date.now() + delayMs;

        // Don't count rate limit errors as AI failures
        aiErrorCount = Math.max(0, aiErrorCount - 1);
    } else {
        aiErrorCount++;
        if (aiErrorCount >= MAX_AI_ERRORS) {
            aiEnabled = false;
        }
    }
}

export class AIService {
    /**
     * Generate mood tags for genres
     */
    static async generateGenreMoodTags(genres: Genre[], contentType: 'movie' | 'tv'): Promise<{ [key: string]: string }> {
        try {
            // Check if AI is enabled
            if (!aiEnabled) {
                return this.getFallbackGenreTags(genres);
            }

            // Check cache first
            const now = Date.now();
            const cacheKey = `${contentType}_${genres.map(g => g.id).join('_')}`;

            if (aiCache.genreTags[cacheKey] && (now - aiCache.lastUpdated) < CACHE_DURATION) {
                return { [cacheKey]: aiCache.genreTags[cacheKey] };
            }

            // Check rate limiting
            if (!checkRateLimit()) {
                return this.getFallbackGenreTags(genres);
            }

            const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-pro' });

            const prompt = `Create engaging mood tags for these ${contentType} genres. Each tag should be 2-4 words that capture the emotional appeal or viewing experience.

Genres: ${genres.map(g => g.name).join(', ')}

Requirements:
- Make them appealing and descriptive
- Consider viewing context (date night, weekend binge, etc.)
- Keep them concise but evocative
- Make them different from the original genre name

Format as JSON:
{
  "Action": "Adrenaline-Pumping Thrills",
  "Comedy": "Guaranteed Mood Boosters",
  "Horror": "Spine-Chilling Scares"
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const moodTags = JSON.parse(jsonMatch[0]);

                // Cache the results
                Object.entries(moodTags).forEach(([genre, tag]) => {
                    aiCache.genreTags[`${contentType}_${genre}`] = tag as string;
                });
                aiCache.lastUpdated = now;

                return moodTags;
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('Error generating genre mood tags:', error);
            handleRateLimitError(error);
            // Fallback mood tags
            return this.getFallbackGenreTags(genres);
        }
    }

    /**
     * Generate AI-enhanced carousel picks
     */
    static async generateCarouselPicks(items: (Movie | TVShow)[], contentType: 'movie' | 'tv'): Promise<Array<Movie | TVShow & { aiReason?: string }>> {
        try {
            // Check if AI is enabled
            if (!aiEnabled) {
                return items.slice(0, 8);
            }

            // Check cache
            const now = Date.now();
            if (aiCache.carouselPicks.length > 0 && (now - aiCache.lastUpdated) < CACHE_DURATION) {
                return aiCache.carouselPicks;
            }

            // Check rate limiting
            if (!checkRateLimit()) {
                return items.slice(0, 8);
            }

            const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-pro' });

            // Get current time context
            const currentHour = new Date().getHours();
            const currentMonth = new Date().getMonth();
            const timeContext = this.getTimeContext(currentHour, currentMonth);

            const itemsInfo = items.slice(0, 20).map(item => ({
                id: item.id,
                title: 'title' in item ? item.title : item.name,
                overview: item.overview,
                rating: item.vote_average,
                genres: item.genre_ids
            }));

            const prompt = `You are a smart content curator for a streaming platform. Select the 8 best ${contentType}s from this list for a featured carousel.

Context: ${timeContext}

Available content:
${JSON.stringify(itemsInfo, null, 2)}

Consider:
- Time of day/season appropriateness
- Content diversity (mix genres)
- Rating and popularity
- Compelling stories for featured placement
- Audience engagement potential

Select exactly 8 items and provide a brief reason (10-15 words) why each was chosen.

Format as JSON:
{
  "selections": [
    {
      "id": 123,
      "reason": "Perfect thriller for evening viewing with stellar ratings"
    }
  ]
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiResponse = JSON.parse(jsonMatch[0]);

                // Map AI selections back to original items
                const enhancedItems = aiResponse.selections
                    .map((selection: any) => {
                        const originalItem = items.find(item => item.id === selection.id);
                        if (originalItem) {
                            return {
                                ...originalItem,
                                aiReason: selection.reason
                            };
                        }
                        return null;
                    })
                    .filter(Boolean)
                    .slice(0, 8);

                // Cache results
                aiCache.carouselPicks = enhancedItems;
                aiCache.lastUpdated = now;

                return enhancedItems;
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('Error generating carousel picks:', error);
            handleRateLimitError(error);
            // Fallback to original logic
            return items.slice(0, 8);
        }
    }

    /**
     * Generate AI-enhanced genre category picks
     */
    static async generateGenreCategoryPicks(items: (Movie | TVShow)[], genre: string, contentType: 'movie' | 'tv'): Promise<Array<Movie | TVShow & { aiReason?: string }>> {
        try {
            // Check if AI is enabled
            if (!aiEnabled) {
                return items.slice(0, 20);
            }

            // Check cache first
            const now = Date.now();
            const cacheKey = `${contentType}_${genre}_${items.length}`;

            if (aiCache.genreCategories[cacheKey] && (now - aiCache.lastUpdated) < CACHE_DURATION) {
                return aiCache.genreCategories[cacheKey];
            }

            // Check rate limiting
            if (!checkRateLimit()) {
                return items.slice(0, 20);
            }

            const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-pro' });

            // Get current time context
            const currentHour = new Date().getHours();
            const currentMonth = new Date().getMonth();
            const timeContext = this.getTimeContext(currentHour, currentMonth);

            const itemsInfo = items.slice(0, 30).map(item => ({
                id: item.id,
                title: 'title' in item ? item.title : item.name,
                overview: item.overview,
                rating: item.vote_average,
                genres: item.genre_ids,
                releaseDate: 'release_date' in item ? item.release_date : item.first_air_date
            }));

            const prompt = `You are a smart content curator for a streaming platform. Select the 20 best ${contentType}s from this ${genre} genre list for a category section.

Context: ${timeContext}
Genre: ${genre}

Available content:
${JSON.stringify(itemsInfo, null, 2)}

Consider for ${genre} genre:
- Genre-specific appeal and authenticity
- Content diversity within the genre
- Rating and popularity
- Recent releases vs classics
- Cultural relevance and impact
- Viewer engagement potential
- Quality of storytelling and production

Select exactly 20 items and provide a brief reason (8-12 words) why each was chosen for this ${genre} category.

Format as JSON:
{
  "selections": [
    {
      "id": 123,
      "reason": "Epic action sequences with stellar ratings"
    }
  ]
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiResponse = JSON.parse(jsonMatch[0]);

                // Map AI selections back to original items
                const enhancedItems = aiResponse.selections
                    .map((selection: any) => {
                        const originalItem = items.find(item => item.id === selection.id);
                        if (originalItem) {
                            return {
                                ...originalItem,
                                aiReason: selection.reason
                            };
                        }
                        return null;
                    })
                    .filter(Boolean)
                    .slice(0, 20);

                // Cache results
                aiCache.genreCategories[cacheKey] = enhancedItems;
                aiCache.lastUpdated = now;

                return enhancedItems;
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('Error generating genre category picks:', error);
            handleRateLimitError(error);
            // Fallback to original logic
            return items.slice(0, 20);
        }
    }

    /**
     * Get time-based context for AI decisions
     */
    private static getTimeContext(hour: number, month: number): string {
        let timeOfDay = '';
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
        else timeOfDay = 'late night';

        let season = '';
        if ([11, 0, 1].includes(month)) season = 'winter';
        else if ([2, 3, 4].includes(month)) season = 'spring';
        else if ([5, 6, 7].includes(month)) season = 'summer';
        else season = 'fall';

        return `Current time: ${timeOfDay}, season: ${season}`;
    }

    /**
     * Fallback mood tags when AI fails
     */
    private static getFallbackGenreTags(genres: Genre[]): { [key: string]: string } {
        const fallbackTags: { [key: string]: string } = {
            'Action': 'Adrenaline-Pumping Thrills',
            'Adventure': 'Epic Journey Awaits',
            'Animation': 'Animated Masterpieces',
            'Comedy': 'Guaranteed Laughs',
            'Crime': 'Gripping Crime Stories',
            'Documentary': 'Real-World Insights',
            'Drama': 'Emotional Powerhouses',
            'Family': 'Perfect Family Time',
            'Fantasy': 'Magical Escapades',
            'History': 'Historical Epics',
            'Horror': 'Spine-Chilling Scares',
            'Music': 'Musical Journeys',
            'Mystery': 'Mind-Bending Mysteries',
            'Romance': 'Perfect Date Night',
            'Sci-Fi': 'Future Worlds',
            'Thriller': 'Edge-of-Seat Suspense',
            'War': 'Heroic War Stories',
            'Western': 'Wild West Adventures'
        };

        const result: { [key: string]: string } = {};
        genres.forEach(genre => {
            result[genre.name] = fallbackTags[genre.name] || 'Must-Watch Content';
        });

        return result;
    }

    /**
     * Clear cache manually (useful for testing or forced refresh)
     */
    static clearCache(): void {
        aiCache = {
            genreTags: {},
            carouselPicks: [],
            genreCategories: {},
            lastUpdated: 0
        };
    }

    /**
     * Reset AI service (useful for testing or recovery)
     */
    static resetAI(): void {
        aiEnabled = true;
        aiErrorCount = 0;
        genAI = null;
        lastApiCall = 0;
        rateLimitResetTime = 0;
    }

    /**
     * Get AI service status
     */
    static getStatus(): {
        enabled: boolean;
        errorCount: number;
        rateLimited: boolean;
        rateLimitResetTime: number;
        lastApiCall: number;
    } {
        return {
            enabled: aiEnabled,
            errorCount: aiErrorCount,
            rateLimited: Date.now() < rateLimitResetTime,
            rateLimitResetTime,
            lastApiCall
        };
    }
} 