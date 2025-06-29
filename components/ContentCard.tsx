"use client"

import Image from "next/image"
import type { Movie, TVShow } from "@/lib/tmdb"

interface ContentCardProps {
  item: Movie | TVShow
  type: "movie" | "tv"
  aiReason?: string
  showAIBadge?: boolean
}

export function ContentCard({ item, type, aiReason, showAIBadge = false }: ContentCardProps) {
  const title = "title" in item ? item.title : item.name
  const year = new Date("release_date" in item ? item.release_date : item.first_air_date || "").getFullYear()

  return (
    <div className="card-hover rounded-lg overflow-hidden bg-gray-800 border border-purple-500/10 relative">
      <a href={`/watch?id=${item.id}&type=${type}`} className="block">
        <div className="relative aspect-[2/3]">
          <Image
            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/placeholder.svg?height=600&width=400"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=600&width=400"
            }}
            priority={false}
            loading="lazy"
          />
          <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-gray-300 mt-1">
              ⭐ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}/10
            </p>
            {year && <p className="text-xs text-gray-400">{year}</p>}
            {aiReason && (
              <div className="mt-2 p-2 bg-purple-500/20 rounded border border-purple-500/30">
                <p className="text-xs text-purple-200 font-medium">AI Pick:</p>
                <p className="text-xs text-purple-100 mt-1">{aiReason}</p>
              </div>
            )}
          </div>
          {showAIBadge && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              AI
            </div>
          )}
        </div>
      </a>
    </div>
  )
}
