"use client"

import React, { useState, useEffect, useRef } from 'react'
import { TMDBApi, Collection } from '@/lib/tmdb'
import Image from 'next/image'
import { ContentCard } from '@/components/ContentCard'
import { ContentCardSkeleton } from '@/components/LoadingSkeletons'
import { X, Calendar, Film } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

// Popular collections IDs - Updated with verified working IDs
const POPULAR_COLLECTION_IDS = [
    86311,  // Marvel Cinematic Universe
    10,     // Star Wars Collection
    1241,   // Harry Potter Collection
    119,    // The Lord of the Rings Collection
    645,    // James Bond Collection
    89137,  // DC Extended Universe
    87359,  // Mission: Impossible Collection
    131,    // The Fast and the Furious Collection
    748,    // X-Men Collection
    84,     // Indiana Jones Collection
    230,    // Chronicles of Narnia Collection
    135416, // John Wick Collection
]

interface PopularCollectionsProps {
    currentTab: "movies" | "shows"
}

export function PopularCollections({ currentTab }: PopularCollectionsProps) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
    const [displayLimit, setDisplayLimit] = useState(20)

    const isMobile = useIsMobile()
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (currentTab === 'movies') {
            fetchCollections()
        }
    }, [currentTab])

    useEffect(() => {
        // Reset limit when opening a new collection
        if (selectedCollection) {
            setDisplayLimit(20)
        }
    }, [selectedCollection])


    const fetchCollections = async () => {
        setIsLoading(true)
        try {
            // Fetch all collections with individual error handling and delays
            const collectionPromises = POPULAR_COLLECTION_IDS.map(async (id, index) => {
                // Add a small delay between requests to avoid overwhelming the API
                if (index > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }

                try {
                    const collection = await TMDBApi.getCollectionDetails(id)
                    if (!collection || !collection.parts || collection.parts.length === 0) {
                        console.warn(`Collection ${id} has no parts or is invalid`)
                        return null
                    }
                    return collection
                } catch (error) {
                    console.warn(`Failed to fetch collection ${id}:`, error)
                    return null
                }
            })

            // Use Promise.allSettled to ensure no rejections
            const settledResults = await Promise.allSettled(collectionPromises)
            const results = settledResults.map(result =>
                result.status === 'fulfilled' ? result.value : null
            )
            const validCollections = results.filter((c): c is Collection => c !== null)
            console.log(`Successfully loaded ${validCollections.length} out of ${POPULAR_COLLECTION_IDS.length} collections`)

            // If no collections loaded, show a fallback message
            if (validCollections.length === 0) {
                console.warn("No collections could be loaded. This might be due to TMDB API issues.")
            }

            setCollections(validCollections)
        } catch (error) {
            console.error("Error fetching collections:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef
            const scrollAmount = direction === 'left' ? -current.offsetWidth * 0.8 : current.offsetWidth * 0.8
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    const loadMoreMovies = () => {
        setDisplayLimit(prev => prev + 20)
    }

    const handleScrollMovies = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        if (scrollTop + clientHeight >= scrollHeight - 50 && selectedCollection && displayLimit < selectedCollection.parts.length) {
            loadMoreMovies()
        }
    }

    if (currentTab !== 'movies') return null

    // Sort movies by release date
    const sortedMovies = selectedCollection
        ? [...selectedCollection.parts].sort((a, b) => {
            const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
            const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
            return dateA - dateB;
        })
        : []

    const visibleMovies = sortedMovies.slice(0, displayLimit)

    return (
        <>
            <div className="container mx-auto mb-8 animate-fade-in-up relative">
                {/* Themed Container Box - Styled like AnimeSection */}
                <div className="relative rounded-3xl bg-[#0f1119] border border-gray-800 shadow-2xl overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/10 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />

                    <div className="relative px-4 py-4 md:px-4 md:py-5 flex items-center justify-between border-b border-gray-800/50 bg-black/20 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            {/* Collections Icon/Logo */}
                            <div className="flex-shrink-0">
                                <Image
                                    src="/moviecollections_logo.svg"
                                    alt="Collections Logo"
                                    width={48}
                                    height={48}
                                    className="w-10 h-10 md:w-12 md:h-12"
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">
                                    Popular Collections
                                </h2>
                                <p className="text-blue-400/80 text-xs md:text-sm font-medium tracking-wider uppercase">
                                    Cinematic Universe
                                </p>
                            </div>
                        </div>
                        {/* Navigation Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => scroll('left')}
                                className="section-nav-button prev text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50"
                                aria-label="Scroll Left"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                className="section-nav-button next text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50"
                                aria-label="Scroll Right"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="px-1 py-4 md:px-1 md:py-6 bg-gradient-to-b from-black/10 to-black/30 relative pt-8">
                        {isLoading ? (
                            <div className="flex gap-3 md:gap-4 overflow-hidden pb-2 px-2">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex-shrink-0 w-[160px] md:w-[200px] aspect-[2/3] rounded-xl bg-gray-800 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div
                                ref={scrollRef}
                                className="flex gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {collections.map(collection => (
                                    <div
                                        key={collection.id}
                                        className="flex-shrink-0 w-[160px] md:w-[200px] p-1 group cursor-pointer"
                                        onClick={() => setSelectedCollection(collection)}
                                    >
                                        <div className="relative overflow-hidden rounded-xl bg-gray-900 border-2 border-transparent group-hover:border-blue-500 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]">
                                            <div className="relative aspect-[2/3] w-full">
                                                {collection.poster_path ? (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w500${collection.poster_path}`}
                                                        alt={collection.name}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                        sizes="(max-width: 768px) 160px, 200px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-center p-2">
                                                        <span className="text-gray-500 text-xs">{collection.name}</span>
                                                    </div>
                                                )}

                                                {/* Overlay Gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                                                {/* Top Bar Decoration */}
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

                                                {/* Movie Count Badge */}
                                                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm border border-blue-500/30 rounded px-1.5 py-0.5 text-xs font-bold text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <Film size={10} />
                                                    <span>{collection.parts.length}</span>
                                                </div>
                                            </div>

                                            {/* Content Info */}
                                            <div className="absolute bottom-0 left-0 w-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <h3 className="text-white font-bold text-sm md:text-base leading-tight line-clamp-2 mb-1 drop-shadow-md group-hover:text-blue-200 transition-colors">
                                                    {collection.name}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Drawer - Rendered outside the main container */}
            {isMobile ? (
                <Drawer open={!!selectedCollection} onClose={() => setSelectedCollection(null)}>
                    <DrawerContent className="bg-gray-950 border-gray-800 text-white max-h-[90vh]">
                        <div className="mx-auto w-full max-w-md flex flex-col h-full max-h-[90vh]">
                            {selectedCollection && (
                                <>
                                    <DrawerHeader className="relative p-0 min-h-[200px] overflow-hidden rounded-t-lg">
                                        {/* Backdrop Header */}
                                        <div className="absolute inset-0">
                                            {selectedCollection.backdrop_path && (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w780${selectedCollection.backdrop_path}`}
                                                    alt={selectedCollection.name}
                                                    fill
                                                    className="object-cover opacity-40"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950" />
                                        </div>
                                        <div className="relative z-10 p-6 pt-20 text-left">
                                            <DrawerTitle className="text-2xl font-bold mb-2 text-white drop-shadow-lg">{selectedCollection.name}</DrawerTitle>
                                            <DrawerDescription className="text-gray-300 line-clamp-3 text-xs drop-shadow-md">
                                                {selectedCollection.overview}
                                            </DrawerDescription>
                                        </div>
                                    </DrawerHeader>

                                    <div
                                        className="flex-1 overflow-y-auto p-4 space-y-4"
                                        onScroll={handleScrollMovies}
                                    >
                                        <div className="flex items-center mb-4">
                                            <div className="h-6 w-1 bg-blue-600 rounded-full mr-3"></div>
                                            <h4 className="text-lg font-semibold text-white">Movies in Order</h4>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {visibleMovies.map((movie, index) => (
                                                <div key={movie.id} className="group relative">
                                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 border border-gray-800 mb-2">
                                                        <ContentCard item={movie} type="movie" />
                                                        <div className="absolute top-1 left-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white/20 z-10">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                                            <Calendar size={8} />
                                                            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {visibleMovies.length < sortedMovies.length && (
                                            <div className="py-4 flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                /* Desktop Dialog - Using same pattern as ContentDrawer */
                <Dialog open={!!selectedCollection} onOpenChange={(open) => !open && setSelectedCollection(null)}>
                    <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 bg-[#0a0a0a] text-white border-gray-800 overflow-hidden rounded-2xl shadow-2xl outline-none z-[10000]">
                        <DialogTitle className="sr-only">{selectedCollection?.name} Collection</DialogTitle>
                        <DialogDescription className="sr-only">Movies in {selectedCollection?.name} collection</DialogDescription>
                        {selectedCollection && (
                            <ScrollArea className="h-full w-full bg-[#0a0a0a]">
                                <div className="flex flex-col min-h-full text-white">
                                    {/* Hero Section - Similar to ContentDrawer */}
                                    <div className="relative w-full h-[50vh] md:h-[45vh] shrink-0 -mt-6 md:mt-0">
                                        <div className="absolute inset-0">
                                            {selectedCollection.backdrop_path ? (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/original${selectedCollection.backdrop_path}`}
                                                    alt={selectedCollection.name}
                                                    fill
                                                    className="object-cover opacity-40"
                                                    priority
                                                />
                                            ) : (
                                                <Image
                                                    src="/placeholder_poster.png"
                                                    alt={selectedCollection.name}
                                                    fill
                                                    className="object-cover w-full h-full opacity-40"
                                                    priority
                                                    quality={100}
                                                />
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                                        </div>

                                        {/* Close Button */}
                                        <div className="absolute top-4 right-4 z-50">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSelectedCollection(null)}
                                                className="rounded-full bg-black/40 hover:bg-white/20 text-white backdrop-blur-md h-10 w-10"
                                            >
                                                <X className="w-5 h-5" />
                                            </Button>
                                        </div>

                                        {/* Header Content */}
                                        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 z-10 flex flex-col md:flex-row md:items-end gap-6 md:gap-8 pb-8 md:pb-6">
                                            {/* Poster */}
                                            <div className="hidden md:block w-36 lg:w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 relative -mb-12 group z-20">
                                                <Image
                                                    src={selectedCollection.poster_path ? `https://image.tmdb.org/t/p/w780${selectedCollection.poster_path}` : "/logo.avif"}
                                                    alt={selectedCollection.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            </div>

                                            <div className="flex-1 space-y-2 md:space-y-4 pb-2">
                                                <div className="flex items-center gap-2 text-blue-400 text-xs md:text-sm font-medium uppercase tracking-wider">
                                                    <Film size={14} />
                                                    <span>Cinematic Universe</span>
                                                </div>
                                                <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-none tracking-tight drop-shadow-2xl">
                                                    {selectedCollection.name}
                                                </h2>

                                                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-base text-gray-300 font-medium">
                                                    <div className="flex items-center gap-1.5 text-blue-400 bg-blue-400/10 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md border border-blue-400/20">
                                                        <Film className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span>{selectedCollection.parts.length} Movies</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md">
                                                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span>Release Order</span>
                                                    </div>
                                                </div>

                                                {selectedCollection.overview && (
                                                    <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-2 max-w-2xl">
                                                        {selectedCollection.overview}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 bg-[#0a0a0a] px-4 md:px-8 pb-20">
                                        <div className="max-w-6xl mx-auto w-full pt-6 md:pt-8">
                                            <div className="flex items-center gap-3 mb-6 md:mb-8">
                                                <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                                <h3 className="text-xl md:text-2xl font-bold text-white">Movies in Release Order</h3>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                                {visibleMovies.map((movie, index) => (
                                                    <div key={movie.id} className="group relative">
                                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                                                            <ContentCard item={movie} type="movie" />
                                                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-xs font-bold text-white shadow-lg min-w-[28px] text-center">
                                                                {index + 1}
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 px-0.5">
                                                            <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                                <Calendar size={12} />
                                                                {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {visibleMovies.length < sortedMovies.length && (
                                                <div className="py-8 flex justify-center">
                                                    <Button
                                                        onClick={loadMoreMovies}
                                                        variant="outline"
                                                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full px-6"
                                                    >
                                                        Load More Movies
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
