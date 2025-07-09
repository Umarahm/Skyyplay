"use client"

import Image from "next/image"
import type { Movie, TVShow } from "@/lib/tmdb"
import { useEffect, useRef, useState } from "react"
import { WatchlistButton } from "./WatchlistButton"
import { useWatchlist } from "@/hooks/useWatchlist"

interface ContentCardProps {
  item: Movie | TVShow
  type: "movie" | "tv"
}

export function ContentCard({ item, type }: ContentCardProps) {
  const title = "title" in item ? item.title : item.name
  const year = new Date("release_date" in item ? item.release_date : item.first_air_date || "").getFullYear()
  const { isInWatchlist } = useWatchlist()

  // Use intersection observer to defer image loading until the card is at least 50% visible
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { // Load when any part is visible
            setShouldLoad(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.01 } // Trigger as soon as a tiny part is visible
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  const isAdded = isInWatchlist(item.id, type)

  return (
    <div className="inspiration-card group" ref={containerRef}>
      <a href={`/info?id=${item.id}&type=${type}`} className="block w-full h-full">
        {/* Main Image */}
        {shouldLoad ? (
          <Image
            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/logo.avif"}
            alt={title}
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
            type={type}
            size="sm"
            className={`watchlist-btn-inspiration ${isAdded ? 'is-added' : ''}`}
          />
        </div>

        {/* Glass Overlay with Content Info */}
        <div className="inspiration-glass-overlay">
          <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{title}</h3>
          <p className="text-xs text-gray-300 mb-1">
            ⭐ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}/10
          </p>
          {year && !isNaN(year) && <p className="text-xs text-gray-400">{year}</p>}
        </div>
      </a>
    </div>
  )
}
