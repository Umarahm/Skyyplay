"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ContentCard } from "@/components/ContentCard"
import type { Movie, TVShow } from "@/lib/tmdb"

interface ServiceConfig {
    name: string
    logo: string
    color: string
    gradient: string
}

const CONTENT_CATEGORIES = [
    { id: "popular-movies", title: "Popular Movies", type: "movie", sort: "popularity.desc" },
    { id: "top-rated-tv", title: "Top Rated TV Shows", type: "tv", sort: "vote_average.desc" },
    { id: "award-winners", title: "Award Winners", type: "both", sort: "vote_average.desc" },
    { id: "action-packed", title: "Action Packed", type: "both", genre: "28,10759" },
    { id: "mysterious", title: "Mysterious", type: "both", genre: "9648,80" },
    { id: "spine-tingling", title: "Spine Tingling", type: "both", genre: "27,10765" },
    { id: "comedy-delights", title: "Comedy Delights", type: "both", genre: "35,10765" },
    { id: "mini-series", title: "Mini Series", type: "tv", sort: "popularity.desc" },
    { id: "documentaries", title: "Groundbreaking Documentaries", type: "both", genre: "99,10768" }
]

interface StreamingServiceClientProps {
    service: string
    serviceConfig: ServiceConfig
}

// Move animation variants outside component to prevent re-creation
const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
}

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 }
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

export function StreamingServiceClient({ service, serviceConfig }: StreamingServiceClientProps) {
    const [contentSections, setContentSections] = useState<Record<string, (Movie | TVShow)[]>>({})
    const [loading, setLoading] = useState(true)
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
    const observerRefs = useRef<Map<string, IntersectionObserver>>(new Map())
    const isResizing = useRef(false)

    const observeSection = useCallback((element: HTMLElement | null, sectionId: string) => {
        if (!element) return

        // Don't recreate observer if element is the same
        const existingObserver = observerRefs.current.get(sectionId)
        if (existingObserver) {
            return // Don't recreate observer
        }

        const observer = new IntersectionObserver(
            (entries) => {
                // Skip updates during resize to prevent unnecessary re-renders
                if (isResizing.current) return

                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisibleSections((prev) => {
                            if (prev.has(sectionId)) return prev // Don't update if already visible
                            return new Set([...prev, sectionId])
                        })
                    }
                })
            },
            { threshold: 0.1, rootMargin: "50px" }
        )

        observer.observe(element)
        observerRefs.current.set(sectionId, observer)
    }, [])

    const scrollSection = useCallback((containerId: string, direction: "left" | "right") => {
        const container = document.getElementById(containerId)
        if (container) {
            const scrollAmount = direction === "left" ? -400 : 400
            container.scrollBy({ left: scrollAmount, behavior: "smooth" })
        }
    }, [])

    const fetchServiceContent = useCallback(async () => {
        try {
            setLoading(true)
            const sections: Record<string, (Movie | TVShow)[]> = {}

            for (const category of CONTENT_CATEGORIES) {
                try {
                    if (category.type === "both") {
                        // Fetch both movies and TV shows
                        const [movieResponse, tvResponse] = await Promise.all([
                            fetch(`/api/tmdb/discover/streaming?service=${service}&type=movie&sort_by=${category.sort || 'popularity.desc'}&page=1`),
                            fetch(`/api/tmdb/discover/streaming?service=${service}&type=tv&sort_by=${category.sort || 'popularity.desc'}&page=1`)
                        ])

                        if (movieResponse.ok && tvResponse.ok) {
                            const [movieData, tvData] = await Promise.all([
                                movieResponse.json(),
                                tvResponse.json()
                            ])

                            // Combine and shuffle movies and TV shows
                            const combined = [...(movieData.results || []), ...(tvData.results || [])]
                                .sort(() => Math.random() - 0.5)
                                .slice(0, 20)

                            sections[category.id] = combined
                        }
                    } else {
                        // Fetch single type
                        const response = await fetch(`/api/tmdb/discover/streaming?service=${service}&type=${category.type}&sort_by=${category.sort || 'popularity.desc'}&page=1`)

                        if (response.ok) {
                            const data = await response.json()
                            sections[category.id] = (data.results || []).slice(0, 20)
                        }
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

    useEffect(() => {
        // Handle resize events to prevent unnecessary re-renders
        let resizeTimer: NodeJS.Timeout
        const handleResize = () => {
            isResizing.current = true
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                isResizing.current = false
            }, 100)
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            clearTimeout(resizeTimer)
            observerRefs.current.forEach((observer) => observer.disconnect())
            observerRefs.current.clear()
        }
    }, [])

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Back Button */}
            <motion.button
                onClick={() => window.history.back()}
                className="fixed top-4 left-4 z-50 bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </motion.button>

            {/* Hero Section */}
            <motion.div
                className={`relative h-96 md:h-[500px] bg-gradient-to-b ${serviceConfig.gradient} flex items-center justify-center overflow-hidden`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
                </div>

                {/* Service Logo */}
                <motion.div
                    className="relative z-10 text-center"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <img
                        src={serviceConfig.logo}
                        alt={serviceConfig.name}
                        className="h-24 md:h-32 mx-auto mb-6 brightness-0 invert"
                        style={{ maxWidth: '300px' }}
                    />
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
                        Discover exclusive content from {serviceConfig.name}
                    </p>
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/5 animate-pulse" />
                <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-white/5 animate-pulse delay-1000" />
            </motion.div>

            {/* Content Sections */}
            <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
                {loading ? (
                    <div className="space-y-12">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-4">
                                <div className="h-8 bg-gray-800 rounded w-64 animate-pulse" />
                                <div className="flex gap-4 overflow-hidden">
                                    {[...Array(6)].map((_, j) => (
                                        <div key={j} className="w-52 h-80 bg-gray-800 rounded-xl animate-pulse flex-shrink-0" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-12 md:space-y-16">
                        {CONTENT_CATEGORIES.map((category) => {
                            const sectionContent = contentSections[category.id] || []

                            if (sectionContent.length === 0) return null

                            return (
                                <motion.div
                                    key={category.id}
                                    className="space-y-4 md:space-y-6"
                                    ref={(el) => observeSection(el, category.id)}
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate={visibleSections.has(category.id) ? "visible" : "hidden"}
                                    transition={{ duration: 0.6 }}
                                >
                                    <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
                                        <h2 className="text-xl md:text-2xl font-bold text-white">
                                            {category.title}
                                        </h2>
                                        <div className="flex items-center space-x-2">
                                            {/* Navigation Buttons - Styled like homepage */}
                                            <motion.button
                                                onClick={() => scrollSection(`${category.id}-container`, "left")}
                                                className="bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
                                                aria-label="Scroll left"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={visibleSections.has(category.id) ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </motion.button>

                                            <motion.button
                                                onClick={() => scrollSection(`${category.id}-container`, "right")}
                                                className="bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
                                                aria-label="Scroll right"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={visibleSections.has(category.id) ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden">

                                        {/* Content Cards */}
                                        <motion.div
                                            id={`${category.id}-container`}
                                            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6"
                                            variants={staggerContainerVariants}
                                            initial="hidden"
                                            animate={visibleSections.has(category.id) ? "visible" : "hidden"}
                                            style={{
                                                scrollBehavior: 'smooth',
                                                scrollbarWidth: 'none',
                                                msOverflowStyle: 'none'
                                            }}
                                        >
                                            {sectionContent.map((item, index) => (
                                                <motion.div
                                                    key={`${item.id}-${category.id}`}
                                                    className="flex-shrink-0"
                                                    variants={cardVariants}
                                                >
                                                    <ContentCard
                                                        item={item}
                                                        type={"title" in item ? "movie" : "tv"}
                                                    />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
} 