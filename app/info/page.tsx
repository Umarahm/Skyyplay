"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Play, List, RefreshCcw, Star, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar"
import { TMDBApi } from "@/lib/tmdb"
import type { Movie, TVShow, Season } from "@/lib/tmdb"
import { InfoSidebar } from "@/components/InfoSidebar"
import { WatchlistButton } from "@/components/WatchlistButton"
import { useWatchlist } from "@/hooks/useWatchlist"
import { motion, AnimatePresence } from "framer-motion"
import { isMovie } from "@/lib/tmdb"
import { useIsMobile } from "@/hooks/use-mobile"

function InfoPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const isMobile = useIsMobile()
    const [content, setContent] = useState<Movie | TVShow | null>(null)
    const [contentId, setContentId] = useState<number | null>(null)
    const [contentType, setContentType] = useState<"movie" | "tv" | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"overview" | "casts" | "reviews" | "related" | "episodes">("overview")
    const [seasons, setSeasons] = useState<number[]>([])
    const [selectedSeason, setSelectedSeason] = useState(1)
    const [seasonData, setSeasonData] = useState<Season | null>(null)
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false)
    const { isInWatchlist } = useWatchlist()
    const [isSidebarHovered, setIsSidebarHovered] = useState(false)
    const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0)

    useEffect(() => {
        const id = searchParams.get("id")
        const type = searchParams.get("type")

        if (id && type) {
            setContentId(Number.parseInt(id))
            setContentType(type as "movie" | "tv")
            fetchContent(Number.parseInt(id), type as "movie" | "tv")
        }
    }, [searchParams])

    useEffect(() => {
        if (content?.images?.backdrops && content.images.backdrops.length > 1) {
            const timer = setTimeout(() => {
                setCurrentBackdropIndex((prevIndex) => (prevIndex + 1) % content.images!.backdrops.length)
            }, 7000) // Change image every 7 seconds
            return () => clearTimeout(timer)
        }
    }, [currentBackdropIndex, content])

    const fetchContent = async (id: number, type: "movie" | "tv") => {
        setIsLoading(true)
        try {
            const data = type === "movie" ? await TMDBApi.getMovieDetails(id) : await TMDBApi.getTVShowDetails(id)
            setContent(data)

            if (type === "tv" && "seasons" in data && data.seasons) {
                // Filter out seasons with season_number 0, which are often specials
                const validSeasons = data.seasons
                    .filter(s => s.season_number > 0)
                    .map(s => s.season_number)
                    .sort((a, b) => a - b)

                setSeasons(validSeasons)

                if (validSeasons.length > 0) {
                    await updateEpisodes(id, validSeasons[0])
                    setSelectedSeason(validSeasons[0])
                }
            }
        } catch (error) {
            console.error("Error fetching content:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const updateEpisodes = async (tvId: number, seasonNumber: number) => {
        setIsLoadingEpisodes(true)
        try {
            const data = await TMDBApi.getSeasonDetails(tvId, seasonNumber)
            setSeasonData(data)
        } catch (error) {
            console.error("Error fetching episodes:", error)
        } finally {
            setIsLoadingEpisodes(false)
        }
    }

    const handleSeasonChange = async (season: number) => {
        setSelectedSeason(season)
        if (contentId) {
            await updateEpisodes(contentId, season)
        }
    }

    const handleWatch = () => {
        if (contentId && contentType) {
            router.push(`/watch?id=${contentId}&type=${contentType}`)
        }
    }

    const handleShare = async () => {
        const currentUrl = window.location.href
        const title = "title" in content! ? content!.title : content!.name

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Watch ${title}`,
                    text: `Check out ${title} on SkyPlay!`,
                    url: currentUrl,
                })
            } catch (error) {
                console.log('Error sharing:', error)
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(currentUrl)
                // You could add a toast notification here
                console.log('Link copied to clipboard')
            } catch (error) {
                console.log('Error copying to clipboard:', error)
            }
        }
    }

    if (isLoading) {
        return (
            <div className="info-page-container">
                <Navbar />
                <div className="absolute inset-0 bg-black" />
                {isMobile ? (
                    // Mobile loading layout
                    <div className="info-content-container">
                        <div className="info-left-panel">
                            <div className="w-[120px] h-[180px] bg-white/5 rounded-lg animate-pulse flex-shrink-0" />
                            <div className="flex-1 ml-4 h-[180px] bg-white/5 rounded-lg animate-pulse" />
                        </div>
                        <div className="info-sidebar-container">
                            <div className="flex gap-2 mb-6 justify-around">
                                <div className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />
                                <div className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />
                                <div className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                <div className="h-24 w-full bg-white/5 rounded-lg animate-pulse" />
                                <div className="h-32 w-full bg-white/5 rounded-lg animate-pulse" />
                                <div className="h-16 w-full bg-white/5 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </div>
                ) : (
                    // Desktop loading layout with animations
                    <motion.div
                        className="info-content-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="info-left-panel">
                            <div className="w-[200px] h-[300px] bg-white/5 rounded-lg animate-pulse" />
                            <div className="w-full max-w-md h-[92px] bg-white/5 rounded-lg animate-pulse" />
                        </div>
                        <div className="info-sidebar-container !w-[384px] border-l-0">
                            <div className="flex gap-4 mb-6">
                                <div className="h-8 w-24 bg-white/5 rounded-full animate-pulse" />
                                <div className="h-8 w-24 bg-white/5 rounded-full animate-pulse" />
                                <div className="h-8 w-24 bg-white/5 rounded-full animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                <div className="h-24 w-full bg-white/5 rounded-lg animate-pulse" />
                                <div className="h-32 w-full bg-white/5 rounded-lg animate-pulse" />
                                <div className="h-16 w-full bg-white/5 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        )
    }

    if (!content) {
        return <div className="w-screen h-screen bg-black flex items-center justify-center">Content not found.</div>
    }

    const title = "title" in content ? content.title : content.name
    const isAddedToWatchlist = contentId && contentType && isInWatchlist(contentId, contentType);
    const backdrops = content.images?.backdrops || []

    return (
        <div className="info-page-container">
            <Navbar />
            {!isMobile && (
                <div className="info-backdrop">
                    {/* Animated backdrop for desktop only */}
                    <AnimatePresence>
                        <motion.div
                            key={currentBackdropIndex}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{
                                opacity: 1,
                                scale: isSidebarHovered ? 1.1 : 1.05
                            }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{
                                opacity: { duration: 1.5, ease: "easeInOut" },
                                scale: { type: "spring", stiffness: 100, damping: 20 }
                            }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={backdrops.length > 0 ? `https://image.tmdb.org/t/p/original${backdrops[currentBackdropIndex].file_path}` : (content.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : "/placeholder.jpg")}
                                alt={title}
                                fill
                                className="object-cover"
                                priority={currentBackdropIndex === 0}
                                loading={currentBackdropIndex === 0 ? "eager" : "lazy"}
                                placeholder="blur"
                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                            />
                        </motion.div>
                    </AnimatePresence>
                    <div className="info-backdrop-gradient" />
                </div>
            )}

            {isMobile ? (
                // Mobile layout: stacked content
                <div className="info-content-container">
                    <div className="info-left-panel">
                        <div className="info-poster-card">
                            <Image
                                src={content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : "/logo.avif"}
                                alt={title}
                                fill
                                className="info-poster-image"
                            />
                            <div className="info-rating-badge">{content.vote_average.toFixed(1)}</div>
                        </div>
                        <div className="info-action-card">
                            <div className="flex-grow">
                                <h1 className="info-action-title">{title}</h1>
                                <div className="info-action-buttons mt-2">
                                    <Button onClick={handleWatch} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                                        <Play className="w-4 h-4 mr-2" />
                                        Watch
                                    </Button>
                                    <WatchlistButton
                                        item={content}
                                        type={contentType!}
                                        size="md"
                                        className={`${isAddedToWatchlist ? 'bg-purple-600/90' : 'bg-white/20'}`}
                                    />
                                    <Button onClick={handleShare} variant="outline" className="text-white border-white/50">
                                        <Share2 className="w-4 h-4 mr-2" />

                                    </Button>
                                </div>
                            </div>
                            <div className="info-action-type">{contentType}</div>
                        </div>
                    </div>

                    <div className="info-sidebar-container">
                        <InfoSidebar
                            content={content}
                            contentType={contentType!}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            isSidebarHovered={false}
                            seasons={seasons}
                            selectedSeason={selectedSeason}
                            seasonData={seasonData}
                            isLoadingEpisodes={isLoadingEpisodes}
                            onSeasonChange={handleSeasonChange}
                        />
                    </div>
                </div>
            ) : (
                // Desktop layout: with animations
                <motion.div
                    className="info-content-container"
                    animate={{ paddingRight: isSidebarHovered ? '2rem' : '0rem' }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                    <motion.div
                        className="info-left-panel"
                        animate={{ width: isSidebarHovered ? 'calc(100% - 512px)' : 'calc(100% - 384px)' }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    >
                        <div className="info-poster-card">
                            <Image
                                src={content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : "/logo.avif"}
                                alt={title}
                                fill
                                className="info-poster-image"
                            />
                            <div className="info-rating-badge">{content.vote_average.toFixed(1)}</div>
                        </div>
                        <div className="info-action-card">
                            <div className="flex-grow">
                                <h1 className="info-action-title">{title}</h1>
                                <div className="info-action-buttons mt-2">
                                    <Button onClick={handleWatch} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                                        <Play className="w-4 h-4 mr-2" />
                                        Watch
                                    </Button>
                                    <WatchlistButton
                                        item={content}
                                        type={contentType!}
                                        size="md"
                                        className={`!w-10 !h-10 ${isAddedToWatchlist ? 'bg-purple-600/90' : 'bg-white/20'}`}
                                    />
                                    <Button onClick={handleShare} variant="outline" className="text-white border-white/50">
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share
                                    </Button>
                                </div>
                            </div>
                            <div className="info-action-type">{contentType}</div>
                        </div>
                    </motion.div>

                    <motion.div
                        onMouseEnter={() => setIsSidebarHovered(true)}
                        onMouseLeave={() => setIsSidebarHovered(false)}
                        animate={{ width: isSidebarHovered ? 512 : 384 }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    >
                        <InfoSidebar
                            content={content}
                            contentType={contentType!}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            isSidebarHovered={isSidebarHovered}
                            seasons={seasons}
                            selectedSeason={selectedSeason}
                            seasonData={seasonData}
                            isLoadingEpisodes={isLoadingEpisodes}
                            onSeasonChange={handleSeasonChange}
                        />
                    </motion.div>
                </motion.div>
            )}
        </div>
    )
}

export default function InfoPage() {
    return (
        <Suspense fallback={
            <div className="info-page-container">
                <Navbar />
                <div className="absolute inset-0 bg-black" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 animate-spin">
                            <img src="/logo.avif" alt="Loading" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Loading...</h1>
                    </div>
                </div>
            </div>
        }>
            <InfoPageContent />
        </Suspense>
    )
} 