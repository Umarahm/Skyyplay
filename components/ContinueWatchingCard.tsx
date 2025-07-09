"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type { ContinueWatchingItem } from "@/hooks/useContinueWatching"
import { WatchlistButton } from "./WatchlistButton"
import { useWatchlist } from "@/hooks/useWatchlist"

interface ContinueWatchingCardProps {
    item: ContinueWatchingItem
    onRemove: (id: number, type: 'movie' | 'tv') => void
}

export function ContinueWatchingCard({ item, onRemove }: ContinueWatchingCardProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [shouldLoad, setShouldLoad] = useState(false)
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
    const { isInWatchlist } = useWatchlist()

    useEffect(() => {
        if (!containerRef.current || typeof IntersectionObserver === "undefined") return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldLoad(true)
                        observer.disconnect()
                    }
                })
            },
            { threshold: 0.01 }
        )

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [])

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    const formatProgress = (progress: number, duration: number) => {
        const watchedMinutes = Math.floor((progress / 100) * duration)
        const remainingMinutes = duration - watchedMinutes
        return {
            watched: formatDuration(watchedMinutes),
            remaining: formatDuration(remainingMinutes)
        }
    }

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (showRemoveConfirm) {
            onRemove(item.id, item.type)
        } else {
            setShowRemoveConfirm(true)
            // Auto-hide confirmation after 3 seconds
            setTimeout(() => setShowRemoveConfirm(false), 3000)
        }
    }

    const progressInfo = formatProgress(item.progress, item.duration)
    const episodeInfo = item.season && item.episode ? ` • S${item.season}E${item.episode}` : ''
    const isAdded = isInWatchlist(item.id, item.type)

    return (
        <div className="inspiration-card group" ref={containerRef}>
            <a href={`/watch?id=${item.id}&type=${item.type}`} className="block w-full h-full">
                {/* Main Image */}
                {shouldLoad ? (
                    <Image
                        src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/logo.avif"}
                        alt={item.title}
                        fill
                        className="inspiration-card-image"
                        sizes="(max-width: 768px) 156px, 208px"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/logo.avif"
                        }}
                        priority={false}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-800 animate-pulse rounded-[12px]" />
                )}

                {/* Noise Texture Overlay */}
                <div className="inspiration-card-noise" />

                {/* Inner Shadow Effect */}
                <div className="inspiration-card-inner-shadow" />

                {/* Watchlist Button Container */}
                <div className="inspiration-watchlist-button-container">
                    <div className="inspiration-watchlist-button-bg" />
                    <WatchlistButton
                        item={item}
                        type={item.type}
                        size="sm"
                        className={`watchlist-btn-inspiration ${isAdded ? 'is-added' : ''}`}
                    />
                </div>

                {/* Remove Button */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={handleRemoveClick}
                        className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center backdrop-blur-sm group-hover:opacity-100 md:opacity-0 ${showRemoveConfirm
                            ? 'bg-red-500/80 hover:bg-red-600/80 text-white border border-red-400/50'
                            : 'bg-black/50 hover:bg-black/70 text-gray-300 hover:text-white border border-white/20'
                            }`}
                        title={showRemoveConfirm ? "Click again to confirm removal" : "Remove from Continue Watching"}
                    >
                        {showRemoveConfirm ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </button>
                </div>


                {/* Progress Bar - positioned above glass overlay */}
                <div className="absolute bottom-16 left-4 right-4 z-15 pointer-events-none">
                    <div className="w-full bg-black/40 rounded-full h-1 mb-1 backdrop-blur-sm">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(2, item.progress)}%` }}
                        />
                    </div>
                    <div className="text-xs text-white/90 flex justify-between items-center px-1">
                        <span className="drop-shadow-md">{Math.round(item.progress)}% watched</span>
                        <span className="drop-shadow-md">{progressInfo.remaining} left</span>
                    </div>
                </div>

                {/* Glass Overlay with Content Info */}
                <div className="inspiration-glass-overlay">
                    <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-gray-300 mb-1">
                        ⭐ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}/10{episodeInfo}
                    </p>
                    <p className="text-xs text-gray-400">
                        {progressInfo.watched} watched • {formatDuration(item.duration)} total
                    </p>
                </div>
            </a>
        </div>
    )
} 