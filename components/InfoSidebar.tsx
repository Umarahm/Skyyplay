"use client"

import Image from "next/image"
import type { Movie, TVShow, Season, Video, Review } from "@/lib/tmdb"
import { motion } from "framer-motion"
import { isMovie } from "@/lib/tmdb"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEffect } from "react"

interface InfoSidebarProps {
    content: Movie | TVShow
    contentType: "movie" | "tv"
    activeTab: "overview" | "casts" | "reviews" | "related" | "episodes"
    setActiveTab: (tab: "overview" | "casts" | "reviews" | "related" | "episodes") => void
    isSidebarHovered?: boolean
    seasons?: number[]
    selectedSeason?: number
    seasonData?: Season | null
    isLoadingEpisodes?: boolean
    onSeasonChange?: (season: number) => void
}

export function InfoSidebar({
    content,
    contentType,
    activeTab,
    setActiveTab,
    isSidebarHovered = false,
    seasons = [],
    selectedSeason = 1,
    seasonData,
    isLoadingEpisodes = false,
    onSeasonChange,
}: InfoSidebarProps) {
    const isMobile = useIsMobile()

    // Define tabs based on content type and device
    const allTabs = contentType === "tv"
        ? ["episodes", "overview", "casts", "reviews", "related"] as const
        : ["overview", "casts", "reviews", "related"] as const

    // Filter out reviews tab on mobile
    const tabs = isMobile
        ? allTabs.filter(tab => tab !== "reviews")
        : allTabs

    const runtime =
        contentType === "movie" && "runtime" in content && content.runtime
            ? `${Math.floor(content.runtime / 60)}hr ${content.runtime % 60}min`
            : contentType === "tv" && "episode_run_time" in content && Array.isArray(content.episode_run_time) && content.episode_run_time.length > 0
                ? `${content.episode_run_time[0]}min per episode`
                : null

    const hasCast = content.credits && content.credits.cast.length > 0;
    const hasReviews = content.reviews && content.reviews.results.length > 0;

    // Handle activeTab when switching between mobile and desktop
    useEffect(() => {
        if (isMobile && activeTab === "reviews") {
            // If on mobile and currently on reviews tab, switch to overview
            setActiveTab("overview")
        }
    }, [isMobile, activeTab, setActiveTab])

    return (
        <div className="info-sidebar-container scrollbar-hide">
            <div className={`info-sidebar-tabs ${isSidebarHovered ? "hovered" : ""}`}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`info-sidebar-tab ${activeTab === tab ? "active" : ""}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                isMobile ? (
                    <div className="space-y-6 text-white">
                        {isMovie(content) && content.tagline && <p className="text-lg italic text-gray-300">"{content.tagline}"</p>}
                        <p className="text-gray-300 leading-relaxed">{content.overview}</p>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                                <h3 className="font-bold text-gray-400">Release</h3>
                                <p>{new Date("release_date" in content ? content.release_date : content.first_air_date || "").toLocaleDateString()}</p>
                            </div>
                            {runtime && (
                                <div>
                                    <h3 className="font-bold text-gray-400">Runtime</h3>
                                    <p>{runtime}</p>
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-gray-400">Genre</h3>
                                <p>{content.genres?.map(g => g.name).join(', ')}</p>
                            </div>
                            {isMovie(content) && content.belongs_to_collection && (
                                <div>
                                    <h3 className="font-bold text-gray-400">Collection</h3>
                                    <p>{content.belongs_to_collection.name}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-white">
                        {isMovie(content) && content.tagline && <p className="text-lg italic text-gray-300">"{content.tagline}"</p>}
                        <p className="text-gray-300 leading-relaxed">{content.overview}</p>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                                <h3 className="font-bold text-gray-400">Release</h3>
                                <p>{new Date("release_date" in content ? content.release_date : content.first_air_date || "").toLocaleDateString()}</p>
                            </div>
                            {runtime && (
                                <div>
                                    <h3 className="font-bold text-gray-400">Runtime</h3>
                                    <p>{runtime}</p>
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-gray-400">Genre</h3>
                                <p>{content.genres?.map(g => g.name).join(', ')}</p>
                            </div>
                            {isMovie(content) && content.belongs_to_collection && (
                                <div>
                                    <h3 className="font-bold text-gray-400">Collection</h3>
                                    <p>{content.belongs_to_collection.name}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
            )}

            {activeTab === 'casts' && (
                isMobile ? (
                    <div className="space-y-4">
                        {hasCast ? content.credits?.cast.slice(0, 15).map(member => (
                            <div key={member.id} className="flex items-center gap-4">
                                <Image
                                    src={member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : '/placeholder-user.jpg'}
                                    alt={member.name}
                                    width={48}
                                    height={48}
                                    className="rounded-full object-cover"
                                    loading="lazy"
                                />
                                <div>
                                    <p className="font-bold text-white">{member.name}</p>
                                    <p className="text-sm text-gray-400">{member.character}</p>
                                </div>
                            </div>
                        )) : <p>No cast found for this title.</p>}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {hasCast ? content.credits?.cast.slice(0, 15).map(member => (
                            <div key={member.id} className="flex items-center gap-4">
                                <Image
                                    src={member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : '/placeholder-user.jpg'}
                                    alt={member.name}
                                    width={48}
                                    height={48}
                                    className="rounded-full object-cover"
                                    loading="lazy"
                                />
                                <div>
                                    <p className="font-bold text-white">{member.name}</p>
                                    <p className="text-sm text-gray-400">{member.character}</p>
                                </div>
                            </div>
                        )) : <p>No cast found for this title.</p>}
                    </motion.div>
                )
            )}

            {activeTab === 'reviews' && (
                isMobile ? (
                    <div className="space-y-4">
                        {hasReviews ? content.reviews?.results.map((review: Review) => (
                            <div key={review.id} className="bg-white/5 p-4 rounded-lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                        <Image
                                            src={review.author_details.avatar_path ? `https://image.tmdb.org/t/p/w185${review.author_details.avatar_path}` : '/placeholder-user.jpg'}
                                            alt={review.author}
                                            width={40}
                                            height={40}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{review.author}</p>
                                        <p className="text-xs text-gray-400">
                                            ⭐ {review.author_details.rating ? `${review.author_details.rating}/10` : 'Not rated'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{review.content}</p>
                            </div>
                        )) : <p>No reviews found for this title.</p>}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {hasReviews ? content.reviews?.results.map((review: Review) => (
                            <div key={review.id} className="bg-white/5 p-4 rounded-lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                        <Image
                                            src={review.author_details.avatar_path ? `https://image.tmdb.org/t/p/w185${review.author_details.avatar_path}` : '/placeholder-user.jpg'}
                                            alt={review.author}
                                            width={40}
                                            height={40}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{review.author}</p>
                                        <p className="text-xs text-gray-400">
                                            ⭐ {review.author_details.rating ? `${review.author_details.rating}/10` : 'Not rated'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{review.content}</p>
                            </div>
                        )) : <p>No reviews found for this title.</p>}
                    </motion.div>
                )
            )}

            {activeTab === 'related' && content.similar && (
                isMobile ? (
                    <div className="grid grid-cols-2 gap-4">
                        {content.similar.results.slice(0, 6).map(item => (
                            <a href={`/info?id=${item.id}&type=${contentType}`} key={item.id} className="inspiration-card group !w-full !h-auto aspect-[2/3]">
                                <Image
                                    src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/logo.avif'}
                                    alt={"title" in item ? item.title : item.name}
                                    fill
                                    className="inspiration-card-image"
                                    loading="lazy"
                                    placeholder="blur"
                                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                                />
                                <div className="inspiration-card-inner-shadow" />
                                <div className="inspiration-glass-overlay !opacity-100 !transform-none">
                                    <h3 className="text-sm font-semibold text-white line-clamp-2">{"title" in item ? item.title : item.name}</h3>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                        {content.similar.results.slice(0, 6).map(item => (
                            <a href={`/info?id=${item.id}&type=${contentType}`} key={item.id} className="inspiration-card group !w-full !h-auto aspect-[2/3]">
                                <Image
                                    src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/logo.avif'}
                                    alt={"title" in item ? item.title : item.name}
                                    fill
                                    className="inspiration-card-image"
                                    loading="lazy"
                                    placeholder="blur"
                                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                                />
                                <div className="inspiration-card-inner-shadow" />
                                <div className="inspiration-glass-overlay !opacity-100 !transform-none">
                                    <h3 className="text-sm font-semibold text-white line-clamp-2">{"title" in item ? item.title : item.name}</h3>
                                </div>
                            </a>
                        ))}
                    </motion.div>
                )
            )}

            {activeTab === 'episodes' && contentType === 'tv' && (
                isMobile ? (
                    <div>
                        <select
                            className="info-season-dropdown"
                            value={selectedSeason}
                            onChange={(e) => onSeasonChange && onSeasonChange(Number(e.target.value))}
                        >
                            {seasons.map(seasonNum => (
                                <option key={seasonNum} value={seasonNum}>
                                    Season {seasonNum}
                                </option>
                            ))}
                        </select>

                        {isLoadingEpisodes ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="relative w-32 h-20 flex-shrink-0 bg-white/5 rounded animate-pulse" />
                                        <div className="py-2 pr-2 flex-1">
                                            <div className="h-4 bg-white/5 rounded w-3/4 mb-2 animate-pulse" />
                                            <div className="h-3 bg-white/5 rounded w-full animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="episodes-container space-y-3">
                                {seasonData?.episodes?.map(episode => (
                                    <a href={`/watch?id=${content.id}&type=tv&season=${selectedSeason}&episode=${episode.episode_number}`} key={episode.id} className="episode-card-info-page flex gap-4 cursor-pointer">
                                        <div className="relative w-32 h-20 flex-shrink-0">
                                            <Image
                                                src={episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : (content.poster_path ? `https://image.tmdb.org/t/p/w342${content.poster_path}` : '/placeholder.svg')}
                                                alt={episode.name}
                                                fill
                                                className="object-cover rounded"
                                                loading="lazy"
                                                placeholder="blur"
                                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                                            />
                                        </div>
                                        <div className="py-2 pr-2">
                                            <h4 className="font-bold text-white">E{episode.episode_number}: {episode.name}</h4>
                                            <p className="text-sm text-gray-400 line-clamp-2">{episode.overview}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <select
                            className="info-season-dropdown"
                            value={selectedSeason}
                            onChange={(e) => onSeasonChange && onSeasonChange(Number(e.target.value))}
                        >
                            {seasons.map(seasonNum => (
                                <option key={seasonNum} value={seasonNum}>
                                    Season {seasonNum}
                                </option>
                            ))}
                        </select>

                        {isLoadingEpisodes ? (
                            <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{
                                visible: { transition: { staggerChildren: 0.1 } }
                            }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <motion.div key={i} className="flex gap-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                        <div className="relative w-32 h-20 flex-shrink-0 bg-white/5 rounded animate-pulse" />
                                        <div className="py-2 pr-2 flex-1">
                                            <div className="h-4 bg-white/5 rounded w-3/4 mb-2 animate-pulse" />
                                            <div className="h-3 bg-white/5 rounded w-full animate-pulse" />
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="episodes-container space-y-3">
                                {seasonData?.episodes?.map(episode => (
                                    <a href={`/watch?id=${content.id}&type=tv&season=${selectedSeason}&episode=${episode.episode_number}`} key={episode.id} className="episode-card-info-page flex gap-4 cursor-pointer">
                                        <div className="relative w-32 h-20 flex-shrink-0">
                                            <Image
                                                src={episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : (content.poster_path ? `https://image.tmdb.org/t/p/w342${content.poster_path}` : '/placeholder.svg')}
                                                alt={episode.name}
                                                fill
                                                className="object-cover rounded"
                                                loading="lazy"
                                                placeholder="blur"
                                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                                            />
                                        </div>
                                        <div className="py-2 pr-2">
                                            <h4 className="font-bold text-white">E{episode.episode_number}: {episode.name}</h4>
                                            <p className="text-sm text-gray-400 line-clamp-2">{episode.overview}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )
            )}
        </div>
    )
} 