"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { ContentCard } from "@/components/ContentCard"
import { TMDBApi, type Movie, type TVShow } from "@/lib/tmdb"

const CONTENT_CATEGORIES = [
    { id: "trending", title: "Trending Now", type: "both", sort: "popularity.desc" },
    { id: "top-rated", title: "Top Rated", type: "both", sort: "vote_average.desc" },
    { id: "new-releases", title: "New Releases", type: "both", sort: "release_date.desc" },
    { id: "action", title: "Action & Adventure", type: "both", genres: "28,12", sort: "popularity.desc" },
    { id: "comedy", title: "Comedy", type: "both", genres: "35", sort: "popularity.desc" },
    { id: "drama", title: "Drama", type: "both", genres: "18", sort: "popularity.desc" },
    { id: "thriller", title: "Thriller", type: "both", genres: "53", sort: "popularity.desc" },
    { id: "horror", title: "Horror", type: "movie", genres: "27", sort: "popularity.desc" },
    { id: "romance", title: "Romance", type: "both", genres: "10749", sort: "popularity.desc" },
    { id: "sci-fi", title: "Sci-Fi & Fantasy", type: "both", genres: "878,14", sort: "popularity.desc" },
    { id: "animation", title: "Animation", type: "both", genres: "16", sort: "popularity.desc" },
    { id: "documentary", title: "Documentaries", type: "both", genres: "99", sort: "popularity.desc" }
] as const

interface ServiceConfig {
    name: string
    logo: string
    color: string
    gradient: string
}

interface StreamingServiceClientProps {
    service: string
    serviceConfig: ServiceConfig
}

export function StreamingServiceClient({ service, serviceConfig }: StreamingServiceClientProps) {
    const [contentSections, setContentSections] = useState<Record<string, (Movie | TVShow)[]>>({})
    const [loading, setLoading] = useState(true)

    const scrollSection = useCallback((containerId: string, direction: "left" | "right") => {
        const container = document.getElementById(containerId)
        if (!container) return

        // Calculate scroll amount based on container width for smoother scrolling
        const scrollAmount = direction === "left" ? -container.offsetWidth * 0.8 : container.offsetWidth * 0.8
        container.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }, [])

    const fetchServiceContent = useCallback(async () => {
        try {
            setLoading(true)
            const sections: Record<string, (Movie | TVShow)[]> = {}

            for (const category of CONTENT_CATEGORIES) {
                try {
                    if (category.type === "both") {
                        // Fetch both movies and TV shows
                        const [movieData, tvData] = await Promise.all([
                            TMDBApi.discoverStreamingContent({
                                service,
                                type: 'movie',
                                sort_by: category.sort || 'popularity.desc',
                                page: 1
                            }),
                            TMDBApi.discoverStreamingContent({
                                service,
                                type: 'tv',
                                sort_by: category.sort || 'popularity.desc',
                                page: 1
                            })
                        ])


                        // Combine and shuffle movies and TV shows
                        const combined = [...(movieData.results || []), ...(tvData.results || [])]
                            .sort(() => Math.random() - 0.5)
                            .slice(0, 20)

                        sections[category.id] = combined
                    } else {
                        // Fetch single type
                        const data = await TMDBApi.discoverStreamingContent({
                            service,
                            type: category.type as 'movie' | 'tv',
                            sort_by: category.sort || 'popularity.desc',
                            page: 1
                        })


                        sections[category.id] = (data.results || []).slice(0, 20)
                    }
                } catch (error) {
                    console.error(`Error fetching ${category.title}:`, error)
                    sections[category.id] = []
                }
            }

            setContentSections(sections)
        } catch (error) {
            console.error("Error fetching service content:", error)
        } finally {
            setLoading(false)
        }
    }, [service])

    useEffect(() => {
        if (service && serviceConfig) {
            fetchServiceContent()
        }
    }, [service, fetchServiceContent])


    return (
        <div className="min-h-screen bg-black text-white">
            {/* Back Button */}
            <button
                onClick={() => window.history.back()}
                className="fixed top-4 left-4 z-50 bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-sm"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Hero Section */}
            <div
                className={`relative h-96 md:h-[500px] bg-gradient-to-b ${serviceConfig.gradient} flex items-center justify-center overflow-hidden`}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
                </div>

                {/* Service Logo */}
                <div className="relative z-10 text-center animate-fade-in-up">
                    <img
                        src={serviceConfig.logo}
                        alt={serviceConfig.name}
                        className="h-24 md:h-32 mx-auto mb-6 brightness-0 invert"
                        style={{ maxWidth: '300px' }}
                    />
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
                        Discover exclusive content from {serviceConfig.name}
                    </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/5 animate-pulse" />
                <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-white/5 animate-pulse delay-1000" />
            </div>

            {/* Content Sections */}
            <div className="px-4 md:px-6 py-8 md:py-12">
                {loading ? (
                    <div className="space-y-12">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-4">
                                <div className="h-8 w-48 bg-gray-600 rounded animate-pulse" />
                                <div className="flex gap-6 overflow-hidden">
                                    {[...Array(6)].map((_, j) => (
                                        <div key={j} className="flex-shrink-0 w-48 h-72 bg-gray-700 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-12 md:space-y-16">
                        {CONTENT_CATEGORIES.map((category, categoryIndex) => {
                            const sectionContent = contentSections[category.id] || []

                            if (sectionContent.length === 0) return null

                            return (
                                <div
                                    key={category.id}
                                    className="space-y-4 md:space-y-6 animate-fade-in-up"
                                    style={{ "--stagger": categoryIndex } as React.CSSProperties}
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl md:text-2xl font-bold text-white">
                                            {category.title}
                                        </h2>
                                        <div className="flex items-center space-x-2">
                                            {/* Navigation Buttons - Styled like homepage */}
                                            <button
                                                onClick={() => scrollSection(`${category.id}-container`, "left")}
                                                className="bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
                                                aria-label="Scroll left"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>

                                            <button
                                                onClick={() => scrollSection(`${category.id}-container`, "right")}
                                                className="bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
                                                aria-label="Scroll right"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden">
                                        {/* Content Cards */}
                                        <div
                                            id={`${category.id}-container`}
                                            className="flex space-x-3 md:space-x-6 overflow-x-auto scrollbar-hide scroll-smooth"
                                            style={{
                                                scrollbarWidth: 'none',
                                                msOverflowStyle: 'none'
                                            }}
                                        >
                                            {sectionContent.map((item, index) => (
                                                <div
                                                    key={`${item.id}-${category.id}`}
                                                    className="flex-shrink-0 category-item animate-fade-in-up stagger-animation"
                                                    style={{ "--stagger": index } as React.CSSProperties}
                                                >
                                                    <ContentCard
                                                        item={item}
                                                        type={"title" in item ? "movie" : "tv"}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Footer */}
                <footer className="text-gray-400 py-8 md:py-12 mt-16 text-center animate-fade-in-up">
                    <div className="container mx-auto px-4">
                        <p className="text-sm">
                            Content availability may vary by region and subscription.
                        </p>
                        <p className="mt-2 text-xs">
                            This is a personal project and not affiliated with {serviceConfig.name}.
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    )
} 