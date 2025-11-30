"use client"

import React, { useRef } from "react"
import Image from "next/image"
import type { Movie, TVShow } from "@/lib/tmdb"
import { ContentDrawer } from "./ContentDrawer"

interface AnimeSectionProps {
    title: string
    items: (Movie | TVShow)[]
    type: "movie" | "tv"
}

const AnimeCard = ({ item, type }: { item: Movie | TVShow; type: "movie" | "tv" }) => {
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
    const title = "title" in item ? item.title : item.name
    const year = new Date("release_date" in item ? item.release_date : item.first_air_date || "").getFullYear()

    return (
        <>
            <div
                className="relative group cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-[100]"
                onClick={() => setIsDrawerOpen(true)}
                style={{ transformOrigin: 'center' }}
            >
                {/* Card Container with Anime Styling */}
                <div className="relative overflow-hidden rounded-xl bg-gray-900 border-2 border-transparent group-hover:border-pink-500 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_25px_rgba(236,72,153,0.6)]">

                    {/* Image Aspect Ratio Container */}
                    <div className="relative aspect-[2/3] w-full">
                        {item.poster_path ? (
                            <Image
                                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                                alt={title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 768px) 150px, 200px"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">No Image</span>
                            </div>
                        )}

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                        {/* Anime Style Badge/Overlay Elements */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

                        {/* Rating Badge - Static Position */}
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm border border-pink-500/30 rounded px-1.5 py-0.5 text-xs font-bold text-pink-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span>★</span>
                            {item.vote_average?.toFixed(1)}
                        </div>
                    </div>

                    {/* Content Info - Hidden by default, shown on hover */}
                    <div className="absolute bottom-0 left-0 w-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="text-white font-bold text-sm md:text-base leading-tight line-clamp-2 mb-1 drop-shadow-md group-hover:text-pink-200 transition-colors">
                            {title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-300">
                            <span className="text-cyan-300">{year}</span>
                            <span className="border border-gray-600 rounded px-1 text-[10px] uppercase bg-black/50">
                                {type === 'movie' ? 'Movie' : 'TV'}
                            </span>
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

export function AnimeSection({ title, items, type }: AnimeSectionProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef
            const scrollAmount = direction === 'left' ? -current.offsetWidth * 0.8 : current.offsetWidth * 0.8
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    if (!items || items.length === 0) return null

    return (
        <div className="container mx-auto mb-8 animate-fade-in-up relative z-0">
            {/* Themed Container Box */}
            <div className="relative rounded-3xl bg-[#0f1119] border border-gray-800 shadow-2xl">

                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-pink-900/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />

                {/* Header Section */}
                <div className="relative px-4 py-4 md:px-4 md:py-5 flex items-center justify-between border-b border-gray-800/50 bg-black/20 backdrop-blur-sm z-40">
                    <div className="flex items-center gap-4">
                        {/* Anime Logo */}
                        <div className="flex-shrink-0">
                            <Image
                                src="/animelogo.svg"
                                alt="Anime Logo"
                                width={40}
                                height={40}
                                className="w-10 h-10 md:w-12 md:h-12"
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">
                                {title}
                            </h2>
                            <p className="text-pink-400/80 text-xs md:text-sm font-medium tracking-wider uppercase">
                                Featured Collection
                            </p>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="section-nav-button prev text-pink-400 border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-500/50"
                            aria-label="Scroll Left"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="section-nav-button next text-pink-400 border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-500/50"
                            aria-label="Scroll Right"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable Content Area - Reduced Padding */}
                <div className="px-1 py-4 md:px-1 md:py-6 bg-gradient-to-b from-black/10 to-black/30 relative z-10 pt-8">
                    <div
                        ref={scrollRef}
                        className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth relative z-20"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {items.map((item, index) => (
                            <div key={item.id} className="flex-shrink-0 w-[160px] md:w-[200px] relative z-30 p-1">
                                <AnimeCard item={item} type={type} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}