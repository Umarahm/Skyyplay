"use client"

import Image from "next/image"
import type { Movie, TVShow } from "@/lib/tmdb"
import { useEffect, useRef, useState } from "react"
import { WatchlistButton } from "./WatchlistButton"
import { useWatchlist } from "@/hooks/useWatchlist"
import { ContentDrawer } from "./ContentDrawer"

interface ContentCardProps {
  item: Movie | TVShow
  type: "movie" | "tv"
}

export function ContentCard({ item, type }: ContentCardProps) {
  const title = "title" in item ? item.title : item.name
  const year = new Date("release_date" in item ? item.release_date : item.first_air_date || "").getFullYear()
  const { isInWatchlist } = useWatchlist()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

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
    <>
      <div
        className="inspiration-card group cursor-pointer"
        ref={containerRef}
        onClick={() => setIsDrawerOpen(true)}
      >
        <div className="block w-full h-full relative">
          {/* Main Image */}
          {shouldLoad ? (
            item.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                alt={title}
                fill
                className="inspiration-card-image"
                sizes="(max-width: 768px) 120px, 160px"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder_poster.png"
                }}
                priority={false}
                loading="lazy"
              />
            ) : (
              <Image
                src="/placeholder_poster.png"
                alt={title}
                fill
                className="object-cover w-full h-full"
                sizes="(max-width: 768px) 120px, 160px"
                priority={false}
                loading="lazy"
                quality={100}
              />
            )
          ) : (
            <div className="w-full h-full bg-gray-800 animate-pulse rounded-lg" />
          )}

          {/* Watchlist Button - Positioned absolute top-right */}
          <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
            <WatchlistButton
              item={item}
              type={type}
              size="sm"
              variant="overlay"
              className="backdrop-blur-md bg-black/40 hover:bg-purple-600/80 border-white/10 text-white rounded-full p-2 transition-all duration-300 transform hover:scale-110 shadow-lg"
            />
          </div>

          {/* Glass Overlay with Content Info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-white font-bold text-base mb-1 drop-shadow-md leading-tight overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{title}</h3>
              <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                <span className="flex items-center gap-1 text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                  {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}
                </span>
                <span>{year}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContentDrawer
        item={item}
        type={type}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  )
}