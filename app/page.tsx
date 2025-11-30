"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Navbar } from "@/components/Navbar"
import { ContentCard } from "@/components/ContentCard"
import { ContentCardSkeleton } from "@/components/LoadingSkeletons"
import { RefreshCw, Info } from "lucide-react"

// Dynamic imports for heavy non-critical components
const SmartGenreTags = dynamic(() => import("@/components/SmartGenreTags").then(mod => ({ default: mod.SmartGenreTags })), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-24 bg-gray-700 rounded-full" />
            ))}
        </div>
    )
})

const ContinueWatching = dynamic(() => import("@/components/ContinueWatching").then(mod => ({ default: mod.ContinueWatching })), {
    ssr: false,
    loading: () => (
        <div className="py-6 px-6">
            <div className="container mx-auto">
                <div className="h-8 w-48 bg-gray-600 rounded mb-6 animate-pulse" />
                <div className="flex space-x-6 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-48 h-72 bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    )
})

const StreamingServiceHub = dynamic(() => import("@/components/StreamingServiceHub").then(mod => ({ default: mod.StreamingServiceHub })), {
    ssr: false,
    loading: () => (
        <div className="py-6 px-6">
            <div className="container mx-auto">
                <div className="h-8 w-56 bg-gray-600 rounded mb-6 animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    )
})

const Carousel = dynamic(() => import("@/components/home/carousal/carousal").then(mod => ({ default: mod.Carousel })), {
    ssr: false,
    loading: () => (
        <div className="carousel-height rounded-2xl overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700">
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
            <div className="relative z-10 h-full flex items-center">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    <div className="flex flex-col justify-center px-6 lg:px-12 space-y-6">
                        <div className="space-y-4">
                            <div className="h-12 md:h-16 bg-gray-600 rounded-lg animate-pulse skeleton-shimmer" />
                            <div className="flex items-center space-x-4">
                                <div className="h-6 w-16 bg-purple-600 rounded animate-pulse" />
                                <div className="h-6 w-12 bg-gray-600 rounded animate-pulse" />
                                <div className="h-6 w-20 bg-gray-600 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="h-12 w-32 bg-purple-600 rounded-full animate-pulse" />
                            <div className="h-12 w-32 bg-gray-600 rounded-full animate-pulse" />
                        </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center lg:justify-end px-6 lg:px-12">
                        <div className="w-48 md:w-56 lg:w-64 xl:w-80 aspect-[2/3] bg-gray-600 rounded-2xl animate-pulse skeleton-shimmer" />
                    </div>
                </div>
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-2 w-2 bg-gray-500 rounded-full animate-pulse" />
                ))}
            </div>
        </div>
    )
})

const PopularCollections = dynamic(() => import("@/components/PopularCollections").then(mod => ({ default: mod.PopularCollections })), {
    ssr: false,
    loading: () => (
        <div className="container mx-auto px-4 md:px-6 py-6">
            <div className="h-8 w-56 bg-gray-600 rounded mb-6 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-gray-700 rounded-lg animate-pulse" />
                ))}
            </div>
        </div>
    )
})

import { AnimeSection } from "@/components/AnimeSection"

import { TMDBApi, type Movie, type TVShow, type Genre, type Images } from "@/lib/tmdb"
import { useIsMobile } from "@/hooks/use-mobile"

interface MovieWithLogo extends Movie {
    images?: Images & {
        logos: { file_path: string; iso_639_1: string }[]
    }
}

interface TVShowWithLogo extends TVShow {
    images?: Images & {
        logos: { file_path: string; iso_639_1: string }[]
    }
}

type CarouselItem = MovieWithLogo | TVShowWithLogo

export default function HomePage() {
    const [currentTab, setCurrentTab] = useState<"movies" | "shows">("shows")
    const [isLoading, setIsLoading] = useState(true)
    const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
    const [isCarouselAnimating, setIsCarouselAnimating] = useState(false)
    const [top10Items, setTop10Items] = useState<(Movie | TVShow)[]>([])
    const [isLoadingTop10, setIsLoadingTop10] = useState(true)
    const [genres, setGenres] = useState<Genre[]>([])
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
    const [genreResults, setGenreResults] = useState<(Movie | TVShow)[]>([])
    const [categories, setCategories] = useState<{ [key: string]: (Movie | TVShow)[] }>({})
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [loadingStatus, setLoadingStatus] = useState<string>("Initializing...")
    const isMobile = useIsMobile()

    useEffect(() => {
        initializeContent()
    }, [])

    useEffect(() => {
        if (currentTab) {
            refreshContent()
        }
    }, [currentTab])

    const initializeContent = async () => {
        setLoadingStatus("Initializing...")
        setIsLoading(true)

        try {
            // Load critical carousel content first - this is what users see first
            await fetchCarouselContent()

            // Once carousel is ready, turn off the main loader immediately
            setIsLoading(false)
            setLoadingStatus("Carousel loaded")

            // Use requestIdleCallback to defer non-critical content loading
            // This ensures UI remains responsive during heavy loading
            const loadNonCriticalContent = () => {
                Promise.allSettled([
                    fetchTop10Content(),
                    fetchGenres()
                ]).then((results) => {
                    // Log any failures for debugging
                    results.forEach((result, index) => {
                        const names = ['Top 10', 'Genres']
                        if (result.status === 'rejected') {
                            console.error(`Background API call (${names[index]}) failed:`, result.reason)
                        }
                    })
                    setLoadingStatus("Essential content loaded")

                    // Load categories even later using another idle callback
                    const loadCategories = () => {
                        generateCategorySections().then(() => {
                            setLoadingStatus("All content loaded")
                        }).catch((error) => {
                            console.error("Error loading categories:", error)
                            setLoadingStatus("Categories failed to load")
                        })
                    }

                    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                        window.requestIdleCallback(loadCategories, { timeout: 3000 })
                    } else {
                        setTimeout(loadCategories, 500)
                    }
                })
            }

            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                window.requestIdleCallback(loadNonCriticalContent, { timeout: 2000 })
            } else {
                setTimeout(loadNonCriticalContent, 200)
            }
        } catch (error) {
            console.error("Error initializing carousel content:", error)
            setLoadingStatus("Carousel failed to load")
            setIsLoading(false) // Still allow app to render even if carousel fails
        }
    }

    const refreshContent = async () => {
        try {
            await Promise.all([fetchCarouselContent(), fetchTop10Content(), fetchGenres(), generateCategorySections()])
            setSelectedGenre(null)
            setGenreResults([])
        } catch (error) {
            console.error("Error refreshing content:", error)
        }
    }

    const forceRefreshCarousel = async () => {
        // Clear all carousel-related cache and refresh
        setIsCarouselAnimating(true)
        try {
            await fetchCarouselContent()
        } catch (error) {
            console.error("Error refreshing carousel:", error)
        } finally {
            setIsCarouselAnimating(false)
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem('newCarouselMix_v2')
            localStorage.removeItem('randomCarouselCache')
            localStorage.removeItem('aiCarouselCache')
        }
        // Immediately fetch new content
        fetchCarouselContent()
    }

    const fetchCarouselContent = async () => {
        setLoadingStatus("Fetching carousel content...")

        const CACHE_KEY = "newCarouselMix_v2"
        const oneHour = 1 * 60 * 60 * 1000

        // If we have a cached carousel within 1 hour, use it immediately
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem(CACHE_KEY)
                if (cachedRaw) {
                    const cached = JSON.parse(cachedRaw)
                    if (cached?.timestamp && Array.isArray(cached.items) && Date.now() - cached.timestamp < oneHour) {
                        console.log('💾 Using cached new carousel mix')
                        setCarouselItems(cached.items)
                        return
                    }
                }
            } catch (err) {
                console.warn('Failed to parse carousel cache:', err)
            }
        }

        try {
            // Generate ONE random seed for this session
            const randomPage = Math.floor(Math.random() * 10) + 1

            // Make just TWO parallel requests instead of 4+
            const [trendingMovies, trendingTv] = await Promise.all([
                TMDBApi.getPopularMovies(randomPage),
                TMDBApi.getPopularTVShows(randomPage)
            ])

            // Process and mix the results client-side
            const movieItems = trendingMovies.results
                .slice(0, 5)
                .map((item: any) => ({ ...item, type: "movie" }))

            const tvItems = trendingTv.results
                .slice(0, 5)
                .map((item: any) => ({ ...item, type: "tv" }))

            // Combine and shuffle
            const combinedResults = [...movieItems, ...tvItems]
                .sort(() => Math.random() - 0.5)
                .slice(0, 8) // Keep carousel manageable

            // Fetch details only for the final selection
            const detailedItems = await Promise.all(
                combinedResults.map(async (item) => {
                    const type = "title" in item ? "movie" : "tv"
                    const details = type === 'movie'
                        ? await TMDBApi.getMovieDetails(item.id)
                        : await TMDBApi.getTVShowDetails(item.id)
                    return { ...item, ...details }
                })
            )

            setCarouselItems(detailedItems)

            // Cache results
            if (typeof window !== 'undefined') {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    items: detailedItems
                }))
            }
        } catch (error) {
            console.error("Error fetching carousel content:", error)
            setCarouselItems([])
        }
    }

    const fetchTop10Content = async () => {
        setLoadingStatus("Fetching top 10 content...")
        setIsLoadingTop10(true)
        try {
            const data = currentTab === "movies"
                ? await TMDBApi.getPopularMovies(1)
                : await TMDBApi.getPopularTVShows(1)

            setTop10Items(data.results.slice(0, 20))
        } catch (error) {
            console.error("Error fetching top 10 content:", error)
            setTop10Items([])
        } finally {
            setIsLoadingTop10(false)
        }
    }

    const fetchGenres = async () => {
        setLoadingStatus("Fetching genres...")
        try {
            const data = currentTab === "movies"
                ? await TMDBApi.getMovieGenres()
                : await TMDBApi.getTVGenres()

            // Expanded genre list with more variety
            const allGenres = [
                { id: 28, name: "Action" },
                { id: 12, name: "Adventure" },
                { id: 16, name: "Animation" },
                { id: 9999, name: "Anime" }, // Using custom ID for keyword search
                { id: 35, name: "Comedy" },
                { id: 80, name: "Crime" },
                { id: 99, name: "Documentary" },
                { id: 18, name: "Drama" },
                { id: 10751, name: "Family" },
                { id: 14, name: "Fantasy" },
                { id: 36, name: "History" },
                { id: 27, name: "Horror" },
                { id: 10402, name: "Music" },
                { id: 9648, name: "Mystery" },
                { id: 10749, name: "Romance" },
                { id: 878, name: "Sci-Fi" },
                { id: 53, name: "Thriller" },
                { id: 10752, name: "War" },
                { id: 37, name: "Western" },
            ]

            // Filter to only include genres that exist in the API response
            const availableGenres = allGenres.filter((genre) => data.genres.some((apiGenre: any) => apiGenre.id === genre.id))

            setGenres(availableGenres.slice(0, 12)) // Show up to 12 genres
        } catch (error) {
            console.error("Error fetching genres:", error)
            setGenres([])
        }
    }

    const generateCategorySections = async () => {
        setLoadingStatus("Loading category sections...")
        setIsLoadingCategories(true)

        const newCategories: { [key: string]: (Movie | TVShow)[] } = {}

        // Simplify category loading: Fetch fewer categories initially
        // We'll prioritize "Trending" and 2-3 key genres instead of everything at once

        try {
            // 1. Always fetch Trending/Upcoming first (Critical)
            const trendingPromise = currentTab === "movies"
                ? TMDBApi.getUpcomingMovies(1)
                : TMDBApi.getAiringThisMonth(1)

            // 2. Select just 3 random genres instead of fixed list to keep it fresh but light
            // The shuffledOthers logic was good, but we can simplify the execution
            const availableGenres = [
                { id: 28, name: "Action" },
                { id: 35, name: "Comedy" },
                { id: 18, name: "Drama" },
                { id: 10749, name: "Romance" },
                { id: 878, name: "Sci-Fi" },
                { id: 27, name: "Horror" }
            ]

            // Pick 3 random genres
            const selectedGenres = [...availableGenres]
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)

            // Create promises for these specific genres
            const genrePromises = selectedGenres.map(genre => {
                const type = currentTab === "movies" ? "movie" : "tv"
                return TMDBApi.discover({
                    type: type as 'movie' | 'tv',
                    with_genres: genre.id.toString(),
                    page: 1
                }).then(data => ({ name: genre.name, items: data.results?.slice(0, 15) || [] }))
            })

            // Add Anime category specifically for TV Shows (id: 16 for Animation + Japanese origin/keyword)
            // Using keyword 210024 (anime) to be more specific than just Animation genre
            let animePromise = Promise.resolve({ name: "Anime", items: [] as (Movie | TVShow)[] })
            if (currentTab === "shows" || currentTab === "movies") {
                animePromise = TMDBApi.discover({
                    type: currentTab === "movies" ? 'movie' : 'tv',
                    with_keywords: '210024', // Anime keyword
                    sort_by: 'popularity.desc',
                    page: 1
                }).then(data => ({ name: currentTab === "movies" ? "Anime Movies" : "Anime Series", items: data.results?.slice(0, 15) || [] }))
            }

            // Execute all requests in parallel
            const [trendingData, animeData, ...genreData] = await Promise.all([
                trendingPromise,
                animePromise,
                ...genrePromises
            ])

            // Construct categories object
            const trendingTitle = currentTab === "movies" ? "Upcoming Movies" : "Airing This Month"
            if (trendingData.results?.length > 0) {
                newCategories[trendingTitle] = trendingData.results.slice(0, 15)
            }

            // Add Anime category if we have items
            if (animeData.items.length > 0) {
                newCategories[animeData.name] = animeData.items
            }

            genreData.forEach(category => {
                if (category.items.length > 0) {
                    newCategories[category.name] = category.items
                }
            })

            setCategories(newCategories)
        } catch (error) {
            console.error("Error generating category sections:", error)
            setCategories({})
        } finally {
            setIsLoadingCategories(false)
        }
    }

    const selectGenre = async (genre: Genre) => {
        setSelectedGenre(genre.id)
        try {
            const type = currentTab === "movies" ? "movie" : "tv"
            const params: any = {
                type: type as 'movie' | 'tv'
            }

            if (genre.id === 9999) { // Special handling for Anime keyword
                params.with_keywords = '210024'
            } else {
                params.with_genres = genre.id.toString()
            }

            const data = await TMDBApi.discover(params)
            setGenreResults(data.results)
        } catch (error) {
            console.error("Error fetching genre results:", error)
        }
    }

    const scrollSection = (containerId: string, direction: "left" | "right") => {
        const container = document.getElementById(containerId)
        if (!container) return

        // Calculate scroll amount based on container width for smoother scrolling
        const scrollAmount = direction === "left" ? -container.offsetWidth * 0.8 : container.offsetWidth * 0.8
        container.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }

    return (
        <div className="min-h-screen">
            <Navbar showTabSwitcher={true} currentTab={currentTab} onTabChange={setCurrentTab} />

            {/* Loading skeleton or main content */}
            {isLoading ? (
                <>
                    <div className="pt-16 md:pt-24 pb-6 md:pb-8 animate-fade-in-up">
                        <div className="container mx-auto px-4 md:px-6">
                            <div className="relative carousel-height rounded-2xl overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700">
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
                                <div className="relative z-10 h-full flex items-center">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                                        <div className="flex flex-col justify-center px-6 lg:px-12 space-y-6">
                                            <div className="space-y-4">
                                                <div className="h-12 md:h-16 bg-gray-600 rounded-lg animate-pulse skeleton-shimmer" />
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-6 w-16 bg-purple-600 rounded animate-pulse" />
                                                    <div className="h-6 w-12 bg-gray-600 rounded animate-pulse" />
                                                    <div className="h-6 w-20 bg-gray-600 rounded animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="h-12 w-32 bg-purple-600 rounded-full animate-pulse" />
                                                <div className="h-12 w-32 bg-gray-600 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="hidden md:flex items-center justify-center lg:justify-end px-6 lg:px-12">
                                            <div className="w-48 md:w-56 lg:w-64 xl:w-80 aspect-[2/3] bg-gray-600 rounded-2xl animate-pulse skeleton-shimmer" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-2 w-2 bg-gray-500 rounded-full animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="container mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in-up">
                        <div className="text-center mb-6 md:mb-8">
                            <div className="h-8 w-64 bg-gray-600 rounded mx-auto mb-2 animate-pulse skeleton-shimmer" />
                            <div className="h-4 w-96 bg-gray-700 rounded mx-auto animate-pulse skeleton-shimmer" />
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center justify-items-center">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-8 w-24 bg-gray-700 rounded animate-pulse skeleton-shimmer"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Skeleton Footer */}
                    <footer className="text-gray-400 py-3 md:py-6 mt-6 md:mt-12">
                        <div className="container mx-auto px-4 md:px-6 text-center space-y-2">
                            <div className="h-4 w-96 bg-gray-700 rounded mx-auto animate-pulse skeleton-shimmer" />
                            <div className="h-4 w-64 bg-gray-700 rounded mx-auto animate-pulse skeleton-shimmer" />
                            <div className="h-4 w-48 bg-gray-700 rounded mx-auto animate-pulse skeleton-shimmer" />
                        </div>
                    </footer>
                </>
            ) : (
                <>
                    {/* Featured Carousel Section */}
                    <div className="pt-16 md:pt-24 pb-6 md:pb-8 animate-fade-in-up">
                        <div className="container mx-auto px-4 md:px-6">
                            <Carousel
                                items={carouselItems}
                                isLoading={carouselItems.length === 0}
                                onRefresh={forceRefreshCarousel}
                                isAnimating={isCarouselAnimating}
                            />
                        </div>
                    </div>

                    {/* AI-Enhanced Genre Selection */}
                    <div className="py-6 md:py-8 px-4 md:px-6 animate-fade-in-up">
                        <div className="container mx-auto">
                            <SmartGenreTags
                                genres={genres}
                                contentType={currentTab === "movies" ? "movie" : "tv"}
                                selectedGenre={selectedGenre}
                                onGenreSelect={selectGenre}
                                className="justify-center"
                            />
                        </div>
                    </div>

                    {/* Genre Results - Same size as Top 10 with Static Animation */}
                    {selectedGenre && genreResults.length > 0 && (
                        <div className="py-4 md:py-6 px-0 sm:px-1 animate-fade-in-up">
                            <div className="container mx-auto">
                                <div className="flex items-center justify-between mb-6 px-1 sm:px-0">
                                    <h2 className="text-2xl font-bold brand-text ml-1">
                                        {genres.find(g => g.id === selectedGenre)?.name} {currentTab === "movies" ? "Movies" : "TV Shows"}
                                    </h2>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => scrollSection("genreResultsContainer", "left")}
                                            className="section-nav-button prev"
                                            aria-label="Scroll left"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => scrollSection("genreResultsContainer", "right")}
                                            className="section-nav-button next"
                                            aria-label="Scroll right"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedGenre(null)
                                                setGenreResults([])
                                            }}
                                            className="text-gray-400 hover:text-white transition-colors ml-2"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden">
                                    <div
                                        id="genreResultsContainer"
                                        className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
                                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                    >
                                        {genreResults.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className={`flex-shrink-0 category-item animate-fade-in-up stagger-animation`}
                                                style={{ "--stagger": index } as React.CSSProperties}
                                            >
                                                <ContentCard item={item} type={currentTab === "movies" ? "movie" : "tv"} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Continue Watching Section */}
                    <div className="pt-2 md:pt-6">
                        <ContinueWatching
                            isVisible={true}
                            onScrollSection={scrollSection}
                        />
                    </div>

                    {/* Top 10 Section */}
                    <div className="py-1.5 md:py-6 px-0 sm:px-1 animate-fade-in-up">
                        <div className="container mx-auto">
                            <div className="flex items-center justify-between mb-6 px-1 sm:px-0">
                                <h2 className="text-2xl font-bold brand-text ml-1">
                                    Top 20 {currentTab === "movies" ? "Movies" : "TV Shows"} Today
                                </h2>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => scrollSection("top10Container", "left")}
                                        className="section-nav-button prev"
                                        aria-label="Scroll left"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => scrollSection("top10Container", "right")}
                                        className="section-nav-button next"
                                        aria-label="Scroll right"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="relative overflow-hidden">
                                <div
                                    id="top10Container"
                                    className="flex space-x-3 md:space-x-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                >
                                    {isLoadingTop10 ? (
                                        // Show skeleton loading cards
                                        [...Array(20)].map((_, index) => (
                                            <div
                                                key={`skeleton-${index}`}
                                                className="flex-shrink-0 relative top10-item animate-fade-in-up stagger-animation"
                                                style={{ "--stagger": index } as React.CSSProperties}
                                            >
                                                <div className="relative">
                                                    <ContentCardSkeleton />
                                                    <div
                                                        className="absolute left-[-20px] bottom-[-6px] text-gray-600 font-black font-orbitron text-7xl md:text-8xl z-20 pointer-events-none select-none animate-pulse"
                                                        style={{ textShadow: "3px 3px 12px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.9)", WebkitTextStroke: "2px rgba(0,0,0,0.5)" }}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        // Show actual content
                                        top10Items.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className={`flex-shrink-0 relative top10-item animate-fade-in-up stagger-animation`}
                                                style={{ "--stagger": index } as React.CSSProperties}
                                            >
                                                <div className="relative">
                                                    <ContentCard item={item} type={currentTab === "movies" ? "movie" : "tv"} />
                                                    <div
                                                        className="absolute left-[-20px] bottom-[-6px] text-white font-black font-orbitron text-7xl md:text-8xl z-20 pointer-events-none select-none" style={{ textShadow: "3px 3px 12px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.9)", WebkitTextStroke: "2px rgba(0,0,0,0.5)" }}>
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Sections with Static Animation */}
                    <div className="px-0 sm:px-0 py-3 md:py-4 overflow-hidden">
                        {isLoadingCategories ? (
                            // Show skeleton loading for categories
                            [...Array(5)].map((_, categoryIndex) => (
                                <div key={`category-skeleton-${categoryIndex}`} className="category-section container mx-auto mb-8 animate-fade-in-up">
                                    <div className="flex items-center justify-between mb-6 px-1 sm:px-0">
                                        <div className="h-8 w-48 bg-gray-600 rounded animate-pulse skeleton-shimmer" />
                                        <div className="flex space-x-2">
                                            <div className="w-8 h-8 bg-gray-600 rounded animate-pulse" />
                                            <div className="w-8 h-8 bg-gray-600 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="relative overflow-hidden">
                                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide scroll-smooth category-container" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                                            {[...Array(8)].map((_, index) => (
                                                <div
                                                    key={`skeleton-card-${index}`}
                                                    className="flex-shrink-0 category-item animate-fade-in-up stagger-animation"
                                                    style={{ "--stagger": index } as React.CSSProperties}
                                                >
                                                    <ContentCardSkeleton />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Show actual category content
                            Object.entries(categories).map(([categoryName, items], categoryIndex) => {
                                if (categoryName === "Anime" || categoryName === "Anime Movies" || categoryName === "Anime Series") {
                                    return (
                                        <AnimeSection
                                            key={categoryName}
                                            title={categoryName}
                                            items={items}
                                            type={currentTab === "movies" ? "movie" : "tv"}
                                        />
                                    )
                                }
                                return (
                                    <React.Fragment key={categoryName}>
                                        <div className="category-section container mx-auto mb-8 animate-fade-in-up">
                                            <div className="flex items-center justify-between mb-6 px-1 sm:px-0">
                                                <h2 className="text-2xl font-bold brand-text ml-1">{categoryName}</h2>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => scrollSection(`category-${categoryName.replace(/\s+/g, "")}`, "left")}
                                                        className="section-nav-button prev"
                                                        aria-label="Scroll left"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => scrollSection(`category-${categoryName.replace(/\s+/g, "")}`, "right")}
                                                        className="section-nav-button next"
                                                        aria-label="Scroll right"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="relative overflow-hidden">
                                                <div
                                                    id={`category-${categoryName.replace(/\s+/g, "")}`}
                                                    className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide scroll-smooth category-container"
                                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                                >
                                                    {items.map((item, index) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex-shrink-0 category-item animate-fade-in-up stagger-animation"
                                                            style={{ "--stagger": index } as React.CSSProperties}
                                                        >
                                                            <ContentCard
                                                                item={item}
                                                                type={currentTab === "movies" ? "movie" : "tv"}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Insert Streaming Service Hubs after Romance category */}
                                        {categoryName === "Romance" && (
                                            <StreamingServiceHub
                                                currentTab={currentTab}
                                                visibleSections={new Set()} // No longer using observer
                                                observeSection={() => { }} // No longer using observer
                                                scrollSection={scrollSection}
                                            />
                                        )}
                                    </React.Fragment>
                                )
                            })
                        )}
                    </div>

                    {/* Popular Collections Section - Only for Movies (moved near bottom) */}
                    {currentTab === "movies" && (
                        <div className="px-0 sm:px-0 pb-3 md:pb-6">
                            <PopularCollections currentTab={currentTab} />
                        </div>
                    )}

                    {/* Footer */}
                    <footer className="text-gray-400 py-3 md:py-6 mt-6 md:mt-12 animate-fade-in-up">
                        <div className="container mx-auto px-4 md:px-6 text-center">
                            <p className="text-xs md:text-sm">
                                All rules and regulations of the respective streaming platforms apply. <br />
                                This is a personal project and not affiliated with any streaming service.
                            </p>
                            <p className="mt-2 text-xs">Made with Next.js, Tailwind CSS, and TMDB API.</p>

                        </div>
                    </footer>
                </>
            )}
        </div>
    )
}