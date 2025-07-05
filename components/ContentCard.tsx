"use client"

import Image from "next/image"
import type { Movie, TVShow } from "@/lib/tmdb"
import { useEffect, useRef, useState } from "react"
import { WatchlistButton } from "./WatchlistButton"

interface ContentCardProps {
  item: Movie | TVShow
  type: "movie" | "tv"
}

export function ContentCard({ item, type }: ContentCardProps) {
  const title = "title" in item ? item.title : item.name
  const year = new Date("release_date" in item ? item.release_date : item.first_air_date || "").getFullYear()

  // Use intersection observer to defer image loading until the card is at least 50% visible
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

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

  return (
    <div className="card-hover rounded-lg overflow-hidden bg-gray-800 border border-purple-500/10 relative group">
      <a href={`/watch?id=${item.id}&type=${type}`} className="block">
        <div ref={containerRef} className="relative aspect-[2/3]">
          {shouldLoad ? (
            <Image
              src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/logo.avif"}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/logo.avif"
              }}
              priority={false}
              loading="eager" // load immediately once shouldLoad is true
            />
          ) : (
            <div className="w-full h-full bg-gray-800 animate-pulse" />
          )}

          {/* Watchlist Button */}
          <div className="absolute top-2 right-2 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <WatchlistButton
              item={item}
              type={type}
              size="sm"
              variant="overlay"
            />
          </div>

          <div className="card-overlay pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-gray-300 mt-1">
              ⭐ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}/10
            </p>
            {year && <p className="text-xs text-gray-400">{year}</p>}
          </div>
        </div>
      </a>
    </div>
  )
}
