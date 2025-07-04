"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Info, Settings, Menu, ChevronDown, Star, Play } from "lucide-react"
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

interface CategorySection {
  title: string
  matches: Match[]
  type: 'live' | 'popular' | 'sport'
  sportFilter?: string
}

export default function LiveSportsPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [categorizedMatches, setCategorizedMatches] = useState<CategorySection[]>([])
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
    if (allMatches.length > 0) {
      organizeCategorizedContent()
    }
  }, [allMatches, selectedSport, matchType, showPopular])

  const init = async () => {
    await Promise.all([loadSports(), loadAllMatches()])
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

  const loadAllMatches = async () => {
    setIsLoadingMatches(true)
    try {
      // Load different types of matches from streamed.su API
      const [liveResponse, popularResponse, todayResponse, allResponse] = await Promise.all([
        fetch("https://streamed.su/api/matches/live"),
        fetch("https://streamed.su/api/matches/live/popular"),
        fetch("https://streamed.su/api/matches/all-today"),
        fetch("https://streamed.su/api/matches/all")
      ])

      const [liveData, popularData, todayData, allData] = await Promise.all([
        liveResponse.json(),
        popularResponse.json(),
        todayResponse.json(),
        allResponse.json()
      ])

      // Combine all matches with enhanced metadata
      const combinedMatches = [
        ...liveData.map((m: Match) => ({ ...m, _type: 'live', _priority: 1 })),
        ...popularData.map((m: Match) => ({ ...m, _type: 'popular', _priority: 2 })),
        ...todayData.map((m: Match) => ({ ...m, _type: 'today', _priority: 3 })),
        ...allData.slice(0, 50).map((m: Match) => ({ ...m, _type: 'all', _priority: 4 }))
      ]

      // Remove duplicates based on match ID, keeping higher priority ones
      const uniqueMatches = combinedMatches.reduce((acc: any[], current) => {
        const existing = acc.find(item => item.id === current.id)
        if (!existing || current._priority < existing._priority) {
          return acc.filter(item => item.id !== current.id).concat(current)
        }
        return acc
      }, [])

      setAllMatches(uniqueMatches)
    } catch (error) {
      console.error("Error loading matches:", error)
      setAllMatches([])
    } finally {
      setIsLoadingMatches(false)
    }
  }

  const organizeCategorizedContent = () => {
    let filteredMatches = allMatches

    // Apply sport filter
    if (selectedSport) {
      filteredMatches = filteredMatches.filter(m => m.category === selectedSport)
    }

    // Apply match type filter
    if (matchType !== "all") {
      filteredMatches = filteredMatches.filter(m => (m as any)._type === matchType)
    }

    // Apply popular filter
    if (showPopular) {
      filteredMatches = filteredMatches.filter(m => (m as any)._type === 'popular')
    }

    const liveMatches = filteredMatches.filter(m => (m as any)._type === 'live')
    const popularMatches = filteredMatches.filter(m => (m as any)._type === 'popular')

    // Create main categories
    const categories: CategorySection[] = []

    // Add popular live section if there are popular matches
    if (popularMatches.length > 0) {
      categories.push({
        title: "Popular Live",
        matches: popularMatches.slice(0, 8),
        type: 'popular'
      })
    }

    // Add live sports section
    if (liveMatches.length > 0) {
      categories.push({
        title: "Live Sports",
        matches: liveMatches.slice(0, 12),
        type: 'live'
      })
    }

    // Add sport-specific categories for popular sports (only if no specific sport is selected)
    if (!selectedSport) {
      const popularSports = ['football', 'basketball', 'american-football', 'hockey', 'baseball', 'fighting', 'motorsports']

      popularSports.forEach(sportId => {
        const sportMatches = allMatches.filter(m =>
          m.category?.toLowerCase().includes(sportId) ||
          m.category?.toLowerCase().includes(sportId.replace('-', ' '))
        )
        if (sportMatches.length > 0) {
          const sportName = sportId.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')

          categories.push({
            title: `Popular ${sportName}`,
            matches: sportMatches.slice(0, 6),
            type: 'sport',
            sportFilter: sportId
          })
        }
      })
    }

    setCategorizedMatches(categories)
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

  const cardVariants = {
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
        duration: 0.4,
        ease: "easeOut" as const
      }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        duration: 0.2,
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

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300,
        duration: 0.5
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.3,
        ease: "easeIn" as const
      }
    }
  }

  const openStream = async (match: Match) => {
    if (showModal) {
      closeModal()
    }

    setSelectedMatch(match)
    setSelectedStream(null)
    setAvailableStreams([])
    setShowModal(true)

    try {
      const streams: Stream[] = []

      // Enhanced streaming with better error handling and source prioritization
      for (const source of match.sources) {
        try {
          const response = await fetch(`https://streamed.su/api/stream/${source.source}/${source.id}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SkyyPlay/1.0'
            }
          })

          if (response.ok) {
            const sourceStreams = await response.json()

            // Process and enhance streams from streamed.su API
            const processedStreams = Array.isArray(sourceStreams)
              ? sourceStreams.map((stream: any) => ({
                ...stream,
                source: source.source,
                quality: stream.quality || 'Auto',
                hd: stream.quality?.includes('HD') || stream.hd || false
              }))
              : [sourceStreams].map((stream: any) => ({
                ...stream,
                source: source.source,
                quality: stream.quality || 'Auto',
                hd: stream.quality?.includes('HD') || stream.hd || false
              }))

            streams.push(...processedStreams)
          } else {
            console.warn(`Failed to load stream from ${source.source}: ${response.status}`)
          }
        } catch (error) {
          console.error(`Error loading stream for ${source.source}:`, error)
        }
      }

      // Sort streams by quality (HD first, then by source priority)
      const sortedStreams = streams.sort((a, b) => {
        if (a.hd && !b.hd) return -1
        if (!a.hd && b.hd) return 1
        return 0
      })

      setAvailableStreams(sortedStreams)

      // Auto-select the best quality stream
      if (sortedStreams.length > 0) {
        const bestStream = sortedStreams.find(s => s.hd) || sortedStreams[0]
        selectStream(bestStream)
      }
    } catch (error) {
      console.error('Error loading streams:', error)
      setAvailableStreams([])
    }
  }

  const selectStream = (stream: Stream) => {
    setSelectedStream(stream)
  }

  // Enhanced component for rendering match cards with streamed.su API thumbnails
  const MatchCard = ({ match }: { match: Match }) => {
    const [imageError, setImageError] = useState(false)
    const [badgeErrors, setBadgeErrors] = useState({ home: false, away: false })

    const handleImageError = () => setImageError(true)
    const handleBadgeError = (team: 'home' | 'away') => {
      setBadgeErrors(prev => ({ ...prev, [team]: true }))
    }

    // Get optimal image URL from streamed.su API
    const getImageUrl = () => {
      if (match.poster && !imageError) {
        // Try multiple image formats from streamed.su
        return `https://streamed.su/api/images/proxy/${match.poster}.webp`
      }
      return null
    }

    const getBadgeUrl = (team: 'home' | 'away') => {
      const badge = team === 'home' ? match.teams?.home?.badge : match.teams?.away?.badge
      if (badge && !badgeErrors[team]) {
        return `https://streamed.su/api/images/badge/${badge}.webp`
      }
      return "/placeholder.svg?height=40&width=40"
    }

    // Return local image based on sport/category
    const getSportImagePath = () => {
      if (!match?.category) return null
      const category = match.category.toLowerCase()

      // Map of keywords to local image paths (spaces encoded for URLs)
      // NOTE: Put more specific keys before generic ones to avoid partial-match issues
      const map: Record<string, string> = {
        "american football": "/images/american%20football.png",
        "american-football": "/images/american%20football.png",
        football: "/images/football.png",
        soccer: "/images/football.png",
        basketball: "/images/basketball.png",
        cricket: "/images/cricket.png",
        tennis: "/images/tennis.png",
        hockey: "/images/hockey.png",
        motorsports: "/images/motorsports.png",
        motor: "/images/motorsports.png",
        fighting: "/images/Fight.png",
        fight: "/images/Fight.png",
        baseball: "/images/baseball.png",
        other: "/images/others.png"
      }

      // Find matching key inside the category string
      for (const key of Object.keys(map)) {
        if (category.includes(key)) return map[key]
      }

      return "/images/others.png" // default fallback
    }

    return (
      <div className="match-card match-card-animated rounded-lg overflow-hidden group hover:scale-105 transition-transform duration-300">
        {/* Enhanced Thumbnail with local base image and streamed.su API top overlay */}
        <div className="relative aspect-[16/9] bg-gray-800 overflow-hidden">
          <Image
            src={getSportImagePath() || '/images/others.png'}
            alt={match.category}
            fill
            quality={100}
            priority
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 48vw,  /* 2-col mobile */
                   (max-width: 1024px) 24vw, /* 4-col tablet */
                   16vw"                    /* 6-col desktop */
            onError={handleImageError}
          />

          {/* Enhanced Live indicator overlay */}
          <div className="absolute top-2 right-2">
            <span className="flex items-center space-x-1 bg-red-500 px-2 py-1 rounded-full shadow-lg backdrop-blur-sm">
              <span className="w-2 h-2 bg-white rounded-full live-indicator animate-pulse"></span>
              <span className="text-white text-xs font-medium">LIVE</span>
            </span>
          </div>

          {/* Enhanced Category badge */}
          <div className="absolute bottom-2 left-2">
            <span className="text-xs text-white bg-black/80 px-2 py-1 rounded-full backdrop-blur-sm">
              {match.category}
            </span>
          </div>

          {/* Quality indicator if available */}
          {match.sources?.some(s => s.source.includes('hd')) && (
            <div className="absolute top-2 left-2">
              <span className="text-xs text-white bg-blue-500 px-2 py-1 rounded-full">HD</span>
            </div>
          )}
        </div>

        {/* Enhanced Content */}
        <div className="p-3 bg-gray-900">
          {/* Title */}
          <div className="mb-3">
            {match.teams ? (
              <h3 className="font-medium text-sm text-center truncate text-white">
                {match.teams.home?.name} vs {match.teams.away?.name}
              </h3>
            ) : (
              <h3 className="font-medium text-sm text-center truncate text-white">{match.title}</h3>
            )}
            {match.date && (
              <p className="text-xs text-gray-400 text-center mt-1">
                {new Date(match.date).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Enhanced Watch button with stream count */}
          <button
            onClick={() => openStream(match)}
            className="w-full btn-primary text-white px-3 py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm group-hover:bg-purple-600 relative overflow-hidden"
          >
            <Play className="h-4 w-4" />
            <span>Watch</span>
            {match.sources && match.sources.length > 0 && (
              <span className="text-xs bg-white/20 px-1 rounded-full ml-2">
                {match.sources.length}
              </span>
            )}
          </button>
        </div>
      </div>
    )
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
      <motion.div
        className="pt-24 pb-12 px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            variants={sectionVariants}
          >
            <h1 className="text-4xl md:text-5xl font-bold logo-text mb-4">Live Sports</h1>

            {/* Notice banner */}
            <div className="notice-banner text-white text-center p-4 rounded-lg mb-6 z-10 max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <Info className="h-5 w-5" />
                <strong>Notice:</strong>
              </div>
              <p className="mt-2">
                You may experience Content Fetch Difficulties if you are utilizing <strong>UBlock Origin</strong> or{" "}
                <strong>Mozilla Firefox</strong>
              </p>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            className="mb-8"
            variants={sectionVariants}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold logo-text">Filters</h3>
            </div>

            <div className="filter-container rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Sports filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sport</label>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 pr-8 appearance-none hover:bg-gray-700 transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  >
                    <option value="">All Sports</option>
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                {/* Match type filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 pr-8 appearance-none hover:bg-gray-700 transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  >
                    <option value="live">Live</option>
                    <option value="popular">Popular</option>
                    <option value="today">Today</option>
                    <option value="all">All</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                {/* Popular toggle */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Popular</label>
                  <button
                    onClick={togglePopular}
                    className={`px-4 py-2 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2 ${showPopular ? "btn-primary" : "btn-secondary"}`}
                  >
                    <Star className="h-4 w-4" />
                    <span>{showPopular ? 'Popular Only' : 'Include All'}</span>
                  </button>
                </div>

                {/* Clear filters */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Reset</label>
                  <button
                    onClick={() => {
                      setSelectedSport("")
                      setMatchType("live")
                      setShowPopular(false)
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors duration-300 text-white"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Categorized Content - Streamed.su style */}
          <motion.div
            className="space-y-12"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {categorizedMatches.map((category, categoryIndex) => (
              <motion.div
                key={`category-${categoryIndex}`}
                className=""
                variants={sectionVariants}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center space-x-3">
                    {category.type === 'live' && <span className="w-3 h-3 bg-red-500 rounded-full live-indicator"></span>}
                    {category.type === 'popular' && <Star className="h-6 w-6 text-yellow-500" />}
                    {/* Removed sport initial badge */}
                    <span className="logo-text">{category.title}</span>
                  </h2>
                  <div className="text-sm text-gray-400 flex items-center space-x-1">
                    <span>{category.matches.length} matches</span>
                  </div>
                </div>

                {category.matches.length > 0 ? (
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {category.matches.map((match, matchIndex) => (
                      <motion.div
                        key={`cat-${categoryIndex}-match-${match.id}-${matchIndex}`}
                        variants={cardVariants}
                        whileHover="hover"
                      >
                        <MatchCard match={match} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-8 text-gray-400 bg-gray-900 rounded-lg">
                    No live matches available in {category.title}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Loading state */}
          {isLoadingMatches && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-white mb-2">Loading Matches</h3>
              <p className="text-gray-400">Fetching live sports from streamed.su...</p>
            </div>
          )}

          {/* No matches message */}
          {!isLoadingMatches && categorizedMatches.length === 0 && (
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
      </motion.div>

      {/* Enhanced Aesthetic Stream Modal */}
      <AnimatePresence mode="wait">
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden bg-black/95 backdrop-blur-md flex items-center justify-center p-1 sm:p-2 md:p-4 mobile-modal-backdrop"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gray-900/95 backdrop-blur-xl rounded-lg sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-7xl shadow-2xl border border-gray-700/50 overflow-hidden flex flex-col mobile-modal-container"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Enhanced Header - Mobile Optimized */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
                <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                  <div className="relative min-w-0 flex-1">
                    {selectedMatch?.teams ? (
                      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 min-w-0">
                        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                          <img
                            src={selectedMatch.teams.home?.badge
                              ? `https://streamed.su/api/images/badge/${selectedMatch.teams.home.badge}.webp`
                              : "/placeholder.svg?height=32&width=32"
                            }
                            alt={selectedMatch.teams.home?.name}
                            className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 object-contain flex-shrink-0"
                          />
                          <span className="text-xs sm:text-sm md:text-lg font-semibold text-white truncate">{selectedMatch.teams.home?.name}</span>
                        </div>
                        <span className="text-gray-400 font-bold text-xs sm:text-sm md:text-base flex-shrink-0">VS</span>
                        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                          <span className="text-xs sm:text-sm md:text-lg font-semibold text-white truncate">{selectedMatch.teams.away?.name}</span>
                          <img
                            src={selectedMatch.teams.away?.badge
                              ? `https://streamed.su/api/images/badge/${selectedMatch.teams.away.badge}.webp`
                              : "/placeholder.svg?height=32&width=32"
                            }
                            alt={selectedMatch.teams.away?.name}
                            className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 object-contain flex-shrink-0"
                          />
                        </div>
                      </div>
                    ) : (
                      <h2 className="text-sm sm:text-lg md:text-2xl font-bold logo-text text-white truncate">{selectedMatch?.title || "Live Stream"}</h2>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <span className="flex items-center space-x-1 bg-red-500 px-1.5 sm:px-2 md:px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></span>
                      <span className="text-white text-xs sm:text-sm font-medium">LIVE</span>
                    </span>
                    {selectedMatch?.category && (
                      <span className="bg-gray-700 text-gray-300 px-1.5 sm:px-2 md:px-3 py-1 rounded-full text-xs sm:text-sm hidden sm:block">
                        {selectedMatch.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-shrink-0">
                  {/* Fullscreen Toggle - Hidden on mobile */}
                  <button
                    onClick={() => {
                      const elem = document.getElementById('streamContainer');
                      if (elem?.requestFullscreen) {
                        elem.requestFullscreen();
                      }
                    }}
                    className="p-1.5 sm:p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300 hover:text-white hidden sm:block flex items-center justify-center"
                    title="Fullscreen"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>

                  {/* Close Button - Mobile Optimized */}
                  <button
                    onClick={closeModal}
                    className="p-1.5 sm:p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors text-white touch-manipulation flex items-center justify-center"
                    title="Close"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Responsive Layout - Mobile Vertical, Desktop Horizontal */}
              <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Main Stream Area - Mobile Optimized */}
                <div className="flex-1 p-1 sm:p-2 md:p-4 lg:p-6 overflow-hidden flex flex-col min-h-0">
                  {selectedStream ? (
                    <div className="flex flex-col h-full overflow-hidden">
                      {/* Stream Container - Mobile Optimized */}
                      <div className="flex-1 min-h-0 overflow-hidden relative">
                        <div
                          className="relative bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-gray-600 stream-container-glow w-full h-full performance-optimized mobile-iframe-container"
                          id="streamContainer"
                        >
                          {/* Responsive iframe wrapper */}
                          <div className="relative w-full h-full min-h-[250px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">
                            <iframe
                              key={selectedStream?.id}
                              src={selectedStream.embedUrl}
                              className="absolute inset-0 w-full h-full rounded-lg sm:rounded-xl touch-manipulation mobile-iframe"
                              frameBorder="0"
                              allowFullScreen
                              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                              loading="lazy"
                              title={`Live stream: ${selectedMatch?.title || 'Sports'}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                backgroundColor: '#000'
                              }}
                            />
                          </div>

                          {/* Enhanced Loading Overlay - Mobile Optimized */}
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 flex items-center justify-center iframe-loading backdrop-blur-sm">
                            <div className="text-center p-3 sm:p-4 md:p-6 lg:p-8 rounded-lg sm:rounded-xl bg-black/40 backdrop-blur-md border border-purple-500/30 max-w-xs sm:max-w-sm mx-auto">
                              <div className="relative mb-3 sm:mb-4 md:mb-6">
                                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 border-b-4 border-purple-500 mx-auto"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-purple-400/20"></div>
                              </div>
                              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2">Connecting to Stream</h3>
                              <p className="text-gray-300 text-xs sm:text-sm md:text-base">Loading from streamed.su...</p>
                              <div className="mt-3 sm:mt-4 flex items-center justify-center space-x-1">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Stream Info Bar - Mobile Optimized */}
                      <div className="flex-shrink-0 mt-1 sm:mt-2 md:mt-4 p-2 sm:p-3 md:p-4 bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-700/50 stream-stats">
                        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4 min-w-0">
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full live-indicator-enhanced"></div>
                              <span className="text-xs sm:text-sm text-gray-300 font-medium">Stream Active</span>
                            </div>
                            <div className="flex items-center space-x-2 min-w-0">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs sm:text-sm text-gray-300 truncate">
                                Source: <span className="text-white font-medium">{selectedStream.source}</span>
                              </span>
                            </div>
                            <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-xs text-gray-400">Powered by streamed.su</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {selectedStream.hd && (
                              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-1.5 sm:px-2 md:px-3 py-1 rounded-full text-xs font-medium quality-badge">
                                HD
                              </span>
                            )}
                            {(selectedStream as any).quality && (
                              <span className="bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 px-1.5 sm:px-2 md:px-3 py-1 rounded-full text-xs font-medium quality-badge">
                                {(selectedStream as any).quality}
                              </span>
                            )}
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-400 font-medium">LIVE</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center bg-gray-800 rounded-lg sm:rounded-xl h-full">
                      <div className="text-center p-3 sm:p-4 md:p-6 max-w-xs sm:max-w-sm mx-auto">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 border-b-2 border-purple-500 mx-auto mb-3 sm:mb-4 md:mb-6"></div>
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2">Loading Stream</h3>
                        <p className="text-gray-400 text-xs sm:text-sm md:text-base">Connecting to streamed.su...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Stream Selection Sidebar - Mobile Optimized */}
                <div className="border-t lg:border-t-0 lg:border-l border-gray-700/50 bg-gray-800/30 backdrop-blur-sm max-h-48 sm:max-h-64 md:max-h-80 lg:max-h-none lg:w-80 overflow-hidden flex-shrink-0">
                  <div className="p-2 sm:p-3 md:p-4 lg:p-6 h-full flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">Stream Sources</h3>
                      <span className="bg-purple-600 text-white px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium">
                        {availableStreams.length} available
                      </span>
                    </div>

                    {/* Mobile Source Selector */}
                    <div className="sm:hidden mb-3">
                      <label htmlFor="mobileSourceSelect" className="sr-only">Select Source</label>
                      <select
                        id="mobileSourceSelect"
                        value={selectedStream?.id || ""}
                        onChange={(e) => {
                          const newStream = availableStreams.find((s) => s.id === e.target.value)
                          if (newStream) {
                            selectStream(newStream)
                          }
                        }}
                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {availableStreams.map((stream) => (
                          <option key={stream.id} value={stream.id}>
                            {stream.source} {stream.hd ? "(HD)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {availableStreams.length > 0 ? (
                      <div className="space-y-1.5 sm:space-y-2 md:space-y-3 flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        {availableStreams.map((stream, index) => (
                          <button
                            key={`${stream.id}-${index}`}
                            onClick={() => selectStream(stream)}
                            className={`w-full p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl transition-all duration-300 text-left border stream-card flex-shrink-0 touch-manipulation ${selectedStream?.id === stream.id
                              ? "bg-purple-600/20 border-purple-500 ring-2 ring-purple-400/30 shadow-lg shadow-purple-500/20"
                              : "bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 hover:border-gray-500"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                              <span className="font-medium text-white text-xs sm:text-sm truncate">{stream.source}</span>
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                {selectedStream?.id === stream.id && (
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                                )}
                                {stream.hd && (
                                  <span className="text-xs bg-blue-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-white font-medium">HD</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400 truncate">Quality: {(stream as any).quality || 'Auto'}</span>
                              {selectedStream?.id === stream.id ? (
                                <span className="text-green-400 font-medium flex-shrink-0">● Active</span>
                              ) : (
                                <span className="text-gray-500 flex-shrink-0">Tap to switch</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 sm:py-6 md:py-8 flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-500 mx-auto mb-3 sm:mb-4"></div>
                        <p className="text-gray-400 text-xs sm:text-sm">Loading streams from streamed.su...</p>
                      </div>
                    )}

                    {/* Enhanced Stream Stats - Mobile Optimized */}
                    {availableStreams.length > 0 && (
                      <div className="mt-3 sm:mt-4 md:mt-6 p-2 sm:p-3 md:p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 stream-stats backdrop-blur-sm flex-shrink-0">
                        <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <h4 className="text-xs sm:text-sm font-medium text-gray-300">Stream Statistics</h4>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 md:space-y-3 text-xs">
                          <div className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-800/40 rounded">
                            <span className="text-gray-400 flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"></div>
                              <span>Total Sources:</span>
                            </span>
                            <span className="text-white font-medium">{availableStreams.length}</span>
                          </div>
                          <div className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-800/40 rounded">
                            <span className="text-gray-400 flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                              <span>HD Sources:</span>
                            </span>
                            <span className="text-blue-400 font-medium">{availableStreams.filter(s => s.hd).length}</span>
                          </div>
                          <div className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-800/40 rounded">
                            <span className="text-gray-400 flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span>Active Source:</span>
                            </span>
                            <span className="text-green-400 font-medium truncate max-w-20 sm:max-w-24">{selectedStream?.source || 'None'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
