"use client"

import { useState, useEffect, useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"

export interface WatchlistItem {
    id: number
    title: string
    poster_path: string | null
    vote_average: number
    release_date?: string
    first_air_date?: string
    type: "movie" | "tv"
    addedAt: number
}

export function useWatchlist() {
    const [watchlist, setWatchlist] = useLocalStorage<WatchlistItem[]>("watchlist", [])
    const [isLoading, setIsLoading] = useState(false)

    // Check if an item is in the watchlist
    const isInWatchlist = useCallback((id: number, type: "movie" | "tv") => {
        return watchlist.some(item => item.id === id && item.type === type)
    }, [watchlist])

    // Add item to watchlist
    const addToWatchlist = useCallback((item: Omit<WatchlistItem, "addedAt">) => {
        if (isInWatchlist(item.id, item.type)) {
            return false // Already in watchlist
        }

        const newItem: WatchlistItem = {
            ...item,
            addedAt: Date.now()
        }

        setWatchlist(prev => [newItem, ...prev])
        return true
    }, [isInWatchlist, setWatchlist])

    // Remove item from watchlist
    const removeFromWatchlist = useCallback((id: number, type: "movie" | "tv") => {
        setWatchlist(prev => prev.filter(item => !(item.id === id && item.type === type)))
    }, [setWatchlist])

    // Toggle item in watchlist
    const toggleWatchlist = useCallback((item: Omit<WatchlistItem, "addedAt">) => {
        if (isInWatchlist(item.id, item.type)) {
            removeFromWatchlist(item.id, item.type)
            return false // Removed
        } else {
            const success = addToWatchlist(item)
            return success // Added
        }
    }, [isInWatchlist, addToWatchlist, removeFromWatchlist])

    // Clear entire watchlist
    const clearWatchlist = useCallback(() => {
        setWatchlist([])
    }, [setWatchlist])

    // Get watchlist count
    const watchlistCount = watchlist.length

    // Get watchlist items sorted by most recently added
    const getWatchlistItems = useCallback(() => {
        return [...watchlist].sort((a, b) => b.addedAt - a.addedAt)
    }, [watchlist])

    return {
        watchlist,
        watchlistCount,
        isLoading,
        isInWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        clearWatchlist,
        getWatchlistItems
    }
} 