import { useState, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface SearchHistoryItem {
    id: string
    query: string
    type: 'movie' | 'tv' | 'person' | 'multi'
    timestamp: number
    resultCount?: number
}

export function useSearchHistory() {
    const [history, setHistory] = useLocalStorage<SearchHistoryItem[]>('search-history', [])

    const addToHistory = (query: string, type: 'movie' | 'tv' | 'person' | 'multi' = 'multi', resultCount?: number) => {
        if (!query.trim()) return

        const newItem: SearchHistoryItem = {
            id: `${Date.now()}-${Math.random()}`,
            query: query.trim(),
            type,
            timestamp: Date.now(),
            resultCount
        }

        setHistory(prev => {
            // Remove duplicate queries
            const filtered = prev.filter(item =>
                item.query.toLowerCase() !== query.toLowerCase().trim() || item.type !== type
            )

            // Add new item to the beginning and limit to 50 items
            return [newItem, ...filtered].slice(0, 50)
        })
    }

    const removeFromHistory = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id))
    }

    const clearHistory = () => {
        setHistory([])
    }

    const getRecentSearches = (limit = 5) => {
        return history.slice(0, limit)
    }

    const getSearchSuggestions = (query: string, limit = 3) => {
        if (!query.trim()) return []

        const lowerQuery = query.toLowerCase()
        return history
            .filter(item =>
                item.query.toLowerCase().includes(lowerQuery) &&
                item.query.toLowerCase() !== lowerQuery
            )
            .slice(0, limit)
    }

    return {
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
        getRecentSearches,
        getSearchSuggestions
    }
} 