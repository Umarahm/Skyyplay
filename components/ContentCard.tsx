"use client"

import type { Movie, TVShow } from "@/lib/tmdb"

interface ContentCardProps {
  item: Movie | TVShow
  type: "movie" | "tv"
}

export function ContentCard({ item, type }: ContentCardProps) {
  const title = "title" in item ? item.title : item.name
  const year = new Date("release_date" in item ? item.release_date : item.first_air_date || "").getFullYear()

  return (
    <div className="card-hover rounded-lg overflow-hidden bg-gray-800 border border-purple-500/10 relative">
      <a href={`/watch?id=${item.id}&type=${type}`} className="block">
        <div className="relative aspect-[2/3]">
          <img
            src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=600&width=400"
              target.classList.remove("object-cover")
              target.classList.add("object-contain")
            }}
          />
          <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
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
