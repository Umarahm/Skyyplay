"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type { ContinueWatchingItem } from "@/hooks/useContinueWatching"
import { WatchlistButton } from "./WatchlistButton"
import { useWatchlist } from "@/hooks/useWatchlist"
import Link from "next/link"

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
            setTimeout(() => setShowRemoveConfirm(false), 3000)
        }
    }

    const progressInfo = formatProgress(item.progress, item.duration)
    const episodeInfo = item.season && item.episode ? ` • S${item.season}E${item.episode}` : ''
    const isAdded = isInWatchlist(item.id, item.type)
    const year = new Date(item.release_date || "").getFullYear()

    // Construct URL with season and episode parameters for TV shows
    const watchUrl = item.type === 'tv' && item.season && item.episode
        ? `/watch?id=${item.id}&type=${item.type}&season=${item.season}&episode=${item.episode}`
        : `/watch?id=${item.id}&type=${item.type}`

    return (
        <div className="inspiration-card group relative" ref={containerRef}>
            <Link href={watchUrl} className="block w-full h-full relative">
                {/* Main Image */}
                {shouldLoad ? (
                    <Image
                        src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/logo.avif"}
                        alt={item.title}
                        fill
                        className="inspiration-card-image"
                        sizes="(max-width: 768px) 120px, 160px"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder_poster.png"
                        }}
                        priority={false}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-800 animate-pulse rounded-lg" />
                )}

                {/* Remove Button - Positioned absolute top-right */}
                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={handleRemoveClick}
                        className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${showRemoveConfirm
                            ? 'bg-red-600 text-white'
                            : 'bg-black/60 hover:bg-red-600 text-white border border-white/10'
                            }`}
                        title={showRemoveConfirm ? "Click again to confirm" : "Remove"}
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

                {/* Glass Overlay with Content Info - Matches ContentCard style */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 mb-4">
                        <h3 className="text-white font-bold text-base line-clamp-2 mb-1 drop-shadow-md leading-tight">{item.title}</h3>
                        <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                            <span className="flex items-center gap-1 text-yellow-400">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                                {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}
                            </span>
                            <span>{year || 'N/A'}</span>
                        </div>
                        {/* Additional Info for Continue Watching */}
                        <div className="text-xs text-gray-400 mt-1 truncate">
                            {episodeInfo ? episodeInfo.replace(' • ', '') : formatDuration(item.duration)} left
                        </div>
                    </div>
                </div>

                {/* Progress Bar - Always visible at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-10">
                    <div
                        className="h-full bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                        style={{ width: `${Math.max(5, Math.min(100, item.progress))}%` }}
                    />
                </div>
            </Link>
        </div>
    )
}

