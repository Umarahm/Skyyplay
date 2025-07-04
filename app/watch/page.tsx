"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Navbar } from "@/components/Navbar"
import { ContentCard } from "@/components/ContentCard"
import { TMDBApi, type Movie, type TVShow, type Season } from "@/lib/tmdb"
import { availableSources } from "@/lib/sources"
// import { AdblockerModal } from "@/components/AdblockerModal"

export default function WatchPage() {
  const searchParams = useSearchParams()
  const [content, setContent] = useState<Movie | TVShow | null>(null)
  const [contentId, setContentId] = useState<number | null>(null)
  const [contentType, setContentType] = useState<"movie" | "tv" | null>(null)
  const [isShow, setIsShow] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [seasons, setSeasons] = useState<number[]>([])
  const [seasonData, setSeasonData] = useState<Season | null>(null)
  const [selectedSource, setSelectedSource] = useState("")
  const [currentVideoUrl, setCurrentVideoUrl] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [similarContent, setSimilarContent] = useState<(Movie | TVShow)[]>([])
  const [sections, setSections] = useState({
    overview: true,
    details: true,
    cast: false,
    production: true,
    trailers: true,
  })
  const [castPage, setCastPage] = useState(0)

  useEffect(() => {
    const id = searchParams.get("id")
    const type = searchParams.get("type")

    if (id && type) {
      setContentId(Number.parseInt(id))
      setContentType(type as "movie" | "tv")
      setIsShow(type === "tv")

      // Set default source from localStorage
      const defaultSource = localStorage.getItem("defaultSource") || "rive"
      setSelectedSource(defaultSource)

      fetchContent(Number.parseInt(id), type as "movie" | "tv")
    }
  }, [searchParams])

  useEffect(() => {
    if (contentId && contentType) {
      updateVideoUrl()
    }
  }, [selectedSource, selectedSeason, selectedEpisode])

  const fetchContent = async (id: number, type: "movie" | "tv") => {
    setIsLoading(true)
    try {
      const data = type === "movie" ? await TMDBApi.getMovieDetails(id) : await TMDBApi.getTVShowDetails(id)

      setContent(data)

      if (type === "tv" && "number_of_seasons" in data) {
        const seasonCount = typeof data.number_of_seasons === "number" && data.number_of_seasons > 0 ? data.number_of_seasons : 0
        const seasonNumbers = Array.from({ length: seasonCount }, (_, i) => i + 1)
        setSeasons(seasonNumbers)
        await updateEpisodes(id, 1)
      }

      if (data.similar?.results) {
        setSimilarContent(data.similar.results.slice(0, 6))
      }
    } catch (error) {
      console.error("Error fetching content:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateEpisodes = async (tvId: number, seasonNumber: number) => {
    setIsLoadingEpisodes(true)

    // Add loading animation to season button
    const seasonButton = document.querySelector(`[data-season="${seasonNumber}"]`)
    if (seasonButton) {
      seasonButton.classList.add("season-btn-loading")
    }

    try {
      // Minimum loading time for smooth animation
      const [data] = await Promise.all([
        TMDBApi.getSeasonDetails(tvId, seasonNumber),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ])

      setSeasonData(data)
      setSelectedEpisode(1)

      // Trigger episode card animations after loading
      setTimeout(() => {
        animateEpisodeCards()
      }, 100)
    } catch (error) {
      console.error("Error fetching episodes:", error)
    } finally {
      setIsLoadingEpisodes(false)

      // Remove loading animation from season button
      if (seasonButton) {
        seasonButton.classList.remove("season-btn-loading")
      }
    }
  }

  const animateEpisodeCards = () => {
    const episodeCards = document.querySelectorAll(".episode-card")
    episodeCards.forEach((card, index) => {
      card.classList.add("episode-card-animated")

      // Remove animation class after it completes
      setTimeout(
        () => {
          card.classList.remove("episode-card-animated")
        },
        500 + index * 50,
      )
    })
  }

  const updateVideoUrl = () => {
    const source = availableSources.find((s) => s.id === selectedSource)
    if (!source || !contentId) return

    const params = isShow ? { id: contentId, season: selectedSeason, episode: selectedEpisode } : { id: contentId }

    let url = source.urls[isShow ? "tv" : "movie"]
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value.toString())
    })

    setCurrentVideoUrl(url)
  }

  const toggleSection = (section: keyof typeof sections) => {
    setSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSeasonChange = async (season: number) => {
    setSelectedSeason(season)
    if (contentId) {
      await updateEpisodes(contentId, season)
    }
  }

  const loadEpisode = (episodeNumber: number) => {
    setSelectedEpisode(episodeNumber)
    updateVideoUrl()
  }

  const displayedCast = content?.credits?.cast?.slice(castPage * 6, (castPage + 1) * 6) || []
  const maxCastPage = Math.max(0, Math.ceil((content?.credits?.cast?.length || 0) / 6) - 1)

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar showSearch={false} />

        <div className="pt-16">
          {/* Backdrop Skeleton */}
          <div className="relative h-[30vh] sm:h-[40vh] md:h-[60vh] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

              {/* Floating particles effect */}
              <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-pulse"
                    style={{
                      left: `${(i * 47 + 13) % 100}%`,
                      top: `${(i * 31 + 7) % 100}%`,
                      animationDelay: `${(i * 0.1) % 2}s`,
                      animationDuration: `${2 + (i * 0.2) % 2}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-12">
              {/* Title Skeleton */}
              <div className="mb-4 space-y-3">
                <div className="h-8 md:h-12 lg:h-16 bg-gradient-to-r from-purple-600/40 to-purple-400/40 rounded-lg animate-pulse shimmer" />
                <div className="h-4 md:h-6 bg-gradient-to-r from-gray-600/40 to-gray-400/40 rounded w-3/4 animate-pulse shimmer" />
              </div>

              {/* Metadata Skeleton */}
              <div className="flex items-center flex-wrap gap-2 md:gap-4 mb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 md:h-5 bg-gray-600/40 rounded w-16 md:w-20 animate-pulse shimmer" />
                ))}
              </div>

              {/* Genre Tags Skeleton */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 md:h-8 bg-purple-600/30 rounded-full w-20 md:w-24 animate-pulse shimmer"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Left Column - Video Player & Episodes */}
              <div className="lg:col-span-2 space-y-6">
                {/* We Recommend Section */}
                <div className="content-section rounded-lg p-4 md:p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 md:h-6 md:w-6 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.908c.97 0 1.371 1.24.588 1.81l-3.974 2.884a1 1 0 00-.364 1.118l1.518 4.674c.3.921-.754 1.688-1.54 1.118l-3.974-2.884a1 1 0 00-1.176 0l-3.974 2.884c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.59 10.101c-.783-.57-.38-1.81.588-1.81h4.909a1 1 0 00.95-.69l1.518-4.674z"
                      />
                    </svg>
                    <h3 className="text-lg md:text-xl font-semibold">We Recommend</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['vidsrccc', 'spenflix', 'rive'].map((id) => {
                      const source = availableSources.find((s) => s.id === id)
                      if (!source) return null
                      return (
                        <button
                          key={id}
                          onClick={() => setSelectedSource(id)}
                          className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all duration-300 text-sm md:text-base ${selectedSource === id ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          {source.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Video Player Skeleton */}
                <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-purple-700/20">
                  <div className="relative pt-[56.25%]">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg">
                      {/* Play button skeleton */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-purple-600/40 rounded-full animate-pulse shimmer flex items-center justify-center">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-white/60 rounded-sm animate-pulse" />
                        </div>
                      </div>

                      {/* Loading waves */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 animate-pulse">
                        <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 md:p-4">
                    <div className="h-4 bg-gray-600/40 rounded w-2/3 mx-auto animate-pulse shimmer" />
                  </div>
                </div>

                {/* Episodes Skeleton */}
                <div className="content-section rounded-lg p-4 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-purple-400/40 rounded animate-pulse shimmer" />
                      <div className="h-6 bg-gray-600/40 rounded w-24 animate-pulse shimmer" />
                    </div>
                    <div className="w-8 h-8 bg-gray-600/40 rounded animate-pulse shimmer" />
                  </div>

                  {/* Season buttons skeleton */}
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 h-10 bg-gray-600/40 rounded-lg w-16 animate-pulse shimmer"
                      />
                    ))}
                  </div>

                  {/* Episode cards skeleton */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg animate-pulse shimmer relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-600/40 rounded w-3/4 animate-pulse shimmer" />
                          <div className="h-3 bg-gray-700/40 rounded w-1/2 animate-pulse shimmer" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Source Selector Skeleton */}
                <div className="content-section rounded-lg p-4 md:p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-400/40 rounded animate-pulse shimmer" />
                    <div className="h-6 bg-gray-600/40 rounded w-20 animate-pulse shimmer" />
                  </div>

                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-600/40 rounded w-32 animate-pulse shimmer" />
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="h-10 bg-gray-600/40 rounded-lg w-20 animate-pulse shimmer" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Content Details */}
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="content-section rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-purple-400/40 rounded animate-pulse shimmer" />
                        <div className="h-6 bg-gray-600/40 rounded w-24 animate-pulse shimmer" />
                      </div>
                      <div className="w-5 h-5 bg-gray-600/40 rounded animate-pulse shimmer" />
                    </div>

                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-4 bg-gray-600/40 rounded w-full animate-pulse shimmer" />
                          <div className="h-4 bg-gray-700/40 rounded w-3/4 animate-pulse shimmer" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Content Skeleton */}
            <div className="mt-8 md:mt-12">
              <div className="h-8 bg-gradient-to-r from-purple-600/40 to-purple-400/40 rounded w-48 mb-6 animate-pulse shimmer" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg animate-pulse shimmer relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-600/40 rounded w-full animate-pulse shimmer" />
                      <div className="h-3 bg-gray-700/40 rounded w-2/3 animate-pulse shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay with Logo */}
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <img src="/logo.avif" alt="SkyyPlay Logo" className="w-24 h-24 loading-logo" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 logo-text">Loading Content</h2>
            <p className="text-gray-400">Please wait while we fetch your content...</p>

            {/* Progress bar */}
            <div className="w-64 h-1 bg-gray-700 rounded-full mt-4 mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full animate-loading-progress" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Content not found</h2>
          <p className="text-gray-400">The requested content could not be loaded.</p>
        </div>
      </div>
    )
  }

  const title = "title" in content ? content.title : content.name

  return (
    <div className="min-h-screen">
      <Navbar showSearch={false} />

      <div className="pt-16">
        {/* Backdrop */}
        <div className="relative h-[30vh] sm:h-[40vh] md:h-[60vh]">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={content.backdrop_path
                ? `https://image.tmdb.org/t/p/w780${content.backdrop_path}`
                : "/logo.avif"
              }
              alt={`${title} backdrop`}
              fill
              className="object-cover scale-105"
              priority
              quality={60}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+i"
              loading="eager"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-12">
            {/* Title logo or text */}
            {content.images?.logos && content.images.logos.length > 0 ? (
              <div className="mb-4">
                <img
                  src={`https://image.tmdb.org/t/p/w500${content.images.logos[0].file_path}`}
                  className="max-h-24 md:max-h-32 w-auto"
                  alt={`${title} logo`}
                />
              </div>
            ) : (
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold tracking-wide logo-text">
                {title}
              </h1>
            )}

            <div className="mt-3 md:mt-4 flex items-center flex-wrap gap-2 md:gap-4 text-xs md:text-sm lg:text-base text-gray-300">
              {"release_date" in content && content.release_date && (
                <span>{new Date(content.release_date).getFullYear()}</span>
              )}
              {"first_air_date" in content && content.first_air_date && (
                <span>{new Date(content.first_air_date).getFullYear()}</span>
              )}
              {"runtime" in content && content.runtime && (
                <span>
                  {Math.floor(content.runtime / 60)}h {content.runtime % 60}m
                </span>
              )}
              {content.vote_average && (
                <div className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{content.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
              {content.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="px-2 md:px-3 py-1 text-xs md:text-sm bg-black/30 backdrop-blur-sm rounded-full text-gray-300 border border-purple-500/20"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Video Player */}
            <div className="lg:col-span-2 space-y-6">
              {/* We Recommend Section */}
              <div className="content-section rounded-lg p-4 md:p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 md:h-6 md:w-6 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.908c.97 0 1.371 1.24.588 1.81l-3.974 2.884a1 1 0 00-.364 1.118l1.518 4.674c.3.921-.754 1.688-1.54 1.118l-3.974-2.884a1 1 0 00-1.176 0l-3.974 2.884c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.59 10.101c-.783-.57-.38-1.81.588-1.81h4.909a1 1 0 00.95-.69l1.518-4.674z"
                    />
                  </svg>
                  <h3 className="text-lg md:text-xl font-semibold">We Recommend</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['vidsrccc', 'spenflix', 'rive'].map((id) => {
                    const source = availableSources.find((s) => s.id === id)
                    if (!source) return null
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedSource(id)}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all duration-300 text-sm md:text-base ${selectedSource === id ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {source.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Video Player with Purple Backdrop */}
              <div className="video-container rounded-lg overflow-hidden relative mobile-video-container">
                {/* Purple backdrop */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-purple-700/30 pointer-events-none z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none z-0"></div>

                {/* Responsive iframe container with mobile optimizations */}
                <div className="relative w-full z-10">
                  <div className="relative w-full h-0 pb-[56.25%] min-h-[250px] sm:min-h-[300px] md:min-h-0 md:pb-[56.25%]">
                    <iframe
                      src={currentVideoUrl}
                      className="absolute top-0 left-0 w-full h-full rounded-lg touch-manipulation mobile-iframe"
                      frameBorder="0"
                      scrolling="no"
                      allowFullScreen
                      referrerPolicy="no-referrer"
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      style={{
                        border: 'none',
                        backgroundColor: '#000'
                      }}
                    />
                  </div>
                </div>
                <div className="p-3 md:p-4 relative z-10">
                  <div className="flex items-center justify-between text-xs md:text-sm text-gray-400">
                    <div className="text-center mx-auto animated-text">
                      {(() => {
                        try {
                          // Get runtime from movie or TV show
                          const runtime =
                            ("runtime" in content && typeof content.runtime === "number"
                              ? content.runtime
                              : contentType === "tv" &&
                                "episode_run_time" in content &&
                                Array.isArray(content.episode_run_time) &&
                                content.episode_run_time.length > 0
                                ? content.episode_run_time[0]
                                : 0)

                          if (runtime && runtime > 0) {
                            const now = new Date()
                            const endTime = new Date(now.getTime() + runtime * 60000)

                            // More compatible time formatting
                            const timeString = endTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })

                            return (
                              <>
                                <span>If you start now, it'll end at </span>
                                <span className="text-purple-400 font-medium">{timeString}</span>
                              </>
                            )
                          }

                          return null
                        } catch (error) {
                          console.error("Error calculating end time:", error)
                          return null
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Episode Selector for TV Shows */}
              {isShow && (
                <div className="content-section rounded-lg p-4 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-6 md:w-6 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                        />
                      </svg>
                      <h3 className="text-lg md:text-xl font-semibold">Episodes</h3>
                    </div>
                    <button
                      onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                    >
                      {viewMode === "grid" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400 hover:text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 10h16M4 14h16M4 18h16"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400 hover:text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Season Selector */}
                  <div className="relative">
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                      {seasons.map((season) => (
                        <button
                          key={season}
                          data-season={season}
                          onClick={() => handleSeasonChange(season)}
                          className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${selectedSeason === season ? "btn-primary" : "btn-secondary"
                            }`}
                        >
                          S{season}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Episodes Container */}
                  <div className="episodes-container">
                    <div
                      className={`episodes-fade-enter ${viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" : "space-y-4"
                        }`}
                    >
                      {/* Loading Skeletons */}
                      {isLoadingEpisodes && (
                        <>
                          {Array.from({ length: 8 }).map((_, index) => (
                            <div key={`skeleton-${index}`} className="episode-skeleton rounded-lg overflow-hidden">
                              <div className="aspect-video bg-gray-700"></div>
                              <div className="p-3 space-y-2">
                                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Actual Episodes */}
                      {!isLoadingEpisodes &&
                        seasonData?.episodes?.map((episode) => (
                          <div
                            key={episode.episode_number}
                            onClick={() => loadEpisode(episode.episode_number)}
                            className={`episode-card cursor-pointer ${viewMode === "grid"
                              ? "rounded-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                              : "rounded-lg overflow-hidden hover:bg-gray-600 transition-colors"
                              } ${selectedEpisode === episode.episode_number ? "selected" : ""}`}
                          >
                            {viewMode === "grid" ? (
                              <div>
                                <div className="relative aspect-video">
                                  <img
                                    src={
                                      episode.still_path
                                        ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
                                        : "/placeholder.svg?height=169&width=300"
                                    }
                                    alt={episode.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <span className="text-sm font-medium">Episode {episode.episode_number}</span>
                                  </div>
                                </div>
                                <div className="p-3">
                                  <h4 className="font-medium text-sm line-clamp-1">{episode.name}</h4>
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                    {episode.overview || "No description available."}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start p-3 space-x-3">
                                <div className="relative w-32 flex-shrink-0">
                                  <img
                                    src={
                                      episode.still_path
                                        ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
                                        : "/placeholder.svg?height=169&width=300"
                                    }
                                    alt={episode.name}
                                    className="w-full aspect-video object-cover rounded"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-400">
                                      Episode {episode.episode_number}
                                    </span>
                                    <span className="text-xs text-gray-500">{episode.air_date}</span>
                                  </div>
                                  <h4 className="font-medium mt-1">{episode.name}</h4>
                                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                    {episode.overview || "No description available."}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Source Selector */}
              <div className="content-section rounded-lg p-4 md:p-6">
                <div className="flex items-center space-x-3 mb-3 md:mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 md:h-6 md:w-6 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg md:text-xl font-semibold">Stream</h3>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm md:text-base text-gray-300 font-medium">English Sources:</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableSources
                        .filter((source) => !source.isFrench)
                        .map((source) => (
                          <button
                            key={source.id}
                            onClick={() => setSelectedSource(source.id)}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all duration-300 text-sm md:text-base ${selectedSource === source.id ? "btn-primary" : "btn-secondary"
                              }`}
                          >
                            {source.name}
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm md:text-base text-gray-300 font-medium">French Sources:</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableSources
                        .filter((source) => source.isFrench)
                        .map((source) => (
                          <button
                            key={source.id}
                            onClick={() => setSelectedSource(source.id)}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all duration-300 text-sm md:text-base ${selectedSource === source.id ? "btn-primary" : "btn-secondary"
                              }`}
                          >
                            {source.name}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content Details */}
            <div className="space-y-6">
              {/* Overview */}
              <div className="content-section rounded-lg p-6">
                <div
                  className="flex items-center justify-between section-header cursor-pointer"
                  onClick={() => toggleSection("overview")}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-400"
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
                    <h3 className="text-xl font-semibold">Overview</h3>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transform transition-transform duration-300 ${sections.overview ? "rotate-180" : ""
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className={`section-content mt-4 ${sections.overview ? "expanded" : "collapsed"}`}>
                  <p className="text-gray-300">{content.overview}</p>
                </div>
              </div>

              {/* Details */}
              <div className="content-section rounded-lg p-6">
                <div
                  className="flex items-center justify-between section-header cursor-pointer"
                  onClick={() => toggleSection("details")}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-400"
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
                    <h3 className="text-xl font-semibold">Details</h3>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transform transition-transform duration-300 ${sections.details ? "rotate-180" : ""
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className={`section-content mt-4 ${sections.details ? "expanded" : "collapsed"}`}>
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      <span className="font-medium">Status:</span>
                      <span className="ml-2">{content.status}</span>
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Release Date:</span>
                      <span className="ml-2">
                        {"release_date" in content ? content.release_date : content.first_air_date}
                      </span>
                    </p>
                    {isShow && "number_of_seasons" in content && (
                      <p className="text-gray-300">
                        <span className="font-medium">Seasons:</span>
                        <span className="ml-2">{content.number_of_seasons}</span>
                      </p>
                    )}
                    <p className="text-gray-300">
                      <span className="font-medium">Rating: ⭐</span>
                      <span className="ml-2">
                        {content.vote_average?.toFixed(1)}/10 ({content.vote_count} votes)
                      </span>
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Genres:</span>
                      <span className="ml-2">{content.genres?.map((g) => g.name).join(", ")}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Cast */}
              <div className="content-section rounded-lg p-6">
                <div
                  className="flex items-center justify-between section-header cursor-pointer"
                  onClick={() => toggleSection("cast")}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold">Cast</h3>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transform transition-transform duration-300 ${sections.cast ? "rotate-180" : ""
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className={`section-content mt-4 ${sections.cast ? "expanded" : "collapsed"}`}>
                  <div className="relative overflow-visible px-6">
                    <button
                      onClick={() => castPage > 0 && setCastPage(castPage - 1)}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 bg-gray-900 p-2 rounded-full hover:bg-gray-700 transition-all duration-300 z-20 ${castPage === 0 ? "opacity-50 cursor-not-allowed" : "opacity-100"
                        }`}
                      aria-label="Previous cast page"
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative overflow-hidden">
                      {displayedCast.map((actor) => (
                        <div key={actor.id} className="flex items-center space-x-3">
                          <div className="w-12 h-12 flex-shrink-0">
                            {actor.profile_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                alt={actor.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                                ?
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{actor.name}</p>
                            <p className="text-gray-400 text-xs">{actor.character}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => castPage < maxCastPage && setCastPage(castPage + 1)}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 bg-gray-900 p-2 rounded-full hover:bg-gray-700 transition-all duration-300 z-20 ${castPage >= maxCastPage ? "opacity-50 cursor-not-allowed" : "opacity-100"
                        }`}
                      aria-label="Next cast page"
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
                  <div className="flex justify-center mt-4 space-x-1">
                    {Array.from({ length: maxCastPage + 1 }).map((_, page) => (
                      <button
                        key={page}
                        onClick={() => setCastPage(page)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${castPage === page ? "bg-purple-500" : "bg-gray-600 hover:bg-gray-500"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Production Info */}
              <div className="content-section rounded-lg p-6">
                <div
                  className="flex items-center justify-between section-header cursor-pointer"
                  onClick={() => toggleSection("production")}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold">Production Info</h3>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transform transition-transform duration-300 ${sections.production ? "rotate-180" : ""
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className={`section-content mt-4 ${sections.production ? "expanded" : "collapsed"}`}>
                  <div className="space-y-2">
                    {content.production_companies && content.production_companies.length > 0 && (
                      <p className="text-gray-300">
                        <span className="font-medium">Studios:</span>
                        <span className="ml-2">{content.production_companies.map((c) => c.name).join(", ")}</span>
                      </p>
                    )}
                    {content.production_countries && content.production_countries.length > 0 && (
                      <p className="text-gray-300">
                        <span className="font-medium">Countries:</span>
                        <span className="ml-2">{content.production_countries.map((c) => c.name).join(", ")}</span>
                      </p>
                    )}
                    {content.spoken_languages && content.spoken_languages.length > 0 && (
                      <p className="text-gray-300">
                        <span className="font-medium">Languages:</span>
                        <span className="ml-2">{content.spoken_languages.map((l) => l.english_name).join(", ")}</span>
                      </p>
                    )}
                    {!isShow && "runtime" in content && content.runtime && (
                      <p className="text-gray-300">
                        <span className="font-medium">Runtime:</span>
                        <span className="ml-2">
                          {Math.floor(content.runtime / 60)}h {content.runtime % 60}m
                        </span>
                      </p>
                    )}
                    {"budget" in content && content.budget && (
                      <p className="text-gray-300">
                        <span className="font-medium">Budget:</span>
                        <span className="ml-2">${content.budget.toLocaleString()}</span>
                      </p>
                    )}
                    {"revenue" in content && content.revenue && (
                      <p className="text-gray-300">
                        <span className="font-medium">Revenue:</span>
                        <span className="ml-2">${content.revenue.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Trailers */}
              <div className="content-section rounded-lg p-6">
                <div
                  className="flex items-center justify-between section-header cursor-pointer"
                  onClick={() => toggleSection("trailers")}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold">Trailers & Videos</h3>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transform transition-transform duration-300 ${sections.trailers ? "rotate-180" : ""
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className={`section-content mt-4 ${sections.trailers ? "expanded" : "collapsed"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {content.videos?.results
                      ?.filter((video) => video.site === "YouTube" && video.type === "Trailer")
                      .map((video) => (
                        <div key={video.key} className="relative bg-gray-700 rounded-lg overflow-hidden">
                          <div className="relative w-full h-0 pb-[56.25%] min-h-[200px] sm:min-h-[250px] md:min-h-0 md:pb-[56.25%]">
                            <iframe
                              src={`https://www.youtube.com/embed/${video.key}`}
                              className="absolute inset-0 w-full h-full touch-manipulation mobile-iframe"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              style={{
                                border: 'none',
                                backgroundColor: '#000'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Content */}
          <div className="mt-8 md:mt-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 logo-text">Similar Content</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarContent.map((item) => (
                <ContentCard key={item.id} item={item} type={contentType!} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Streaming Services */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-300">Content Available From</h2>
          <p className="text-gray-400 mt-2">SkyyPlay aggregates content from various premium streaming platforms</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-center justify-items-center opacity-80">
          {[
            { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
            {
              name: "Prime Video",
              logo: "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
            },
            { name: "Disney+", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg" },
            { name: "Hulu", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Hulu_logo_%282018%29.svg" },
            { name: "HBO Max", logo: "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg" },
            { name: "Apple TV+", logo: "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg" },
          ].map((service) => (
            <div key={service.name} className="transform transition-transform hover:scale-105">
              <img
                src={service.logo || "/placeholder.svg"}
                alt={service.name}
                className="h-6 md:h-8 w-auto grayscale hover:grayscale-0 hover:scale-110 hover:brightness-125 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-gray-400 py-4 md:py-6 mt-8 md:mt-12">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-xs md:text-sm">
            All rules and regulations of the respective streaming platforms apply. <br />
            This is a personal project and not affiliated with any streaming service.
          </p>
          <p className="mt-2 text-xs">Made with Next.js, Tailwind CSS, and TMDB API.</p>
          <p className="mt-2 text-xs text-purple-400">Made with ❤️ by nubDRAKE</p>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 brand-gradient text-white rounded-full p-4 shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 z-50 floating-button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  )
}
