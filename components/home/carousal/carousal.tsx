"use client"

import "./carousal.css"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { RefreshCw, Info } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { ContentDrawer } from "@/components/ContentDrawer"
import type { Movie, TVShow } from "@/lib/tmdb"

interface MovieWithLogo {
    id: number
    title: string
    backdrop_path?: string
    poster_path?: string
    release_date: string
    vote_average: number
    images?: {
        logos: { file_path: string; iso_639_1: string }[]
    }
    isAIPick?: boolean
}

interface TVShowWithLogo {
    id: number
    name: string
    backdrop_path?: string
    poster_path?: string
    first_air_date: string
    vote_average: number
    images?: {
        logos: { file_path: string; iso_639_1: string }[]
    }
    isAIPick?: boolean
}

type CarouselItem = MovieWithLogo | TVShowWithLogo

interface CarouselProps {
    items: CarouselItem[]
    isLoading?: boolean
    onRefresh?: () => void
    isAnimating?: boolean
}

// Optimized poster images for carousel with priority loading
function LazyPoster({
    src,
    alt,
    className,
    imgClassName,
    priority = false,
}: {
    src: string
    alt: string
    className?: string
    imgClassName?: string
    priority?: boolean
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(priority) // If priority, show immediately

    useEffect(() => {
        if (priority) return // Skip intersection observer for priority images
        if (!ref.current || typeof IntersectionObserver === "undefined") return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.3) { // Reduced threshold for faster loading
                        setVisible(true)
                        observer.disconnect()
                    }
                })
            },
            { threshold: 0.3 },
        )

        observer.observe(ref.current)

        return () => observer.disconnect()
    }, [priority])

    return (
        <div ref={ref} className={className}>
            {visible ? (
                <Image
                    src={src || "/logo.avif"}
                    alt={alt}
                    fill
                    className={imgClassName ?? "object-cover"}
                    priority={priority}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

export function Carousel({ items, isLoading = false, onRefresh, isAnimating = false }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isCarouselAnimating, setIsCarouselAnimating] = useState(false)
    const isMobile = useIsMobile()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null)

    const carouselRef = useRef<HTMLDivElement | null>(null)
    const carouselAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (items.length > 0 && !isCarouselAnimating) {
            const timer = setTimeout(() => {
                nextSlide()
            }, 10000)
            return () => clearTimeout(timer)
        }
    }, [currentIndex, isCarouselAnimating, items])

    useEffect(() => {
        return () => {
            if (carouselAnimationTimeoutRef.current) {
                clearTimeout(carouselAnimationTimeoutRef.current)
            }
        }
    }, [])

    const openDrawer = (item: CarouselItem) => {
        setSelectedItem(item)
        setDrawerOpen(true)
    }

    // Enhanced carousel navigation with animations
    const goToSlide = (index: number) => {
        if (index === currentIndex) return

        // Clear any existing animation timeout to prevent conflicts
        if (carouselAnimationTimeoutRef.current) {
            clearTimeout(carouselAnimationTimeoutRef.current)
        }

        setIsCarouselAnimating(true)
        setCurrentIndex(index)

        // Reset animation state after animation completes
        carouselAnimationTimeoutRef.current = setTimeout(() => {
            setIsCarouselAnimating(false)
        }, 800)
    }

    const nextSlide = () => {
        if (items.length === 0) return
        const nextIndex = (currentIndex + 1) % items.length
        goToSlide(nextIndex)
    }

    const prevSlide = () => {
        if (items.length === 0) return
        const prevIndex = (currentIndex - 1 + items.length) % items.length
        goToSlide(prevIndex)
    }

    const currentItem = items[currentIndex] || null

    if (isLoading) {
        return (
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
                {/* Skeleton dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-2 w-2 bg-gray-500 rounded-full animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <div
                className="relative carousel-height rounded-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500/30 transition-all duration-300"
                ref={carouselRef}
            >
                {items.length > 0 ? (
                    <>
                        {/* Background Image with Overlay */}
                        <div className="absolute inset-0">
                            {items.map((item, index) => (
                                <div
                                    key={`bg-${item.id}`}
                                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"
                                        }`}
                                >
                                    <div className="absolute inset-0 overflow-hidden">
                                        <Image
                                            src={
                                                item.backdrop_path
                                                    ? `https://image.tmdb.org/t/p/${isMobile ? 'original' : 'w780'}${item.backdrop_path}`
                                                    : item.poster_path
                                                        ? `https://image.tmdb.org/t/p/${isMobile ? 'original' : 'w780'}${item.poster_path}`
                                                        : "/logo.avif"
                                            }
                                            alt={`${"title" in item ? item.title : item.name} background`}
                                            fill
                                            className="object-cover md:blur-sm opacity-100 md:opacity-40 scale-110 carousel-background-image"
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent md:hidden" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent md:hidden" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent md:hidden" />
                                </div>
                            ))}
                        </div>



                        {/* Content Container */}
                        <div className="relative z-10 h-full carousel-content-container">
                            {items.map((item, index) => (
                                <div
                                    key={`content-${item.id}`}
                                    className={`absolute inset-0 flex items-center transition-all duration-800 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"}`}
                                    style={{ pointerEvents: index === currentIndex ? "auto" : "none" }}
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full h-full">
                                        {/* Left Content */}
                                        <div
                                            className={`flex flex-col justify-end md:justify-center pb-20 md:pb-0 px-6 lg:px-12 space-y-4 md:space-y-6 cursor-pointer ${index === currentIndex ? "animate-slide-in-left" : ""}`}
                                            onClick={() => openDrawer(item)}
                                        >
                                            <div className="space-y-4">
                                                <AnimatePresence mode="wait">
                                                    {(() => {
                                                        const logo =
                                                            item.images?.logos?.find((l) => l.iso_639_1 === "en" && l.file_path.endsWith(".svg")) ||
                                                            item.images?.logos?.find((l) => l.iso_639_1 === "en")
                                                        if (logo) {
                                                            return (
                                                                <motion.div
                                                                    key={`${item.id}-logo-wrapper`}
                                                                    className="h-16 md:h-20 lg:h-24"
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -20 }}
                                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                                >
                                                                    <img
                                                                        src={`https://image.tmdb.org/t/p/original${logo.file_path}`}
                                                                        alt={`${"title" in item ? item.title : item.name} logo`}
                                                                        className="h-full object-contain object-left hidden md:block"
                                                                    />
                                                                    <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight carousel-animate-slide md:hidden flex items-center justify-start h-full text-left drop-shadow-lg">
                                                                        {"title" in item ? item.title : item.name}
                                                                    </h1>
                                                                </motion.div>
                                                            )
                                                        }
                                                        return (
                                                            <motion.h1
                                                                key={`${item.id}-title`}
                                                                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight carousel-animate-slide h-auto md:h-24 flex items-end md:items-center drop-shadow-lg"
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -20 }}
                                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                                            >
                                                                {"title" in item ? item.title : item.name}
                                                            </motion.h1>
                                                        )
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
                                                        {new Date("release_date" in item ? item.release_date : item.first_air_date).getFullYear()}
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
                                                className="flex flex-row gap-3 md:gap-4 carousel-buttons carousel-animate-fade relative z-30"
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
                                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openDrawer(item)
                                                        }}
                                                        className={`${isMobile ? "w-10 h-10 text-base" : "w-10 h-10 text-base"} rounded-lg bg-gray-800/90 hover:bg-gray-700/90 border border-gray-600/50 backdrop-filter backdrop-blur-sm text-white transition-all duration-200 hover:scale-110 hover:shadow-[0_0_15px_rgba(147,51,234,0.4)] active:scale-95 flex items-center justify-center`}
                                                        title="View details"
                                                    >
                                                        <Info className={`${isMobile ? "w-5 h-5" : "w-5 h-5"}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Card - Desktop Only */}
                                        <div className={`hidden lg:flex items-center justify-center lg:justify-end px-6 lg:px-12 carousel-poster-container ${index === currentIndex ? "animate-slide-in-right" : ""}`}>
                                            <div
                                                className="w-48 md:w-56 lg:w-64 xl:w-80 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openDrawer(item)
                                                }}
                                            >
                                                {/* Poster Image */}
                                                <div className="relative h-full">
                                                    <LazyPoster
                                                        src={item.poster_path ? `https://image.tmdb.org/t/p/${isMobile ? 'w780' : 'w500'}${item.poster_path}` : "/logo.avif"}
                                                        alt="Featured Content"
                                                        className="w-full h-full"
                                                        imgClassName="object-cover"
                                                        priority={index === 0}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Carousel Controls Container */}
                        <div className="absolute bottom-4 md:bottom-6 left-4 right-4 z-20 flex items-center justify-between">
                            {/* Pagination "Pills" - Limited to 4 on mobile */}
                            <div className="flex items-center space-x-1 md:space-x-2">
                                {items.slice(0, isMobile ? 8 : items.length).map((_, index) => (
                                    <div
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`carousel-pagination-btn transition-all duration-300 cursor-pointer rounded-sm ${index === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                                            } ${isCarouselAnimating ? "opacity-50" : ""}`}
                                        style={{
                                            width: index === currentIndex ? (isMobile ? '12px' : '24px') : (isMobile ? '6px' : '12px'),
                                            height: isMobile ? '2px' : '4px',
                                            minWidth: index === currentIndex ? (isMobile ? '12px' : '24px') : (isMobile ? '6px' : '12px'),
                                            minHeight: isMobile ? '2px' : '4px'
                                        }}
                                        aria-label={`Go to slide ${index + 1}`}
                                        aria-current={index === currentIndex ? "true" : "false"}
                                    />
                                ))}
                            </div>

                            {/* Navigation Arrows */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={prevSlide}
                                    className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${isCarouselAnimating ? "opacity-50" : ""}`}
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
                                    onClick={nextSlide}
                                    className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${isCarouselAnimating ? "opacity-50" : ""}`}
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
                                {/* Refresh Button */}
                                {onRefresh && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onRefresh()
                                        }}
                                        disabled={isAnimating}
                                        className={`bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${isAnimating || isCarouselAnimating ? "opacity-50" : ""}`}
                                        aria-label="Refresh carousel content"
                                        title="Refresh carousel content"
                                    >
                                        <RefreshCw className={`h-5 w-5 md:h-6 md:w-6 ${isAnimating ? "animate-spin" : ""}`} />
                                    </button>
                                )}
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
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white">
                                    SkyyPlay
                                </h1>
                                <p className="text-gray-300 mt-2">Loading amazing content...</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {selectedItem && (
                <ContentDrawer
                    item={selectedItem as Movie | TVShow}
                    type={"title" in selectedItem ? "movie" : "tv"}
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                />
            )}
        </>
    )
}
