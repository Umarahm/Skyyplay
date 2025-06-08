"use client"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/Navbar"
import { ContentCard } from "@/components/ContentCard"
import { TMDBApi, type Movie, type TVShow, type Genre } from "@/lib/tmdb"
import { WatchLaterProvider } from "@/contexts/WatchLaterContext"

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

  const observerRef = useRef<IntersectionObserver | null>(null)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
    try {
      await Promise.all([fetchCarouselContent(), fetchTop10Content(), fetchGenres(), generateCategorySections()])
    } catch (error) {
      console.error("Error initializing content:", error)
    } finally {
      setIsLoading(false)
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
    try {
      const [movieData, tvData] = await Promise.all([TMDBApi.getPopularMovies(1), TMDBApi.getPopularTVShows(1)])

      const combinedResults = [
        ...movieData.results.slice(0, 5).map((item) => ({ ...item, type: "movie" })),
        ...tvData.results.slice(0, 5).map((item) => ({ ...item, type: "tv" })),
      ]

      const shuffled = combinedResults.sort(() => 0.5 - Math.random()).slice(0, 8)
      setCarouselItems(shuffled)

      // Start carousel auto-rotation after setting items
      startCarouselAutoRotation()
    } catch (error) {
      console.error("Error fetching carousel content:", error)
    }
  }

  const fetchTop10Content = async () => {
    try {
      const data = currentTab === "movies" ? await TMDBApi.getPopularMovies(1) : await TMDBApi.getPopularTVShows(1)
      setTop10Items(data.results.slice(0, 10))
    } catch (error) {
      console.error("Error fetching top 10 content:", error)
    }
  }

  const fetchGenres = async () => {
    try {
      const data = currentTab === "movies" ? await TMDBApi.getMovieGenres() : await TMDBApi.getTVGenres()
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
      const availableGenres = allGenres.filter((genre) => data.genres.some((apiGenre) => apiGenre.id === genre.id))

      setGenres(availableGenres.slice(0, 12)) // Show up to 12 genres
    } catch (error) {
      console.error("Error fetching genres:", error)
    }
  }

  const generateCategorySections = async () => {
    const categoryGenres = [
      { id: 28, name: "Action" },
      { id: 35, name: "Comedy" },
      { id: 27, name: "Horror" },
      { id: 18, name: "Drama" },
      { id: 12, name: "Adventure" },
      { id: 14, name: "Fantasy" },
      { id: 878, name: "Science Fiction" },
      { id: 9648, name: "Mystery" },
      { id: 10749, name: "Romance" },
      { id: 53, name: "Thriller" },
    ]

    const shuffled = [...categoryGenres].sort(() => 0.5 - Math.random()).slice(0, 6)
    const newCategories: { [key: string]: (Movie | TVShow)[] } = {}

    for (const genre of shuffled) {
      try {
        const data =
          currentTab === "movies"
            ? await TMDBApi.discoverMovies({ with_genres: genre.id })
            : await TMDBApi.discoverTVShows({ with_genres: genre.id })

        if (data.results.length > 0) {
          newCategories[genre.name] = data.results.slice(0, 20)
        }
      } catch (error) {
        console.error(`Error fetching ${genre.name} content:`, error)
      }
    }

    setCategories(newCategories)
  }

  const selectGenre = async (genre: Genre) => {
    setSelectedGenre(genre.id)
    try {
      const data =
        currentTab === "movies"
          ? await TMDBApi.discoverMovies({ with_genres: genre.id })
          : await TMDBApi.discoverTVShows({ with_genres: genre.id })

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
    if (isCarouselAnimating || index === currentCarouselIndex) return

    setIsCarouselAnimating(true)
    setCurrentCarouselIndex(index)

    // Reset animation state after animation completes
    setTimeout(() => {
      setIsCarouselAnimating(false)
    }, 800)
  }

  const nextCarouselSlide = () => {
    if (isCarouselAnimating) return
    const nextIndex = (currentCarouselIndex + 1) % carouselItems.length
    goToCarouselSlide(nextIndex)
  }

  const prevCarouselSlide = () => {
    if (isCarouselAnimating) return
    const prevIndex = (currentCarouselIndex - 1 + carouselItems.length) % carouselItems.length
    goToCarouselSlide(prevIndex)
  }

  // Start auto-rotation for carousel
  const startCarouselAutoRotation = () => {
    // Clear any existing interval
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current)
    }

    // Set new interval for auto-rotation
    carouselIntervalRef.current = setInterval(() => {
      if (!isCarouselAnimating && carouselItems.length > 0) {
        nextCarouselSlide()
      }
    }, 8000)
  }

  const currentCarouselItem = carouselItems[currentCarouselIndex]

  return (

    <WatchLaterProvider>
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
            <div className="pt-24 pb-8 animate-fade-in-up">
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
                              className="absolute inset-0 bg-cover bg-center blur-none md:blur-sm opacity-20 md:opacity-30"
                              style={{
                                backgroundImage: `url(https://image.tmdb.org/t/p/original${item.backdrop_path || item.poster_path})`,
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20 md:from-black/90 md:via-black/70 md:to-black/40" />
                          </div>
                        ))}
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
                                  className="flex flex-col sm:flex-row gap-4 carousel-buttons carousel-animate-fade"
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

                      {/* Click zones for navigation */}
                      <div
                        className="absolute left-0 top-0 w-1/4 h-full z-10 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isCarouselAnimating) prevCarouselSlide()
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 w-1/4 h-full z-10 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isCarouselAnimating) nextCarouselSlide()
                        }}
                      />

                      {/* Navigation Arrows */}
                      <button
                        onClick={prevCarouselSlide}
                        disabled={isCarouselAnimating}
                        className="carousel-nav-button absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-3 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-95"
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
                        disabled={isCarouselAnimating}
                        className="carousel-nav-button absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-3 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-95"
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
                      <div className="carousel-dot-container absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                        {carouselItems.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToCarouselSlide(index)}
                            disabled={isCarouselAnimating}
                            className={`carousel-dot h-2 rounded-full transition-all duration-300 disabled:cursor-not-allowed hover:scale-110 ${index === currentCarouselIndex
                              ? "bg-purple-500 w-8 hover:bg-purple-400"
                              : "bg-gray-500 hover:bg-gray-400 w-2 hover:w-4"
                              }`}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={index === currentCarouselIndex ? "true" : "false"}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Genre Selection - Larger Size with Scroll Animation */}
            <div className="py-8 px-4 animate-fade-in-up" ref={(el) => observeSection(el, "genres")}>
              <div className="container mx-auto">
                <div className="relative">
                  <div className="flex items-center">
                    <div className="flex-1 overflow-hidden">
                      <div className="flex space-x-3 overflow-x-auto scrollbar-hide scroll-smooth">
                        {genres.map((genre, index) => (
                          <button
                            key={genre.id}
                            onClick={() => selectGenre(genre)}
                            className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 border whitespace-nowrap genre-pill ${selectedGenre === genre.id
                              ? "brand-gradient text-white border-purple-500"
                              : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                              } ${visibleSections.has("genres") ? "animate-fade-in-up" : "opacity-0"}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Genre Results - Same size as Top 10 with Scroll Animation */}
            {selectedGenre && genreResults.length > 0 && (
              <div className="py-6 px-4 animate-fade-in-up" ref={(el) => observeSection(el, "genre-results")}>
                <div className="container mx-auto">
                  <h2 className="text-2xl font-bold brand-text mb-6">
                    {genres.find((g) => g.id === selectedGenre)?.name} {currentTab === "movies" ? "Movies" : "TV Shows"}
                  </h2>
                  <div className="relative overflow-hidden">
                    <div
                      id="genreResultsContainer"
                      className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {genreResults.slice(0, 18).map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex-shrink-0 w-36 md:w-44 scroll-animate-item ${visibleSections.has("genre-results") ? "animate-fade-in-up" : "opacity-0"
                            }`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <ContentCard item={item} type={currentTab === "movies" ? "movie" : "tv"} />
                        </div>
                      ))}
                    </div>

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
              </div>
            )}

            {/* Top 10 Section with Scroll Animation */}
            <div className="py-6 px-0 sm:px-6 animate-fade-in-up" ref={(el) => observeSection(el, "top10")}>
              <div className="container mx-auto">
                <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
                  <h2 className="text-2xl font-bold brand-text">
                    Top 10 {currentTab === "movies" ? "Movies" : "TV Shows"} Today
                  </h2>
                </div>
                <div className="relative overflow-hidden">
                  <div
                    id="top10Container"
                    className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {top10Items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex-shrink-0 relative top10-item scroll-animate-item ${visibleSections.has("top10") ? "animate-fade-in-up" : "opacity-0"
                          }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="w-36 md:w-44 aspect-[2/3] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <img
                            src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                            alt={"title" in item ? item.title : item.name}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className="absolute left-[-8px] bottom-0 text-white font-black text-6xl md:text-7xl opacity-80 z-10"
                            style={{ textShadow: "2px 2px 10px rgba(0,0,0,0.7)" }}
                          >
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

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
            </div>

            {/* Category Sections with Scroll Animation */}
            <div className="px-0 sm:px-6 py-4 overflow-hidden">
              {Object.entries(categories).map(([categoryName, items], categoryIndex) => (
                <div
                  key={categoryName}
                  className="category-section container mx-auto mb-8"
                  ref={(el) => observeSection(el, `category-${categoryIndex}`)}
                >
                  <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
                    <h2 className="text-xl font-bold brand-text">{categoryName}</h2>
                  </div>
                  <div className="relative overflow-hidden">
                    <div
                      id={`category-${categoryName.replace(/\s+/g, "")}`}
                      className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth category-container"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex-shrink-0 w-36 category-item scroll-animate-item ${visibleSections.has(`category-${categoryIndex}`) ? "animate-fade-in-up" : "opacity-0"
                            }`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <ContentCard item={item} type={currentTab === "movies" ? "movie" : "tv"} />
                        </div>
                      ))}
                    </div>

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
                </div>
              ))}
            </div>

            {/* Streaming Services */}
            <div
              className="container mx-auto px-4 md:px-6 py-8 md:py-12 animate-fade-in-up"
              ref={(el) => observeSection(el, "streaming")}
            >
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-gray-300">Content Available From</h2>
                <p className="text-sm md:text-base text-gray-400 mt-2">
                  SkyyPlay aggregates content from various premium streaming platforms
                </p>
              </div>
              <div
                className={`grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center justify-items-center opacity-80 ${visibleSections.has("streaming") ? "animate-fade-in-up" : "opacity-0"
                  }`}
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
              </div>
            </div>

            {/* Footer */}
            <footer className="text-gray-400 py-4 md:py-6 mt-8 md:mt-12" ref={(el) => observeSection(el, "footer")}>
              <div
                className={`container mx-auto px-4 md:px-6 text-center ${visibleSections.has("footer") ? "animate-fade-in-up" : "opacity-0"
                  }`}
              >
                <p className="text-xs md:text-sm">
                  All rules and regulations of the respective streaming platforms apply. <br />
                  This is a personal project and not affiliated with any streaming service.
                </p>
                <p className="mt-2 text-xs">Made with Next.js, Tailwind CSS, and TMDB API.</p>
                <p className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Developed and maintained by Umar Ahmed
                </p>
              </div>
            </footer>

            {/* Scroll to top button */}
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
          </>
        )}
      </div>
      <Analytics />
      <SpeedInsights />
    </WatchLaterProvider>
  )
}
