"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { ContentCard } from "@/components/ContentCard"
import { TMDBApi, type Movie, type TVShow, type Genre } from "@/lib/tmdb"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [currentTab, setCurrentTab] = useState<"movies" | "shows">("shows")
  const [searchQuery, setSearchQuery] = useState("")
  const [content, setContent] = useState<(Movie | TVShow)[]>([])
  const [filteredContent, setFilteredContent] = useState<(Movie | TVShow)[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenre, setSelectedGenre] = useState("")
  const [minRating, setMinRating] = useState("")
  const [yearRange, setYearRange] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [sortBy, setSortBy] = useState("popularity.desc")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const query = searchParams.get("q")
    if (query) {
      setSearchQuery(query)
      searchContent(query)
    }
    fetchGenres()
  }, [searchParams])

  useEffect(() => {
    fetchGenres()
    if (searchQuery.trim()) {
      searchContent(searchQuery)
    }
  }, [currentTab])

  useEffect(() => {
    applyFilters()
  }, [content, selectedGenre, minRating, yearRange, selectedLanguage])

  const fetchGenres = async () => {
    try {
      const data = currentTab === "movies" ? await TMDBApi.getMovieGenres() : await TMDBApi.getTVGenres()
      setGenres(data.genres)
    } catch (error) {
      console.error("Error fetching genres:", error)
    }
  }

  const searchContent = async (query: string) => {
    if (!query.trim()) {
      setContent([])
      setFilteredContent([])
      return
    }

    setIsLoading(true)
    try {
      const data =
        currentTab === "movies"
          ? await TMDBApi.searchMovies(query, currentPage)
          : await TMDBApi.searchTVShows(query, currentPage)

      setContent(data.results)
    } catch (error) {
      console.error("Error searching content:", error)
      setContent([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...content]

    if (selectedGenre) {
      filtered = filtered.filter((item) => item.genre_ids?.includes(Number.parseInt(selectedGenre)))
    }

    if (minRating) {
      filtered = filtered.filter((item) => item.vote_average >= Number.parseFloat(minRating))
    }

    if (yearRange) {
      const [startYear, endYear] = yearRange.split(",")
      filtered = filtered.filter((item) => {
        const year = new Date("release_date" in item ? item.release_date : item.first_air_date).getFullYear()
        return year >= Number.parseInt(startYear) && year <= Number.parseInt(endYear)
      })
    }

    setFilteredContent(filtered)
  }

  const clearAllFilters = () => {
    setSelectedGenre("")
    setMinRating("")
    setYearRange("")
    setSelectedLanguage("")
  }

  const getGenreName = (genreId: string) => {
    const genre = genres.find((g) => g.id === Number.parseInt(genreId))
    return genre ? genre.name : ""
  }

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      en: "English",
      fr: "French",
      es: "Spanish",
      de: "German",
      it: "Italian",
      ja: "Japanese",
      ko: "Korean",
      ur: "Urdu",
      hi: "Hindi",
    }
    return languages[code] || code
  }

  const getYearRangeName = (range: string) => {
    if (!range) return ""
    const [start] = range.split(",")
    const decade = Math.floor(Number.parseInt(start) / 10) * 10
    return `${decade}s`
  }

  const hasActiveFilters = selectedGenre || minRating || yearRange || selectedLanguage

  const pickRandom = () => {
    if (filteredContent.length > 0) {
      const randomItem = filteredContent[Math.floor(Math.random() * filteredContent.length)]
      window.location.href = `/watch?id=${randomItem.id}&type=${currentTab === "movies" ? "movie" : "tv"}`
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar showSearch={false} />

      <div className="pt-24 pb-8 px-6 animate-fade-in-up">
        <div className="container mx-auto">
          {/* Search Header */}
          <div className="text-center mb-8 animate-slide-in-left">
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-violet-800 mb-4">
              Search {currentTab === "movies" ? "Movies" : "TV Shows"}
            </h1>
            <p className="text-gray-400 text-lg">
              Discover your next favorite {currentTab === "movies" ? "movie" : "TV show"}
            </p>
          </div>

          {/* Search Input */}
          <div className="flex justify-center mb-6 animate-slide-in-right">
            <div className="search-container w-full max-w-3xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchContent(searchQuery)}
                placeholder="Search for movies, TV shows, or people..."
                className="search-input bg-gray-800 rounded-full px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-800 p-1 rounded-full inline-flex">
              <button
                onClick={() => setCurrentTab("movies")}
                className={`px-6 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 ${
                  currentTab === "movies" ? "bg-purple-600 text-white" : "text-gray-300 hover:text-white"
                }`}
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
                    d="M7 4v16M17 4v16M3 8h18M3 16h18"
                  />
                </svg>
                <span>Movies</span>
              </button>
              <button
                onClick={() => setCurrentTab("shows")}
                className={`px-6 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 ${
                  currentTab === "shows" ? "bg-purple-600 text-white" : "text-gray-300 hover:text-white"
                }`}
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>TV Shows</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          {searchQuery.trim() === "" && (
            <div className="empty-state">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-24 w-24 mx-auto text-gray-600 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-2xl font-semibold text-gray-400 mb-2">Start your search</h3>
                <p className="text-gray-500 mb-6">
                  Type in the search box above to find {currentTab === "movies" ? "movies" : "TV shows"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {currentTab === "movies" ? (
                    <>
                      <button
                        onClick={() => {
                          setSearchQuery("Marvel")
                          searchContent("Marvel")
                        }}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
                      >
                        Marvel
                      </button>
                      <button
                        onClick={() => {
                          setSearchQuery("Star Wars")
                          searchContent("Star Wars")
                        }}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
                      >
                        Star Wars
                      </button>
                      <button
                        onClick={() => {
                          setSearchQuery("Christopher Nolan")
                          searchContent("Christopher Nolan")
                        }}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
                      >
                        Christopher Nolan
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSearchQuery("Breaking Bad")
                          searchContent("Breaking Bad")
                        }}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
                      >
                        Breaking Bad
                      </button>
                      <button
                        onClick={() => {
                          setSearchQuery("The Office")
                          searchContent("The Office")
                        }}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
                      >
                        The Office
                      </button>
                      <button
                        onClick={() => {
                          setSearchQuery("Game of Thrones")
                          searchContent("Game of Thrones")
                        }}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
                      >
                        Game of Thrones
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="loading-spinner h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
              <p className="text-gray-400">Searching...</p>
            </div>
          )}

          {/* Search Results */}
          {searchQuery.trim() !== "" && !isLoading && (
            <div>
              {/* Search Results Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-violet-800">
                  {searchQuery
                    ? `${currentTab === "movies" ? "Movie" : "TV Show"} Results for '${searchQuery}'`
                    : `Popular ${currentTab === "movies" ? "Movies" : "TV Shows"}`}
                </h2>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <span className="text-gray-400">{filteredContent.length} results found</span>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-center">
                  {/* Genre filter */}
                  <div className="relative">
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="bg-gray-800 text-white rounded-lg px-4 py-2 pr-8 appearance-none hover:bg-gray-700 transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    >
                      <option value="">All Genres</option>
                      {genres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rating filter */}
                  <div className="relative">
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      className="bg-gray-800 text-white rounded-lg px-4 py-2 pr-8 appearance-none hover:bg-gray-700 transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    >
                      <option value="">Any Rating</option>
                      <option value="8">8+ ⭐</option>
                      <option value="7">7+ ⭐</option>
                      <option value="6">6+ ⭐</option>
                      <option value="5">5+ ⭐</option>
                    </select>
                  </div>

                  {/* Year filter */}
                  <div className="relative">
                    <select
                      value={yearRange}
                      onChange={(e) => setYearRange(e.target.value)}
                      className="bg-gray-800 text-white rounded-lg px-4 py-2 pr-8 appearance-none hover:bg-gray-700 transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    >
                      <option value="">Any Year</option>
                      <option value="2020,2024">2020s</option>
                      <option value="2010,2019">2010s</option>
                      <option value="2000,2009">2000s</option>
                      <option value="1990,1999">1990s</option>
                    </select>
                  </div>

                  {/* Active filters */}
                  <div className="flex flex-wrap gap-2">
                    {selectedGenre && (
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <span>{getGenreName(selectedGenre)}</span>
                        <button onClick={() => setSelectedGenre("")} className="hover:text-gray-300">
                          ×
                        </button>
                      </span>
                    )}
                    {minRating && (
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <span>{minRating}+ ⭐</span>
                        <button onClick={() => setMinRating("")} className="hover:text-gray-300">
                          ×
                        </button>
                      </span>
                    )}
                    {yearRange && (
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <span>{getYearRangeName(yearRange)}</span>
                        <button onClick={() => setYearRange("")} className="hover:text-gray-300">
                          ×
                        </button>
                      </span>
                    )}
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-colors duration-300"
                      >
                        <span>Clear All Filters</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={pickRandom}
                    className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all duration-300 flex items-center space-x-2"
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
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                    <span>Random Pick</span>
                  </button>
                </div>
              </div>

              {/* No Results */}
              {filteredContent.length === 0 && searchQuery.trim() !== "" && (
                <div className="text-center py-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-gray-600 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No results found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search terms or filters</p>
                  <button
                    onClick={() => {
                      clearAllFilters()
                      setSearchQuery("")
                    }}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Clear Search & Filters
                  </button>
                </div>
              )}

              {/* Content Grid */}
              {filteredContent.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredContent.map((item) => (
                    <ContentCard key={item.id} item={item} type={currentTab === "movies" ? "movie" : "tv"} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
