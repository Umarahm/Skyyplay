"use client"

import { useState, useEffect, useRef } from "react"
import { Info, Settings, Menu, ChevronDown, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Match {
  id: string
  title: string
  category: string
  date: string
  teams?: {
    home: { name: string; badge?: string }
    away: { name: string; badge?: string }
  }
  poster?: string
  sources: Array<{ source: string; id: string }>
}

interface Sport {
  id: string
  name: string
}

interface Stream {
  id: string
  source: string
  embedUrl: string
  hd?: boolean
}

export default function LiveSportsPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [selectedSport, setSelectedSport] = useState("")
  const [matchType, setMatchType] = useState("live")
  const [showPopular, setShowPopular] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [availableStreams, setAvailableStreams] = useState<Stream[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)
  const streamContainerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    filterMatches()
  }, [selectedSport, matches])

  useEffect(() => {
    loadMatches()
  }, [matchType, showPopular])

  const init = async () => {
    await loadSports()
    await loadMatches()
    hideLoading()
  }

  const hideLoading = () => {
    setIsLoading(false)
  }

  const loadSports = async () => {
    try {
      const response = await fetch("https://streamed.su/api/sports")
      const data = await response.json()
      setSports(data)
    } catch (error) {
      console.error("Error loading sports:", error)
      setSports([])
    }
  }

  const loadMatches = async () => {
    setIsLoadingMatches(true)

    let endpoint = ""
    switch (matchType) {
      case "live":
        endpoint = showPopular ? "/api/matches/live/popular" : "/api/matches/live"
        break
      case "today":
        endpoint = showPopular ? "/api/matches/all-today/popular" : "/api/matches/all-today"
        break
      case "all":
        endpoint = showPopular ? "/api/matches/all/popular" : "/api/matches/all"
        break
    }

    try {
      const response = await fetch(`https://streamed.su${endpoint}`)
      const data = await response.json()

      // Simulate minimum loading time for better UX
      await new Promise((resolve) => setTimeout(resolve, 800))

      setMatches(data)
    } catch (error) {
      console.error("Error loading matches:", error)
      setMatches([])
    } finally {
      setIsLoadingMatches(false)
    }
  }

  const filterMatches = () => {
    const filtered = selectedSport ? matches.filter((match) => match.category === selectedSport) : matches
    setFilteredMatches(filtered)
  }

  const togglePopular = () => {
    setShowPopular(!showPopular)
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedStream(null)
    setSelectedMatch(null)
    setAvailableStreams([])
  }

  const openStream = async (match: Match) => {
    if (showModal) {
      closeModal()
    }

    setSelectedMatch(match)
    setSelectedStream(null)
    setAvailableStreams([])
    setShowModal(true)

    const streams: Stream[] = []
    for (const source of match.sources) {
      try {
        const response = await fetch(`https://streamed.su/api/stream/${source.source}/${source.id}`)
        const sourceStreams = await response.json()
        streams.push(...sourceStreams)
      } catch (error) {
        console.error(`Error loading stream for ${source.source}:`, error)
      }
    }

    setAvailableStreams(streams)
    if (streams.length > 0) {
      selectStream(streams[0])
    }
  }

  const selectStream = (stream: Stream) => {
    setSelectedStream(stream)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center backdrop-blur-sm">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <img src="/logo.avif" alt="SkyyPlay Logo" className="w-24 h-24 loading-logo" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 logo-text">Loading Sports</h2>
          <p className="text-gray-400">Please wait while we fetch live matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Particles background */}
      <div id="particles-js" ref={particlesRef} className="fixed inset-0 pointer-events-none z-0"></div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 glass-effect">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 md:space-x-8">
              <div className="flex items-center space-x-3">
                <img src="/logo.avif" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 animate-pulse" />
                <span className="text-2xl md:text-3xl font-bold logo-text">SkyyPlay</span>
              </div>
              <div className="hidden md:flex space-x-6">
                <Link href="/" className="nav-link">
                  Home
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/settings"
                className="text-gray-400 hover:text-purple-400 transition-colors duration-300"
                title="Settings"
              >
                <Settings className="h-6 w-6 settings-icon" />
              </Link>
              {/* Mobile menu button */}
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-gray-300 hover:text-white">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenu && (
            <div className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-4">
                <Link href="/" className="px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors">
                  Movies & Shows
                </Link>
                <Link href="/livesports" className="px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors">
                  Live Sports
                </Link>
                <Link
                  href="/settings"
                  className="px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Settings</span>
                  <Settings className="h-5 w-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="pt-24 pb-12 px-6 animate-fade-in-up">
        <div className="container mx-auto">
          {/* Enhanced notice banner */}
          <div className="notice-banner text-white text-center p-4 rounded-lg mb-6 z-10">
            <div className="flex items-center justify-center space-x-2">
              <Info className="h-5 w-5" />
              <strong>Notice:</strong>
            </div>
            <p className="mt-2">
              You may experience Content Fetch Difficulties if you are utilizing <strong>UBlock Origin</strong> or{" "}
              <strong>Mozilla Firefox</strong>
            </p>
          </div>

          {/* Enhanced filters */}
          <div className="mb-8 space-y-4">
            <div className="filter-container rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 logo-text">Filter Matches</h3>
              <div className="flex flex-wrap gap-4 items-center">
                {/* Sports filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sport</label>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="bg-gray-800 text-white rounded-lg px-4 py-2 pr-8 appearance-none hover:bg-gray-700 transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none min-w-[150px]"
                  >
                    <option value="">All Sports</option>
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-9 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Match type filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Match Type</label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value)}
                    className="bg-gray-800 text-white rounded-lg px-4 py-2 pr-8 appearance-none hover:bg-gray-700 transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none min-w-[150px]"
                  >
                    <option value="live">Live Matches</option>
                    <option value="today">{"Today's Matches"}</option>
                    <option value="all">All Matches</option>
                  </select>
                  <div className="absolute right-2 top-9 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Popular toggle */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Options</label>
                  <button
                    onClick={togglePopular}
                    className={`px-4 py-2 rounded-lg transition-colors duration-300 ${showPopular ? "btn-primary" : "btn-secondary"}`}
                  >
                    <span className="flex items-center space-x-2">
                      <Star className="h-5 w-5" />
                      <span>Popular</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Matches grid */}
          <div className="matches-container">
            {/* Loading skeletons */}
            {isLoadingMatches && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="match-skeleton rounded-lg overflow-hidden skeleton-grid-item"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-gray-600 rounded w-20 skeleton-shimmer skeleton-delay-1"></div>
                        <div className="h-4 bg-gray-600 rounded w-16 skeleton-shimmer skeleton-delay-2"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-600 rounded skeleton-shimmer skeleton-delay-3"></div>
                            <div className="h-4 bg-gray-600 rounded w-20 skeleton-shimmer skeleton-delay-1"></div>
                          </div>
                          <div className="h-4 bg-gray-600 rounded w-8 skeleton-shimmer skeleton-delay-4"></div>
                          <div className="flex items-center space-x-2">
                            <div className="h-4 bg-gray-600 rounded w-20 skeleton-shimmer skeleton-delay-2"></div>
                            <div className="w-8 h-8 bg-gray-600 rounded skeleton-shimmer skeleton-delay-5"></div>
                          </div>
                        </div>
                      </div>
                      <div className="h-10 bg-gray-600 rounded skeleton-shimmer skeleton-delay-3"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actual matches */}
            {!isLoadingMatches && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMatches.map((match) => (
                  <div key={match.id} className="match-card match-card-animated rounded-lg overflow-hidden">
                    {/* Add poster background if available */}
                    <div className="relative">
                      {match.poster && (
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-20"
                          style={{ backgroundImage: `url(https://streamed.su/api/images/proxy/${match.poster}.webp)` }}
                        ></div>
                      )}
                    </div>
                    <div className="p-4 relative">
                      {/* Match header */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-400">{match.category}</span>
                        {matchType === "live" ? (
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full live-indicator"></span>
                            <span className="text-red-500 text-sm font-medium">LIVE</span>
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">{formatDate(match.date)}</span>
                        )}
                      </div>

                      {/* Teams */}
                      <div className="flex items-center justify-between mb-4">
                        {match.teams ? (
                          <div className="flex items-center justify-between w-full">
                            {/* Home team */}
                            <div className="flex items-center space-x-2">
                              <Image
                                src={
                                  match.teams.home?.badge
                                    ? `https://streamed.su/api/images/badge/${match.teams.home.badge}.webp`
                                    : "/placeholder.svg?height=32&width=32"
                                }
                                alt={match.teams.home?.name || "Team"}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                                }}
                              />
                              <span className="text-sm font-medium">{match.teams.home?.name}</span>
                            </div>
                            <span className="text-gray-400 font-bold">VS</span>
                            {/* Away team */}
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{match.teams.away?.name}</span>
                              <Image
                                src={
                                  match.teams.away?.badge
                                    ? `https://streamed.su/api/images/badge/${match.teams.away.badge}.webp`
                                    : "/placeholder.svg?height=32&width=32"
                                }
                                alt={match.teams.away?.name || "Team"}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center w-full">
                            {match.poster && (
                              <Image
                                src={`https://streamed.su/api/images/poster/${match.poster}.webp`}
                                alt={match.title}
                                width={32}
                                height={32}
                                className="w-32 h-32 object-contain mx-auto mb-2"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            )}
                            <span className="font-medium">{match.title}</span>
                          </div>
                        )}
                      </div>

                      {/* Watch button */}
                      <button
                        onClick={() => openStream(match)}
                        className="w-full btn-primary text-white px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
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
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Watch Stream</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* No matches message */}
          {!isLoadingMatches && filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto mb-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.881-6.08 2.33l-.147.083A1 1 0 016 18h12a1 1 0 01.227-.687l-.147-.083A7.962 7.962 0 0112 15z"
                  />
                </svg>
                No matches available for the selected filters
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced stream modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-90 flex items-center justify-center"
          onClick={closeModal}
        >
          <div className="modal-animation rounded-lg w-full max-w-6xl p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold logo-text">{selectedMatch?.title || "Live Stream"}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stream selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Available Streams</h3>
              <div className="flex flex-wrap gap-3">
                {availableStreams.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => selectStream(source)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${selectedStream?.id === source.id ? "btn-primary" : "btn-secondary"}`}
                  >
                    <span>{source.source}</span>
                    {source.hd && <span className="ml-2 text-xs bg-purple-500 px-2 py-1 rounded-full">HD</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Stream player */}
            {selectedStream ? (
              <div className="relative pt-[56.25%] bg-gray-800 rounded-lg overflow-hidden" id="streamContainer">
                <iframe
                  src={selectedStream.embedUrl}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading streams...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full p-4 shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 z-50 floating-button"
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
