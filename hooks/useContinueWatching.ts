import { useLocalStorage } from './useLocalStorage'
import type { Movie, TVShow } from '@/lib/tmdb'

export interface ContinueWatchingItem {
    id: number
    type: 'movie' | 'tv'
    title: string
    poster_path: string | null
    progress: number // percentage from 0 to 100
    duration: number // total duration in minutes
    watchedAt: number // timestamp
    season?: number // for TV shows
    episode?: number // for TV shows
    vote_average: number
    release_date?: string
    first_air_date?: string
}

export function useContinueWatching() {
    const [continueWatchingItems, setContinueWatchingItems] = useLocalStorage<ContinueWatchingItem[]>(
        'continueWatching',
        []
    )

    const addToContinueWatching = (
        item: Movie | TVShow,
        type: 'movie' | 'tv',
        progress: number,
        duration: number,
        season?: number,
        episode?: number
    ) => {
        const title = 'title' in item ? item.title : item.name
        const existingIndex = continueWatchingItems.findIndex(
            existing => existing.id === item.id && existing.type === type
        )

        const continueWatchingItem: ContinueWatchingItem = {
            id: item.id,
            type,
            title,
            poster_path: item.poster_path,
            progress,
            duration,
            watchedAt: Date.now(),
            season,
            episode,
            vote_average: item.vote_average,
            release_date: 'release_date' in item ? item.release_date : undefined,
            first_air_date: 'first_air_date' in item ? item.first_air_date : undefined,
        }

        let updatedItems: ContinueWatchingItem[]

        if (existingIndex >= 0) {
            // Update existing item and move it to the front
            updatedItems = [...continueWatchingItems]
            updatedItems[existingIndex] = continueWatchingItem
            // Move updated item to front
            const updatedItem = updatedItems.splice(existingIndex, 1)[0]
            updatedItems.unshift(updatedItem)
        } else {
            // Add new item to the beginning
            updatedItems = [continueWatchingItem, ...continueWatchingItems]
        }

        // Limit to 6 items maximum
        if (updatedItems.length > 6) {
            updatedItems = updatedItems.slice(0, 6)
        }

        setContinueWatchingItems(updatedItems)
    }

    const removeFromContinueWatching = (id: number, type: 'movie' | 'tv') => {
        setContinueWatchingItems(
            continueWatchingItems.filter(item => !(item.id === id && item.type === type))
        )
    }

    const updateProgress = (id: number, type: 'movie' | 'tv', progress: number) => {
        setContinueWatchingItems(
            continueWatchingItems.map(item =>
                item.id === id && item.type === type
                    ? { ...item, progress, watchedAt: Date.now() }
                    : item
            )
        )
    }

    const clearContinueWatching = () => {
        setContinueWatchingItems([])
    }

    // Sort by most recently watched
    const sortedItems = [...continueWatchingItems].sort((a, b) => b.watchedAt - a.watchedAt)

    return {
        continueWatchingItems: sortedItems,
        addToContinueWatching,
        removeFromContinueWatching,
        updateProgress,
        clearContinueWatching,
    }
} 