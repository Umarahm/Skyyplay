"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Navbar } from "@/components/Navbar"
import { ContentCard } from "@/components/ContentCard"
import { SmartGenreTags } from "@/components/SmartGenreTags"
import { ContinueWatching } from "@/components/ContinueWatching"
import { WatchlistButton } from "@/components/WatchlistButton"
import { StreamingServiceHub } from "@/components/StreamingServiceHub"
import { RefreshCw, Info } from "lucide-react"

import { type Movie, type TVShow, type Genre, type Images } from "@/lib/tmdb"
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

// Lazy load poster images in the carousel only when at least 50% of the element is visible
function LazyPoster({
    src,
    alt,
    className,
    imgClassName,
}: {
    src: string
    alt: string
    className?: string
    imgClassName?: string
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!ref.current || typeof IntersectionObserver === "undefined") return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        setVisible(true)
                        observer.disconnect()
                    }
                })
            },
            { threshold: 0.5 },
        )

        observer.observe(ref.current)

        return () => observer.disconnect()
    }, [])

    return (
        <div ref={ref} className={className}>
            {visible ? (
                <img
                    src={src}
                    alt={alt}
                    className={imgClassName ?? "w-full h-full object-cover"}
                    loading="eager"
                    onError={(e) => {
                        ; (e.target as HTMLImageElement).src = "/logo.avif"
                    }}
                />
            ) : (
                <div className="w-full h-full bg-gray-800 animate-pulse" />
            )}
        </div>
    )
}

export default function HomePage() {
    const [currentTab, setCurrentTab] = useState<"movies" | "shows">("shows")
    const [isLoading, setIsLoading] = useState(true)
    const [carouselItems, setCarouselItems] = useState<(MovieWithLogo | TVShowWithLogo)[]>([])
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
    const [top10Items, setTop10Items] = useState<(Movie | TVShow)[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
    const [genreResults, setGenreResults] = useState<(Movie | TVShow)[]>([])
    const [categories, setCategories] = useState<{ [key: string]: (Movie | TVShow)[] }>({})
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
    const [isCarouselAnimating, setIsCarouselAnimating] = useState(false)
    const [loadingStatus, setLoadingStatus] = useState<string>("Initializing...")
    const isMobile = useIsMobile()

    const observerRef = useRef<IntersectionObserver | null>(null)
    const carouselRef = useRef<HTMLDivElement | null>(null)
    const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const carouselAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        initializeContent()
        setupScrollAnimations()

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
            if (carouselAnimationTimeoutRef.current) {
                clearTimeout(carouselAnimationTimeoutRef.current)
            }
        }
    }, [])



    useEffect(() => {
        if (carouselItems.length > 0 && !isCarouselAnimating) {
            const timer = setTimeout(() => {
                nextCarouselSlide()
            }, 10000)
            return () => clearTimeout(timer)
        }
    }, [currentCarouselIndex, isCarouselAnimating, carouselItems])

    useEffect(() => {
        if (currentTab) {
            refreshContent()
        }
    }, [currentTab])

    const setupScrollAnimations = () => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.getAttribute("data-section")
                        if (sectionId) {
                            setVisibleSections((prev) => new Set([...prev, sectionId]))
                        }
                    }
                })
            },
            { threshold: 0.1, rootMargin: "50px" },
        )
    }

    const observeSection = (element: HTMLElement | null, sectionId: string) => {
        if (element && observerRef.current) {
            element.setAttribute("data-section", sectionId)
            observerRef.current.observe(element)
        }
    }

    const initializeContent = async () => {
        setLoadingStatus("Initializing...")
        setIsLoading(true)

        try {
            // Load critical carousel content first
            await fetchCarouselContent()

            // Once carousel is ready, turn off the main loader
            setIsLoading(false)

            // Load other content in background without blocking render
            setTimeout(() => {
                Promise.allSettled([
                    fetchTop10Content(),
                    fetchGenres(),
                    generateCategorySections()
                ]).then((results) => {
                    // Log any failures for debugging
                    results.forEach((result, index) => {
                        if (result.status === 'rejected') {
                            console.error(`Background API call ${index} failed:`, result.reason)
                        }
                    })
                    setLoadingStatus("All content loaded")
                })
            }, 100)
        } catch (error) {
            console.error("Error initializing content:", error)
            setLoadingStatus("Initialization completed with errors")
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
            setCurrentCarouselIndex(0) // Reset to first slide
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

        const CACHE_KEY = "newCarouselMix_v2" // Changed cache key to force refresh
        const oneHour = 1 * 60 * 60 * 1000 // Reduced to 1 hour for testing

        // If we have a cached carousel within 1 hour, use it immediately
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem(CACHE_KEY)
                if (cachedRaw) {
                    const cached = JSON.parse(cachedRaw)
                    if (cached?.timestamp && Array.isArray(cached.items) && Date.now() - cached.timestamp < oneHour) {
                        console.log('💾 Using cached new carousel mix')
                        setCarouselItems(cached.items)
                        // Start auto-rotation and skip remote fetch
                        startCarouselAutoRotation()
                        return
                    }
                }
            } catch (err) {
                console.warn('Failed to parse carousel cache:', err)
            }
        }

        try {
            console.log('🎲 Fetching new carousel composition: 3 movies + 3 TV shows + 1 talk show + 1 anime')

            // Generate random pages for different content types
            const randomMoviePage = Math.floor(Math.random() * 100) + 1 // Movies: pages 1-100
            const randomTVPage = Math.floor(Math.random() * 100) + 1 // TV shows: pages 1-100
            const randomTalkShowPage = Math.floor(Math.random() * 20) + 1 // Talk shows: pages 1-20
            const randomAnimePage = Math.floor(Math.random() * 50) + 1 // Anime: pages 1-50

            // Different sort orders for variety
            const sortOptions = ['popularity.desc', 'vote_average.desc', 'release_date.desc']
            const movieSort = sortOptions[Math.floor(Math.random() * sortOptions.length)]
            const tvSort = sortOptions[Math.floor(Math.random() * sortOptions.length)]
            const talkShowSort = sortOptions[Math.floor(Math.random() * sortOptions.length)]
            const animeSort = sortOptions[Math.floor(Math.random() * sortOptions.length)]

            // Fetch different content types in parallel
            const [movieResponse, tvResponse, talkShowResponse, animeResponse] = await Promise.all([
                // 3 Movies - recent/popular with good ratings
                fetch(`/api/tmdb/discover?type=movie&page=${randomMoviePage}&sort_by=${movieSort}&vote_count.gte=200&vote_average.gte=6.0&primary_release_date.gte=2020-01-01`, {
                    cache: 'no-store'
                }),
                // 3 TV Shows - excluding talk shows (genre 10767)
                fetch(`/api/tmdb/discover?type=tv&page=${randomTVPage}&sort_by=${tvSort}&vote_count.gte=100&vote_average.gte=6.5&without_genres=10767&first_air_date.gte=2020-01-01`, {
                    cache: 'no-store'
                }),
                // 1 Talk Show - specifically genre 10767
                fetch(`/api/tmdb/discover?type=tv&page=${randomTalkShowPage}&sort_by=${talkShowSort}&with_genres=10767&vote_count.gte=50`, {
                    cache: 'no-store'
                }),
                // 1 Anime - animation genre with Japanese origin
                fetch(`/api/tmdb/discover?type=tv&page=${randomAnimePage}&sort_by=${animeSort}&with_genres=16&with_origin_country=JP&vote_count.gte=100&vote_average.gte=7.0`, {
                    cache: 'no-store'
                })
            ])

            // Check if responses are ok before processing
            if (!movieResponse.ok || !tvResponse.ok || !talkShowResponse.ok || !animeResponse.ok) {
                console.error('API responses not ok:', {
                    movies: movieResponse.status,
                    tv: tvResponse.status,
                    talkShows: talkShowResponse.status,
                    anime: animeResponse.status
                })
                // Set fallback data instead of throwing
                setCarouselItems([])
                return
            }

            const [movieData, tvData, talkShowData, animeData] = await Promise.all([
                movieResponse.json(),
                tvResponse.json(),
                talkShowResponse.json(),
                animeResponse.json()
            ])

            // Select items randomly from each category
            const movieItems = movieData.results
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map((item: any) => ({ ...item, type: "movie", category: "movie" }))

            const tvItems = tvData.results
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map((item: any) => ({ ...item, type: "tv", category: "tv" }))

            const talkShowItems = talkShowData.results
                .sort(() => Math.random() - 0.5)
                .slice(0, 1)
                .map((item: any) => ({ ...item, type: "tv", category: "talk-show" }))

            const animeItems = animeData.results
                .sort(() => Math.random() - 0.5)
                .slice(0, 1)
                .map((item: any) => ({ ...item, type: "tv", category: "anime" }))

            // Combine all items and shuffle them randomly for final carousel order
            const combinedResults = [...movieItems, ...tvItems, ...talkShowItems, ...animeItems]
                .sort(() => Math.random() - 0.5) // Final random shuffle

            console.log('🎲 New Carousel composition fetched:', {
                movies: movieItems.length,
                tvShows: tvItems.length,
                talkShows: talkShowItems.length,
                anime: animeItems.length,
                total: combinedResults.length,
                movieTitles: movieItems.map((m: any) => m.title),
                tvTitles: tvItems.map((t: any) => t.name),
                talkShowTitles: talkShowItems.map((t: any) => t.name),
                animeTitles: animeItems.map((a: any) => a.name)
            })

            // Fetch details with logos for each item
            const detailedItems = await Promise.all(
                combinedResults.map(async (item) => {
                    const type = "title" in item ? "movie" : "tv"
                    const response = await fetch(`/api/tmdb/${type === 'movie' ? 'movies' : 'tv'}/${item.id}?append_to_response=images`)
                    const details = await response.json()
                    return { ...item, ...details }
                })
            )

            setCarouselItems(detailedItems)

            // Cache the random results
            if (typeof window !== 'undefined') {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    items: detailedItems
                }))
            }

            // Start carousel auto-rotation after setting items
            if (detailedItems.length > 0) {
                startCarouselAutoRotation()
            }
        } catch (error) {
            console.error("Error fetching carousel content:", error)
            // Set empty array as fallback instead of throwing
            setCarouselItems([])
        }
    }

    const fetchTop10Content = async () => {
        setLoadingStatus("Fetching top 10 content...")
        try {
            const endpoint = currentTab === "movies" ? '/api/tmdb/movies/popular?page=1' : '/api/tmdb/tv/popular?page=1'
            const response = await fetch(endpoint)

            if (!response.ok) {
                console.error('Top 10 API response not ok:', response.status)
                setTop10Items([])
                return
            }

            const data = await response.json()
            setTop10Items(data.results.slice(0, 10))
        } catch (error) {
            console.error("Error fetching top 10 content:", error)
            setTop10Items([])
        }
    }

    const fetchGenres = async () => {
        setLoadingStatus("Fetching genres...")
        try {
            const type = currentTab === "movies" ? "movie" : "tv"
            const response = await fetch(`/api/tmdb/genres?type=${type}`)

            if (!response.ok) {
                console.error('Genres API response not ok:', response.status)
                setGenres([])
                return
            }

            const data = await response.json()

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

        const newCategories: { [key: string]: (Movie | TVShow)[] } = {}

        // Add special sections based on current tab
        if (currentTab === "movies") {
            // Add "Upcoming Movies" section for movies
            try {
                const upcomingResponse = await fetch('/api/tmdb/movies/upcoming?page=1')
                if (upcomingResponse.ok) {
                    const upcomingData = await upcomingResponse.json()
                    if (upcomingData.results && upcomingData.results.length > 0) {
                        newCategories["Upcoming Movies"] = upcomingData.results.slice(0, 20)
                    }
                }
            } catch (error) {
                console.error('Error fetching upcoming movies:', error)
            }
        } else {
            // Add "Airing This Month" section for TV shows
            try {
                const airingResponse = await fetch('/api/tmdb/tv/airing-this-month?page=1')
                if (airingResponse.ok) {
                    const airingData = await airingResponse.json()
                    if (airingData.results && airingData.results.length > 0) {
                        newCategories["Airing This Month"] = airingData.results.slice(0, 20)
                    }
                }
            } catch (error) {
                console.error('Error fetching airing TV shows:', error)
            }
        }

        // Always include Romance and Drama, then fill the rest deterministically up to a max of 5 more (total 6 sections)
        const baseGenres = [
            { id: 10749, name: "Romance" },
            { id: 18, name: "Drama" },
        ]

        const otherGenres = [
            { id: 28, name: "Action" },
            { id: 35, name: "Comedy" },
            { id: 27, name: "Horror" },
            { id: 12, name: "Adventure" },
            { id: 14, name: "Fantasy" },
            { id: 878, name: "Science Fiction" },
            { id: 9648, name: "Mystery" },
            { id: 53, name: "Thriller" },
        ]

        // Deterministic shuffle for the remaining genres to keep UI consistency
        const shuffledOthers = [...otherGenres]
            .sort((a, b) => {
                const hashA = (a.id * 23 + 7) % 1000
                const hashB = (b.id * 23 + 7) % 1000
                return hashA - hashB
            })
            .slice(0, 3) // Pick 3 more to make total of 5 genre sections + 1 special section = 6 total

        const categoryGenres = [...baseGenres, ...shuffledOthers]

        for (const genre of categoryGenres) {
            try {
                const type = currentTab === "movies" ? "movie" : "tv"
                const response = await fetch(`/api/tmdb/discover?type=${type}&with_genres=${genre.id}`)

                if (!response.ok) {
                    console.error(`Category API response not ok for ${genre.name}:`, response.status)
                    continue // Skip this genre instead of failing completely
                }

                const data = await response.json()

                if (data.results && data.results.length > 0) {
                    // Use first 20 results directly from TMDB
                    newCategories[genre.name] = data.results.slice(0, 20)
                }
            } catch (error) {
                console.error(`Error fetching ${genre.name} content:`, error)
                // Continue with other genres instead of failing completely
            }
        }

        setCategories(newCategories)
    }

    const selectGenre = async (genre: Genre) => {
        setSelectedGenre(genre.id)
        try {
            const type = currentTab === "movies" ? "movie" : "tv"
            const params = new URLSearchParams({ type })
            if (genre.id === 9999) { // Special handling for Anime keyword
                params.set('with_keywords', '210024')
            } else {
                params.set('with_genres', genre.id.toString())
            }

            const response = await fetch(`/api/tmdb/discover?${params.toString()}`)
            const data = await response.json()

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

    // Enhanced carousel navigation with animations matching the HTML reference
    const goToCarouselSlide = (index: number) => {
        if (index === currentCarouselIndex) return

        // Clear any existing animation timeout to prevent conflicts
        if (carouselAnimationTimeoutRef.current) {
            clearTimeout(carouselAnimationTimeoutRef.current)
        }

        setIsCarouselAnimating(true)
        setCurrentCarouselIndex(index)

        // Reset animation state after animation completes
        carouselAnimationTimeoutRef.current = setTimeout(() => {
            setIsCarouselAnimating(false)
        }, 800)
    }

    const nextCarouselSlide = () => {
        if (carouselItems.length === 0) return
        const nextIndex = (currentCarouselIndex + 1) % carouselItems.length
        goToCarouselSlide(nextIndex)
    }

    const prevCarouselSlide = () => {
        if (carouselItems.length === 0) return
        const prevIndex = (currentCarouselIndex - 1 + carouselItems.length) % carouselItems.length
        goToCarouselSlide(prevIndex)
    }

    // Start auto-rotation for carousel - This will be handled by useEffect now
    const startCarouselAutoRotation = () => {
        // This function can be removed or left empty as useEffect handles the logic now.
        // For safety, we can clear any lingering timers if it's called from old code paths.
        if (carouselIntervalRef.current) {
            clearInterval(carouselIntervalRef.current)
        }
    }

    const currentCarouselItem = carouselItems[currentCarouselIndex] || null

    // Framer Motion Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut" as const,
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 30,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut" as const
            }
        }
    }

    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.9
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.4,
                ease: "easeOut" as const
            }
        }
    }

    const staggerContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    }

    const sectionVariants = {
        hidden: {
            opacity: 0,
            y: 50
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut" as const
            }
        }
    }

    const carouselVariants = {
        hidden: {
            opacity: 0,
            y: 100,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring" as const,
                damping: 25,
                stiffness: 300,
                duration: 0.8
            }
        }
    }

    return (
        <div className="min-h-screen">
            <Navbar showTabSwitcher={true} currentTab={currentTab} onTabChange={setCurrentTab} />

            {/* Skeleton Carousel */}
            {isLoading ? (
                <>
                    <div className="pt-24 pb-8 animate-fade-in-up">
                        <div className="container mx-auto px-4">
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
                                {/* Skeleton dots */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-2 w-2 bg-gray-500 rounded-full animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skeleton Genre Pills */}
                    <div className="py-8 px-4 animate-fade-in-up">
                        <div className="container mx-auto">
                            <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
                                {[...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-shrink-0 h-10 w-24 bg-gray-700 rounded-full animate-pulse skeleton-shimmer"
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Skeleton Top 10 */}
                    <div className="py-6 px-0 sm:px-6 animate-fade-in-up">
                        <div className="container mx-auto">
                            <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
                                <div className="h-8 w-48 bg-gray-600 rounded animate-pulse skeleton-shimmer" />
                            </div>
                            <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="flex-shrink-0 relative">
                                        <div
                                            className="w-[156px] h-[222px] md:w-[208px] md:h-[296px] bg-gray-700 rounded-xl animate-pulse skeleton-shimmer"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        />
                                        <div className="absolute left-[-20px] bottom-[-6px] text-white font-black font-orbitron text-7xl md:text-8xl z-20 pointer-events-none select-none" style={{ textShadow: "3px 3px 12px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.9)", WebkitTextStroke: "2px rgba(0,0,0,0.5)" }}>
                                            {i + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Skeleton Category Sections */}
                    <div className="px-0 sm:px-6 py-4">
                        {[...Array(4)].map((_, categoryIndex) => (
                            <div key={categoryIndex} className="container mx-auto mb-8">
                                <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
                                    <div className="h-6 w-32 bg-gray-600 rounded animate-pulse skeleton-shimmer" />
                                </div>
                                <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="flex-shrink-0">
                                            <div
                                                className="w-[156px] h-[222px] md:w-[208px] md:h-[296px] bg-gray-700 rounded-lg animate-pulse skeleton-shimmer"
                                                style={{ animationDelay: `${i * 0.05}s` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Skeleton Streaming Services */}
                    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 animate-fade-in-up">
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
                    <footer className="text-gray-400 py-4 md:py-6 mt-8 md:mt-12">
                        <div className="container mx-auto px-4 md:px-6 text-center space-y-2">
                            <div className="h-4 w-96 bg-gray-700 rounded mx-auto animate-pulse skeleton-shimmer" />
                            <div className="h-4 w-64 bg-gray-700 rounded mx-auto animate-pulse skeleton-shimmer" />
                            <div className="h-4 w-48 bg-gray-700 rounded mx-auto animate-pulse skeleton-shimmer" />
                        </div>
                    </footer>
                </>
            ) : (
                <>
                    {/* Featured Carousel Section with Enhanced Animations */}
                    <motion.div
                        className="pt-24 pb-8"
                        variants={carouselVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="container mx-auto px-4">
                            <div
                                className="relative carousel-height rounded-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500/30 transition-all duration-300"
                                ref={carouselRef}
                            >
                                {carouselItems.length > 0 ? (
                                    <>
                                        {/* Background Image with Overlay */}
                                        <div className="absolute inset-0">
                                            {carouselItems.map((item, index) => (
                                                <div
                                                    key={`bg-${item.id}`}
                                                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentCarouselIndex ? "opacity-100" : "opacity-0"
                                                        }`}
                                                >
                                                    <div className="absolute inset-0 overflow-hidden">
                                                        <Image
                                                            src={item.backdrop_path
                                                                ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
                                                                : item.poster_path
                                                                    ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
                                                                    : "/logo.avif"
                                                            }
                                                            alt={`${("title" in item ? item.title : item.name)} background`}
                                                            fill
                                                            className="object-cover md:blur-sm opacity-40 scale-110"
                                                            priority={index === 0}
                                                            quality={60}
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                                                            placeholder="blur"
                                                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+i"
                                                            loading={index === 0 ? "eager" : "lazy"}
                                                        />
                                                    </div>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20 md:to-black/40" />
                                                    {/* Mobile-specific overlays to match the reference image */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent md:hidden" />
                                                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* AI Pick Badge or Refresh Button */}
                                        <div className="absolute top-4 left-4 z-20">
                                            {(currentCarouselItem as any)?.isAIPick ? (
                                                <div className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>AI Pick</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        forceRefreshCarousel()
                                                    }}
                                                    disabled={isCarouselAnimating}
                                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2 bg-gray-800/90 text-gray-300 border border-gray-600 hover:bg-gray-700/90 hover:text-white hover:border-gray-500 active:scale-95 ${isCarouselAnimating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    title="Refresh carousel content"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${isCarouselAnimating ? 'animate-spin' : ''}`} />
                                                    <span>Refresh</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Content Container */}
                                        <div className="relative z-10 h-full">
                                            {carouselItems.map((item, index) => (
                                                <div
                                                    key={`content-${item.id}`}
                                                    className={`absolute inset-0 flex items-center transition-all duration-800 ease-in-out ${index === currentCarouselIndex ? "opacity-100" : "opacity-0"
                                                        }`}
                                                >
                                                    <div
                                                        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 w-full h-full cursor-pointer"
                                                        onClick={() =>
                                                            (window.location.href = `/watch?id=${item.id}&type=${"title" in item ? "movie" : "tv"}`)
                                                        }
                                                    >
                                                        {/* Left Content */}
                                                        <div
                                                            className={`flex flex-col justify-end pb-16 md:justify-center md:pb-0 px-4 md:px-6 lg:px-12 space-y-4 md:space-y-6 ${index === currentCarouselIndex ? "animate-slide-in-left" : ""
                                                                }`}
                                                        >
                                                            <div className="space-y-4">
                                                                <AnimatePresence mode="wait">
                                                                    {(() => {
                                                                        const logo = item.images?.logos?.find(l => l.iso_639_1 === 'en' && l.file_path.endsWith('.svg')) || item.images?.logos?.find(l => l.iso_639_1 === 'en');
                                                                        if (logo) {
                                                                            return (
                                                                                <motion.div
                                                                                    key={`${item.id}-logo-wrapper`}
                                                                                    className="h-16 md:h-20 lg:h-24"
                                                                                    initial={{ opacity: 0, y: 20 }}
                                                                                    animate={{ opacity: 1, y: 0 }}
                                                                                    exit={{ opacity: 0, y: -20 }}
                                                                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                                                                >
                                                                                    <img
                                                                                        src={`https://image.tmdb.org/t/p/w500${logo.file_path}`}
                                                                                        alt={`${"title" in item ? item.title : item.name} logo`}
                                                                                        className="h-full object-contain object-left hidden md:block"
                                                                                    />
                                                                                    <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight carousel-animate-slide md:hidden flex items-center justify-center h-full text-center">
                                                                                        {"title" in item ? item.title : item.name}
                                                                                    </h1>
                                                                                </motion.div>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <motion.h1
                                                                                key={`${item.id}-title`}
                                                                                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight carousel-animate-slide h-16 md:h-20 lg:h-24 flex items-center"
                                                                                initial={{ opacity: 0, y: 20 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                exit={{ opacity: 0, y: -20 }}
                                                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                                                            >
                                                                                {"title" in item ? item.title : item.name}
                                                                            </motion.h1>
                                                                        );
                                                                    })()}
                                                                </AnimatePresence>
                                                                <div
                                                                    className="flex items-center space-x-4 text-gray-300 carousel-animate-fade carousel-meta"
                                                                    style={{ animationDelay: "0.2s" }}
                                                                >
                                                                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm font-medium">
                                                                        {"title" in item ? "MOVIE" : "TV SERIES"}
                                                                    </span>
                                                                    <span>
                                                                        {new Date(
                                                                            "release_date" in item ? item.release_date : item.first_air_date,
                                                                        ).getFullYear()}
                                                                    </span>
                                                                    <div className="flex items-center space-x-1">
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            className="h-4 w-4 text-yellow-400"
                                                                            viewBox="0 0 20 20"
                                                                            fill="currentColor"
                                                                        >
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                        <span>{item.vote_average.toFixed(1)}</span>
                                                                    </div>
                                                                </div>


                                                            </div>

                                                            {/* carousel buttons section */}
                                                            <div
                                                                className="flex flex-col sm:flex-row gap-3 md:gap-4 carousel-buttons carousel-animate-fade relative z-30"
                                                                style={{ animationDelay: "0.4s" }}
                                                                onClick={(e) => e.stopPropagation()} // Prevent triggering parent click
                                                            >
                                                                <button
                                                                    className="brand-gradient text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] active:scale-95 font-medium btn-animated text-sm md:text-base"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        window.location.href = `/watch?id=${item.id}&type=${"title" in item ? "movie" : "tv"}`
                                                                    }}
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        className="h-5 w-5"
                                                                        viewBox="0 0 20 20"
                                                                        fill="currentColor"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                    <span>Watch</span>
                                                                </button>
                                                                <div
                                                                    className="flex items-center justify-center"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            window.location.href = `/info?id=${item.id}&type=${"title" in item ? "movie" : "tv"}`
                                                                        }}
                                                                        className={`${isMobile ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'} rounded-lg bg-gray-800/90 hover:bg-gray-700/90 border border-gray-600/50 backdrop-filter backdrop-blur-sm text-white transition-all duration-200 hover:scale-110 hover:shadow-[0_0_15px_rgba(147,51,234,0.4)] active:scale-95 flex items-center justify-center`}
                                                                        title="View details"
                                                                    >
                                                                        <Info className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right Poster */}
                                                        <div
                                                            className={`hidden md:flex items-center justify-center lg:justify-end px-2 md:px-4 lg:px-12 ${index === currentCarouselIndex ? "animate-slide-in-right" : ""
                                                                }`}
                                                        >
                                                            <LazyPoster
                                                                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/logo.avif"}
                                                                alt="Featured Content"
                                                                className="w-48 md:w-56 lg:w-64 xl:w-80 aspect-[2/3] rounded-xl md:rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 group-hover:scale-105"
                                                                imgClassName="w-full h-full object-cover carousel-animate-in"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Carousel Controls Container */}
                                        <div className="absolute bottom-4 md:bottom-6 left-4 right-4 z-20 flex items-center justify-between">
                                            {/* Pagination "Pills" */}
                                            <div className="flex items-center space-x-2">
                                                {carouselItems.map((_, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => goToCarouselSlide(index)}
                                                        className={`carousel-pagination-btn h-1 rounded-sm transition-all duration-300 ${index === currentCarouselIndex ? 'bg-white w-4 sm:w-5 md:w-6' : 'bg-white/40 w-2 sm:w-3 md:w-4 hover:bg-white/70'} ${isCarouselAnimating ? 'opacity-50' : ''}`}
                                                        aria-label={`Go to slide ${index + 1}`}
                                                        aria-current={index === currentCarouselIndex ? 'true' : 'false'}
                                                    />
                                                ))}
                                            </div>

                                            {/* Navigation Arrows */}
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={prevCarouselSlide}
                                                    className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${isCarouselAnimating ? 'opacity-50' : ''}`}
                                                    aria-label="Previous slide"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 md:h-6 md:w-6"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={nextCarouselSlide}
                                                    className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${isCarouselAnimating ? 'opacity-50' : ''}`}
                                                    aria-label="Next slide"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 md:h-6 md:w-6"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // Show minimal placeholder while carousel loads
                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
                                        <div className="relative z-10 h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-16 h-16 mx-auto mb-4 animate-spin">
                                                    <img src="/logo.avif" alt="Loading" className="w-full h-full object-contain" />
                                                </div>
                                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white">SkyyPlay</h1>
                                                <p className="text-gray-300 mt-2">Loading amazing content...</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* AI-Enhanced Genre Selection */}
                    <motion.div
                        className="py-8 px-4"
                        ref={(el) => observeSection(el, "genres")}
                        variants={sectionVariants}
                        initial="hidden"
                        animate={visibleSections.has("genres") ? "visible" : "hidden"}
                        transition={{ duration: 0.6, ease: "easeOut" as const }}
                    >
                        <div className="container mx-auto">
                            <SmartGenreTags
                                genres={genres}
                                contentType={currentTab === "movies" ? "movie" : "tv"}
                                selectedGenre={selectedGenre}
                                onGenreSelect={selectGenre}
                                className="justify-center"
                            />
                        </div>
                    </motion.div>

                    {/* Continue Watching Section */}
                    <div ref={(el) => observeSection(el, "continue-watching")}>
                        <ContinueWatching
                            isVisible={visibleSections.has("continue-watching")}
                            onScrollSection={scrollSection}
                        />
                    </div>

                    {/* Genre Results - Same size as Top 10 with Scroll Animation */}
                    {selectedGenre && genreResults.length > 0 && (
                        <motion.div
                            className="py-6 px-4"
                            ref={(el) => observeSection(el, "genre-results")}
                            variants={sectionVariants}
                            initial="hidden"
                            animate={visibleSections.has("genre-results") ? "visible" : "hidden"}
                            transition={{ duration: 0.6, ease: "easeOut" as const }}
                        >
                            <div className="container mx-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold brand-text">
                                        {genres.find((g) => g.id === selectedGenre)?.name} {currentTab === "movies" ? "Movies" : "TV Shows"}
                                    </h2>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => scrollSection("genreResultsContainer", "left")}
                                            className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20`}
                                            aria-label="Scroll left"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => scrollSection("genreResultsContainer", "right")}
                                            className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20`}
                                            aria-label="Scroll right"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden">
                                    <motion.div
                                        id="genreResultsContainer"
                                        className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth"
                                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                        variants={staggerContainerVariants}
                                        initial="hidden"
                                        animate={visibleSections.has("genre-results") ? "visible" : "hidden"}
                                    >
                                        {genreResults.slice(0, 18).map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                className="flex-shrink-0"
                                                variants={cardVariants}
                                            >
                                                <ContentCard item={item} type={currentTab === "movies" ? "movie" : "tv"} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Top 10 Section with Scroll Animation */}
                    <motion.div
                        className="py-6 px-0 sm:px-6"
                        ref={(el) => observeSection(el, "top10")}
                        variants={sectionVariants}
                        initial="hidden"
                        animate={visibleSections.has("top10") ? "visible" : "hidden"}
                        transition={{ duration: 0.6, ease: "easeOut" as const }}
                    >
                        <div className="container mx-auto">
                            <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
                                <h2 className="text-2xl font-bold brand-text">
                                    Top 10 {currentTab === "movies" ? "Movies" : "TV Shows"} Today
                                </h2>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => scrollSection("top10Container", "left")}
                                        className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20`}
                                        aria-label="Scroll left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => scrollSection("top10Container", "right")}
                                        className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20`}
                                        aria-label="Scroll right"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="relative overflow-hidden">
                                <motion.div
                                    id="top10Container"
                                    className="flex space-x-6 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                    variants={staggerContainerVariants}
                                    initial="hidden"
                                    animate={visibleSections.has("top10") ? "visible" : "hidden"}
                                >
                                    {top10Items.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            className="flex-shrink-0 relative top10-item"
                                            variants={cardVariants}
                                        >
                                            <div className="relative">
                                                <ContentCard item={item} type={currentTab === "movies" ? "movie" : "tv"} />
                                                <div
                                                    className="absolute left-[-20px] bottom-[-6px] text-white font-black font-orbitron text-7xl md:text-8xl z-20 pointer-events-none select-none" style={{ textShadow: "3px 3px 12px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.9)", WebkitTextStroke: "2px rgba(0,0,0,0.5)" }}>
                                                    {index + 1}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Category Sections with Scroll Animation */}
                    <div className="px-0 sm:px-6 py-4 overflow-hidden">
                        {Object.entries(categories).map(([categoryName, items], categoryIndex) => (
                            <React.Fragment key={categoryName}>
                                <motion.div
                                    className="category-section container mx-auto mb-8"
                                    ref={(el) => observeSection(el, `category-${categoryIndex}`)}
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate={visibleSections.has(`category-${categoryIndex}`) ? "visible" : "hidden"}
                                    transition={{ duration: 0.6, ease: "easeOut" as const }}
                                >
                                    <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
                                        <h2 className="text-xl font-bold brand-text">{categoryName}</h2>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => scrollSection(`category-${categoryName.replace(/\s+/g, "")}`, "left")}
                                                className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20`}
                                                aria-label="Scroll left"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => scrollSection(`category-${categoryName.replace(/\s+/g, "")}`, "right")}
                                                className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20`}
                                                aria-label="Scroll right"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative overflow-hidden">
                                        <motion.div
                                            id={`category-${categoryName.replace(/\s+/g, "")}`}
                                            className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth category-container"
                                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                            variants={staggerContainerVariants}
                                            initial="hidden"
                                            animate={visibleSections.has(`category-${categoryIndex}`) ? "visible" : "hidden"}
                                        >
                                            {items.map((item, index) => (
                                                <motion.div
                                                    key={item.id}
                                                    className="flex-shrink-0 category-item"
                                                    variants={cardVariants}
                                                >
                                                    <ContentCard
                                                        item={item}
                                                        type={currentTab === "movies" ? "movie" : "tv"}
                                                    />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    </div>
                                </motion.div>

                                {/* Insert Streaming Service Hubs after Romance category */}
                                {categoryName === "Romance" && (
                                    <StreamingServiceHub
                                        currentTab={currentTab}
                                        visibleSections={visibleSections}
                                        observeSection={observeSection}
                                        scrollSection={scrollSection}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Footer */}
                    <motion.footer
                        className="text-gray-400 py-4 md:py-6 mt-8 md:mt-12"
                        ref={(el) => observeSection(el, "footer")}
                        variants={sectionVariants}
                        initial="hidden"
                        animate={visibleSections.has("footer") ? "visible" : "hidden"}
                        transition={{ duration: 0.6, ease: "easeOut" as const }}
                    >
                        <div className="container mx-auto px-4 md:px-6 text-center">
                            <p className="text-xs md:text-sm">
                                All rules and regulations of the respective streaming platforms apply. <br />
                                This is a personal project and not affiliated with any streaming service.
                            </p>
                            <p className="mt-2 text-xs">Made with Next.js, Tailwind CSS, and TMDB API.</p>
                            <p className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                                Made with ❤️ by nubDRAKE
                            </p>
                        </div>
                    </motion.footer>


                </>
            )}
        </div>
    )
}
