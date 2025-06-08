"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Movie, TVShow } from "@/lib/tmdb"

interface WatchLaterItem extends Partial<Movie & TVShow> {
  id: number
  type: "movie" | "tv"
  title?: string
  name?: string
  poster_path: string
  vote_average: number
}

interface WatchLaterContextType {
  watchLaterItems: WatchLaterItem[]
  watchLaterCount: number
  addToWatchLater: (item: WatchLaterItem) => void
  removeFromWatchLater: (id: number) => void
  isInWatchLater: (id: number) => boolean
  clearWatchLater: () => void
}

const WatchLaterContext = createContext<WatchLaterContextType | undefined>(undefined)

export function WatchLaterProvider({ children }: { children: React.ReactNode }) {
  const [watchLaterItems, setWatchLaterItems] = useState<WatchLaterItem[]>([])

  useEffect(() => {
    const savedItems = localStorage.getItem("watchLater")
    if (savedItems) {
      setWatchLaterItems(JSON.parse(savedItems))
    }
  }, [])

  const addToWatchLater = (item: WatchLaterItem) => {
    const newItems = [...watchLaterItems, item]
    setWatchLaterItems(newItems)
    localStorage.setItem("watchLater", JSON.stringify(newItems))
  }

  const removeFromWatchLater = (id: number) => {
    const newItems = watchLaterItems.filter((item) => item.id !== id)
    setWatchLaterItems(newItems)
    localStorage.setItem("watchLater", JSON.stringify(newItems))
  }

  const isInWatchLater = (id: number) => {
    return watchLaterItems.some((item) => item.id === id)
  }

  const clearWatchLater = () => {
    setWatchLaterItems([])
    localStorage.setItem("watchLater", JSON.stringify([]))
  }

  const value = {
    watchLaterItems,
    watchLaterCount: watchLaterItems.length,
    addToWatchLater,
    removeFromWatchLater,
    isInWatchLater,
    clearWatchLater,
  }

  return <WatchLaterContext.Provider value={value}>{children}</WatchLaterContext.Provider>
}

export function useWatchLater() {
  const context = useContext(WatchLaterContext)
  if (context === undefined) {
    throw new Error("useWatchLater must be used within a WatchLaterProvider")
  }
  return context
}
