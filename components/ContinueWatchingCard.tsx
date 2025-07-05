"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type { ContinueWatchingItem } from "@/hooks/useContinueWatching"
import { WatchlistButton } from "./WatchlistButton"

interface ContinueWatchingCardProps {
    item: ContinueWatchingItem
    onRemove: (id: number, type: 'movie' | 'tv') => void
}

export function ContinueWatchingCard({ item, onRemove }: ContinueWatchingCardProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [shouldLoad, setShouldLoad] = useState(false)
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

    useEffect(() => {
        if (!containerRef.current || typeof IntersectionObserver === "undefined") return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        setShouldLoad(true)
                        observer.disconnect()
                    }
                })
            },
            { threshold: 0.5 }
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

    return (
        <div className="card-hover rounded-lg overflow-hidden bg-gray-800 border border-purple-500/10 relative group">
            <a href={`/watch?id=${item.id}&type=${item.type}`} className="block">
                <div ref={containerRef} className="relative aspect-[2/3]">
                    {shouldLoad ? (
                        <Image
                            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/logo.avif"}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/logo.avif"
                            }}
                            priority={false}
                            loading="eager"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-800 animate-pulse" />
                    )}

                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex space-x-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 z-10">
                        {/* Watchlist Button */}
                        <WatchlistButton
                            item={item}
                            type={item.type}
                            size="sm"
                            variant="overlay"
                        />

                        {/* Remove Button */}
                        <button
                            onClick={handleRemoveClick}
                            className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center ${showRemoveConfirm
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-black/70 hover:bg-black/90 text-gray-300 hover:text-white'
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

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                        <div className="w-full bg-gray-600 rounded-full h-1 mb-1">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(2, item.progress)}%` }}
                            />
                        </div>
                        <div className="text-xs text-gray-300 flex justify-between items-center">
                            <span>{Math.round(item.progress)}% watched</span>
                            <span>{progressInfo.remaining} left</span>
                        </div>
                    </div>

                    {/* Overlay with Info */}
                    <div className="card-overlay pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pb-16">
                        <h3 className="text-sm font-semibold text-white line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-gray-300 mt-1">
                            ⭐ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}/10{episodeInfo}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {progressInfo.watched} watched • {formatDuration(item.duration)} total
                        </p>
                    </div>
                </div>
            </a>
        </div>
    )
} 