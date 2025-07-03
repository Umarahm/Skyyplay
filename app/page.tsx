"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { ContentCard } from "@/components/ContentCard"
import { SmartGenreTags } from "@/components/SmartGenreTags"
import { JarvisButton } from "@/components/JarvisButton"
import { type Movie, type TVShow, type Genre } from "@/lib/tmdb"

export default function HomePage() {
    const [currentTab, setCurrentTab] = useState<"movies" | "shows">("shows")
    const [isLoading, setIsLoading] = useState(true)
    const [carouselItems, setCarouselItems] = useState<(Movie | TVShow)[]>([])
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
    const [top10Items, setTop10Items] = useState<(Movie | TVShow)[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
    const [genreResults, setGenreResults] = useState<(Movie | TVShow)[]>([])
    const [categories, setCategories] = useState<{ [key: string]: (Movie | TVShow)[] }>({})
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
    const [isCarouselAnimating, setIsCarouselAnimating] = useState(false)
    const [loadingStatus, setLoadingStatus] = useState<string>("Initializing...")

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
            if (carouselIntervalRef.current) {
                clearInterval(carouselIntervalRef.current)
            }
            if (carouselAnimationTimeoutRef.current) {
                clearTimeout(carouselAnimationTimeoutRef.current)
            }
        }
    }, [])

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
        setIsLoading(true)
        setLoadingStatus("Initializing...")

        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Content loading timeout')), 30000) // 30 second timeout
        })

        try {
            // Use Promise.allSettled instead of Promise.all to handle individual failures gracefully
            const results = await Promise.race([
                Promise.allSettled([
                    fetchCarouselContent(),
                    fetchTop10Content(),
                    fetchGenres(),
                    generateCategorySections()
                ]),
                timeoutPromise
            ]) as PromiseSettledResult<any>[]

            // Log any failures for debugging
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`API call ${index} failed:`, result.reason)
                }
            })
        } catch (error) {
            console.error("Error initializing content:", error)
        } finally {
            // Always set loading to false, even if some API calls fail
            setIsLoading(false)
            setLoadingStatus("Initialization completed")
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

    const fetchCarouselContent = async () => {
        setLoadingStatus("Fetching carousel content...")
        try {
            const [movieResponse, tvResponse] = await Promise.all([
                fetch('/api/tmdb/movies/popular?page=1'),
                fetch('/api/tmdb/tv/popular?page=1')
            ])

            // Check if responses are ok before processing
            if (!movieResponse.ok || !tvResponse.ok) {
                console.error('API responses not ok:', {
                    movies: movieResponse.status,
                    tv: tvResponse.status
                })
                // Set fallback data instead of throwing
                setCarouselItems([])
                return
            }

            const [movieData, tvData] = await Promise.all([
                movieResponse.json(),
                tvResponse.json()
            ])

            const combinedResults = [
                ...movieData.results.slice(0, 10).map((item: any) => ({ ...item, type: "movie" })),
                ...tvData.results.slice(0, 10).map((item: any) => ({ ...item, type: "tv" })),
            ]

            // Fallback: Deterministic shuffle based on content IDs to ensure consistent results
            const shuffled = combinedResults
                .sort((a, b) => {
                    const hashA = (a.id * 17 + 13) % 1000
                    const hashB = (b.id * 17 + 13) % 1000
                    return hashA - hashB
                })
                .slice(0, 8)
            setCarouselItems(shuffled)

            // Start carousel auto-rotation after setting items
            startCarouselAutoRotation()

            // Try AI-enhanced selection in background, don't block page load
            setTimeout(async () => {
                try {
                    console.log('🎯 Starting AI Carousel Enhancement (Optimized - 2 AI + 2 Regular)...', {
                        itemCount: combinedResults.length,
                        contentType: currentTab === "movies" ? "movie" : "tv",
                        timestamp: new Date().toISOString()
                    })

                    const aiResponse = await fetch('/api/ai/carousel-picks', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            items: combinedResults,
                            contentType: currentTab === "movies" ? "movie" : "tv"
                        })
                    })

                    console.log('📡 AI Response Status:', aiResponse.status, aiResponse.statusText)

                    if (aiResponse.ok) {
                        const responseData = await aiResponse.json()
                        console.log('✨ AI Enhancement Result (Optimized):', {
                            ...responseData,
                            aiPicksCount: responseData.items?.filter((item: any) => item.isAIPick)?.length || 0,
                            regularPicksCount: responseData.items?.filter((item: any) => !item.isAIPick)?.length || 0
                        })

                        if (responseData.items && responseData.items.length > 0) {
                            console.log('🔄 Updating carousel with optimized AI-enhanced items')
                            setCarouselItems(responseData.items)
                        } else {
                            console.warn('⚠️ No AI items received, keeping fallback')
                        }
                    } else {
                        console.error('❌ AI Response not OK:', await aiResponse.text())
                    }
                } catch (aiError) {
                    console.error('❌ AI carousel enhancement failed:', aiError)
                    // Continue with fallback items
                }
            }, 2000)
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
        // Always include Romance and Drama, then fill the rest deterministically up to a max of 6 total
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
            .slice(0, 4) // Pick 4 more to make total of 6

        const categoryGenres = [...baseGenres, ...shuffledOthers]

        const newCategories: { [key: string]: (Movie | TVShow)[] } = {}

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
            const response = await fetch(`/api/tmdb/discover?type=${type}&with_genres=${genre.id}`)
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
        const nextIndex = (currentCarouselIndex + 1) % carouselItems.length
        goToCarouselSlide(nextIndex)
    }

    const prevCarouselSlide = () => {
        const prevIndex = (currentCarouselIndex - 1 + carouselItems.length) % carouselItems.length
        goToCarouselSlide(prevIndex)
    }

    // Start auto-rotation for carousel
    const startCarouselAutoRotation = () => {
        // Clear any existing interval
        if (carouselIntervalRef.current) {
            clearInterval(carouselIntervalRef.current)
        }

        // Set new interval for auto-rotation with longer delay to reduce conflicts
        carouselIntervalRef.current = setInterval(() => {
            if (!isCarouselAnimating && carouselItems.length > 0) {
                nextCarouselSlide()
            }
        }, 10000) // Increased from 8000 to 10000 for less aggressive auto-rotation
    }



    const currentCarouselItem = carouselItems[currentCarouselIndex]

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
                            <div className="relative h-[500px] md:h-[600px] rounded-2xl overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700">
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
                                            <div className="w-64 md:w-80 lg:w-96 aspect-[2/3] bg-gray-600 rounded-2xl animate-pulse skeleton-shimmer" />
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
                            <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="flex-shrink-0 relative">
                                        <div
                                            className="w-36 md:w-44 aspect-[2/3] bg-gray-700 rounded-xl animate-pulse skeleton-shimmer"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        />
                                        <div className="absolute left-[-8px] bottom-0 text-6xl md:text-7xl text-gray-500 font-black opacity-50">
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
                                <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="flex-shrink-0 w-36">
                                            <div
                                                className="aspect-[2/3] bg-gray-700 rounded-lg animate-pulse skeleton-shimmer"
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
                                {carouselItems.length > 0 && (
                                    <>
                                        {/* Background Image with Overlay */}
                                        <div className="absolute inset-0">
                                            {carouselItems.map((item, index) => (
                                                <div
                                                    key={`bg-${item.id}`}
                                                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentCarouselIndex ? "opacity-100" : "opacity-0"
                                                        }`}
                                                >
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center blur-sm md:blur-sm opacity-40 "
                                                        style={{
                                                            backgroundImage: `url(https://image.tmdb.org/t/p/original${item.backdrop_path || item.poster_path})`,
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20 md:to-black/40" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* AI Pick Badge - Dynamic per slide */}
                                        <div className="absolute top-4 left-4 z-20">
                                            <div className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${(currentCarouselItem as any)?.isAIPick
                                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                                                : 'bg-gray-800/90 text-gray-300 border border-gray-600'
                                                }`}>
                                                {(currentCarouselItem as any)?.isAIPick ? (
                                                    <>
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                        </svg>
                                                        <span>AI Pick</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                        </svg>
                                                        <span>Skyyplay Recommends</span>
                                                    </>
                                                )}
                                            </div>
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
                                                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full h-full cursor-pointer"
                                                        onClick={() =>
                                                            (window.location.href = `/watch?id=${item.id}&type=${"title" in item ? "movie" : "tv"}`)
                                                        }
                                                    >
                                                        {/* Left Content */}
                                                        <div
                                                            className={`flex flex-col justify-center px-6 lg:px-12 space-y-6 ${index === currentCarouselIndex ? "animate-slide-in-left" : ""
                                                                }`}
                                                        >
                                                            <div className="space-y-4">
                                                                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight carousel-animate-slide">
                                                                    {"title" in item ? item.title : item.name}
                                                                </h1>
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
                                                                className="flex flex-col sm:flex-row gap-4 carousel-buttons carousel-animate-fade relative z-30"
                                                                style={{ animationDelay: "0.4s" }}
                                                                onClick={(e) => e.stopPropagation()} // Prevent triggering parent click
                                                            >
                                                                <button
                                                                    className="brand-gradient text-white px-8 py-3 rounded-full flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] active:scale-95 font-medium btn-animated"
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
                                                                    <span>Watch Now</span>
                                                                </button>
                                                                <button
                                                                    className="bg-gray-800/80 text-white px-8 py-3 rounded-full flex items-center justify-center space-x-2 transition-all duration-300 hover:bg-gray-700 hover:scale-110 hover:shadow-[0_0_20px_rgba(75,85,99,0.6)] active:scale-95 font-medium border border-gray-600 btn-animated"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        // Show more info modal or navigate to details page
                                                                        window.location.href = `/watch?id=${item.id}&type=${"title" in item ? "movie" : "tv"}&info=true`
                                                                    }}
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        className="h-5 w-5"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                    </svg>
                                                                    <span>More Info</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Right Poster */}
                                                        <div
                                                            className={`hidden md:flex items-center justify-center lg:justify-end px-6 lg:px-12 ${index === currentCarouselIndex ? "animate-slide-in-right" : ""
                                                                }`}
                                                        >
                                                            <div className="relative group">
                                                                <div className="w-64 md:w-80 lg:w-96 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                                                    <img
                                                                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                                                                        alt="Featured Content"
                                                                        className="w-full h-full object-cover carousel-animate-in"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Click zones for navigation - positioned to avoid button area */}
                                        <div
                                            className="absolute left-0 top-0 w-16 h-full z-10 cursor-pointer md:w-20"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                prevCarouselSlide()
                                            }}
                                        />
                                        <div
                                            className="absolute right-0 top-0 w-16 h-full z-10 cursor-pointer md:w-20"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                nextCarouselSlide()
                                            }}
                                        />

                                        {/* Navigation Arrows */}
                                        <button
                                            onClick={prevCarouselSlide}
                                            className={`carousel-nav-button absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-3 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-95 ${isCarouselAnimating ? 'opacity-50' : ''}`}
                                            aria-label="Previous slide"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-6 w-6"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={nextCarouselSlide}
                                            className={`carousel-nav-button absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-3 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-95 ${isCarouselAnimating ? 'opacity-50' : ''}`}
                                            aria-label="Next slide"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-6 w-6"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>

                                        {/* Pagination Dots */}
                                        <div className="carousel-dot-container absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-0.5 md:space-x-2 z-20">
                                            {carouselItems.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => goToCarouselSlide(index)}
                                                    className={`carousel-dot h-1 md:h-2 rounded-full transition-all duration-300 hover:scale-110 ${index === currentCarouselIndex
                                                        ? "bg-purple-500 w-2 md:w-6 lg:w-8 hover:bg-purple-400"
                                                        : "bg-gray-500 hover:bg-gray-400 w-1 md:w-2 hover:w-1.5 md:hover:w-3 lg:hover:w-4"
                                                        } ${isCarouselAnimating ? 'opacity-50' : ''}`}
                                                    aria-label={`Go to slide ${index + 1}`}
                                                    aria-current={index === currentCarouselIndex ? "true" : "false"}
                                                />
                                            ))}
                                        </div>
                                    </>
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
                                <h2 className="text-2xl font-bold brand-text mb-6">
                                    {genres.find((g) => g.id === selectedGenre)?.name} {currentTab === "movies" ? "Movies" : "TV Shows"}
                                </h2>
                                <div className="relative overflow-hidden">
                                    <motion.div
                                        id="genreResultsContainer"
                                        className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
                                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                        variants={staggerContainerVariants}
                                        initial="hidden"
                                        animate={visibleSections.has("genre-results") ? "visible" : "hidden"}
                                    >
                                        {genreResults.slice(0, 18).map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                className="flex-shrink-0 w-36 md:w-44"
                                                variants={cardVariants}
                                            >
                                                <ContentCard item={item} type={currentTab === "movies" ? "movie" : "tv"} />
                                            </motion.div>
                                        ))}
                                    </motion.div>

                                    {/* Navigation buttons for genre results */}
                                    <button
                                        onClick={() => scrollSection("genreResultsContainer", "left")}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-2 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hidden lg:flex"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => scrollSection("genreResultsContainer", "right")}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-2 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hidden lg:flex"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
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
                            </div>
                            <div className="relative overflow-hidden">
                                <motion.div
                                    id="top10Container"
                                    className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
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
                                            <div className="relative w-36 md:w-44">
                                                <ContentCard item={item} type={currentTab === "movies" ? "movie" : "tv"} />
                                                <div
                                                    className="absolute left-[-12px] bottom-[-4px] text-white font-black text-6xl md:text-7xl opacity-90 z-20 pointer-events-none select-none"
                                                    style={{
                                                        textShadow: "3px 3px 12px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.9)",
                                                        WebkitTextStroke: "2px rgba(0,0,0,0.5)"
                                                    }}
                                                >
                                                    {index + 1}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* Navigation buttons for top 10 */}
                                <button
                                    onClick={() => scrollSection("top10Container", "left")}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-2 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hidden lg:flex section-nav-button"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => scrollSection("top10Container", "right")}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-2 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hidden lg:flex section-nav-button"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Category Sections with Scroll Animation */}
                    <div className="px-0 sm:px-6 py-4 overflow-hidden">
                        {Object.entries(categories).map(([categoryName, items], categoryIndex) => (
                            <motion.div
                                key={categoryName}
                                className="category-section container mx-auto mb-8"
                                ref={(el) => observeSection(el, `category-${categoryIndex}`)}
                                variants={sectionVariants}
                                initial="hidden"
                                animate={visibleSections.has(`category-${categoryIndex}`) ? "visible" : "hidden"}
                                transition={{ duration: 0.6, ease: "easeOut" as const }}
                            >
                                <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
                                    <h2 className="text-xl font-bold brand-text">{categoryName}</h2>

                                </div>
                                <div className="relative overflow-hidden">
                                    <motion.div
                                        id={`category-${categoryName.replace(/\s+/g, "")}`}
                                        className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth category-container"
                                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                        variants={staggerContainerVariants}
                                        initial="hidden"
                                        animate={visibleSections.has(`category-${categoryIndex}`) ? "visible" : "hidden"}
                                    >
                                        {items.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                className="flex-shrink-0 w-36 category-item"
                                                variants={cardVariants}
                                            >
                                                <ContentCard
                                                    item={item}
                                                    type={currentTab === "movies" ? "movie" : "tv"}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>

                                    {/* Navigation buttons for categories */}
                                    <button
                                        onClick={() => scrollSection(`category-${categoryName.replace(/\s+/g, "")}`, "left")}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-2 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hidden lg:flex section-nav-button"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => scrollSection(`category-${categoryName.replace(/\s+/g, "")}`, "right")}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-2 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hidden lg:flex section-nav-button"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Streaming Services */}
                    <motion.div
                        className="container mx-auto px-4 md:px-6 py-8 md:py-12"
                        ref={(el) => observeSection(el, "streaming")}
                        variants={sectionVariants}
                        initial="hidden"
                        animate={visibleSections.has("streaming") ? "visible" : "hidden"}
                        transition={{ duration: 0.6, ease: "easeOut" as const }}
                    >
                        <div className="text-center mb-6 md:mb-8">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-300">Content Available From</h2>
                            <p className="text-sm md:text-base text-gray-400 mt-2">
                                SkyyPlay aggregates content from various premium streaming platforms
                            </p>
                        </div>
                        <motion.div
                            className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center justify-items-center opacity-80"
                            variants={staggerContainerVariants}
                            initial="hidden"
                            animate={visibleSections.has("streaming") ? "visible" : "hidden"}
                        >
                            <a
                                href="https://netflix.com"
                                target="_blank"
                                className="transform transition-transform hover:scale-105"
                                rel="noreferrer"
                            >
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
                                    alt="Netflix"
                                    className="h-6 md:h-8 w-auto grayscale hover:grayscale-0 hover:scale-110 hover:brightness-125 transition-all duration-300"
                                />
                            </a>
                            <a
                                href="https://www.primevideo.com"
                                target="_blank"
                                className="transform transition-transform hover:scale-105"
                                rel="noreferrer"
                            >
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg"
                                    alt="Prime Video"
                                    className="h-6 md:h-8 w-auto grayscale hover:grayscale-0 hover:scale-110 hover:brightness-125 transition-all duration-300"
                                />
                            </a>
                            <a
                                href="https://www.disneyplus.com"
                                target="_blank"
                                className="transform transition-transform hover:scale-105"
                                rel="noreferrer"
                            >
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg"
                                    alt="Disney+"
                                    className="h-6 md:h-8 w-auto grayscale hover:grayscale-0 hover:scale-110 hover:brightness-125 transition-all duration-300"
                                />
                            </a>
                            <a
                                href="https://www.hulu.com"
                                target="_blank"
                                className="transform transition-transform hover:scale-105"
                                rel="noreferrer"
                            >
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Hulu_logo_%282018%29.svg"
                                    alt="Hulu"
                                    className="h-6 md:h-8 w-auto grayscale hover:grayscale-0 hover:scale-110 hover:brightness-125 transition-all duration-300"
                                />
                            </a>
                            <a
                                href="https://www.max.com"
                                target="_blank"
                                className="transform transition-transform hover:scale-105"
                                rel="noreferrer"
                            >
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg"
                                    alt="HBO Max"
                                    className="h-6 md:h-8 w-auto grayscale hover:grayscale-0 hover:scale-110 hover:brightness-125 transition-all duration-300"
                                />
                            </a>
                            <a
                                href="https://tv.apple.com"
                                target="_blank"
                                className="transform transition-transform hover:scale-105"
                                rel="noreferrer"
                            >
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg"
                                    alt="Apple TV+"
                                    className="h-6 md:h-8 w-auto grayscale hover:grayscale-0 hover:scale-110 hover:brightness-125 transition-all duration-300"
                                />
                            </a>
                        </motion.div>
                    </motion.div>

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

                    {/* Jarvis AI Button */}
                    <JarvisButton />
                </>
            )}
        </div>
    )
}
