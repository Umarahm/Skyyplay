"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { Play, Star, X, Calendar, Clock } from "lucide-react"
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TMDBApi, type Movie, type TVShow, type CastMember, type Review, type Season } from "@/lib/tmdb"
import { ContentCard } from "@/components/ContentCard"
import { WatchlistButton } from "@/components/WatchlistButton"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"

interface ContentDrawerProps {
  item: Movie | TVShow
  type: "movie" | "tv"
  isOpen: boolean
  onClose: () => void
}

export function ContentDrawer({ item: initialItem, type, isOpen, onClose }: ContentDrawerProps) {
  const [details, setDetails] = useState<Movie | TVShow | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(type === "tv" ? "episodes" : "overview")
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [seasonDetails, setSeasonDetails] = useState<Season | null>(null)
  const isMobile = useIsMobile()

  // Load full details when drawer opens
  useEffect(() => {
    if (isOpen) {
      const fetchDetails = async () => {
        setIsLoading(true)
        try {
          const data = type === "movie"
            ? await TMDBApi.getMovieDetails(initialItem.id)
            : await TMDBApi.getTVShowDetails(initialItem.id)
          setDetails(data)
        } catch (error) {
          console.error("Error fetching details:", error)
          setDetails(initialItem)
        } finally {
          setIsLoading(false)
        }
      }
      fetchDetails()
    }
  }, [isOpen, initialItem.id, type])

  // Set default tab based on content type
  useEffect(() => {
    setActiveTab(type === "tv" ? "episodes" : "overview")
  }, [type])

  // Fetch season details when a season is selected
  useEffect(() => {
    if (type === "tv" && isOpen && selectedSeason) {
      const fetchSeason = async () => {
        try {
          const data = await TMDBApi.getSeasonDetails(initialItem.id, selectedSeason)
          setSeasonDetails(data)
        } catch (error) {
          console.error("Error fetching season details:", error)
        }
      }
      fetchSeason()
    }
  }, [type, isOpen, initialItem.id, selectedSeason])

  const [isSticky, setIsSticky] = useState(false)
  const [sentinelRef, setSentinelRef] = useState<HTMLDivElement | null>(null)

  const [scrollRatio, setScrollRatio] = useState(0)

  // Scroll detection for sticky tabs
  useEffect(() => {
    const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]")
    if (!scrollArea || !sentinelRef) return

    const handleScroll = () => {
      if (!sentinelRef) return
      const rect = sentinelRef.getBoundingClientRect()
      // Account for the sticky top offset (top-4 md:top-8)
      const offset = 50
      const distance = offset - rect.top
      setIsSticky(distance > 0)

      // Calculate a ratio for the gradient transition (0 to 1 over 100px of scrolling)
      if (distance > 0) {
        setScrollRatio(Math.min(distance / 150, 1))
      } else {
        setScrollRatio(0)
      }
    }

    // Add scroll listener
    scrollArea.addEventListener("scroll", handleScroll)
    // Initial check
    handleScroll()

    return () => {
      scrollArea.removeEventListener("scroll", handleScroll)
    }
  }, [sentinelRef, isOpen])

  const displayItem = details || initialItem
  const title = "title" in displayItem ? displayItem.title : displayItem.name
  const date = "release_date" in displayItem ? displayItem.release_date : displayItem.first_air_date
  const year = date ? new Date(date).getFullYear() : "N/A"
  const backdrop = displayItem.backdrop_path || displayItem.poster_path

  const metaInfo: string[] = []
  if (type === "movie" && (displayItem as Movie).runtime) {
    const runtime = (displayItem as Movie).runtime || 0
    const hours = Math.floor(runtime / 60)
    const minutes = runtime % 60
    metaInfo.push(`${hours}h ${minutes}m`)
  } else if (type === "tv" && (displayItem as TVShow).number_of_seasons) {
    metaInfo.push(`${(displayItem as TVShow).number_of_seasons} Season${(displayItem as TVShow).number_of_seasons !== 1 ? 's' : ''}`)
  }

  const renderContent = () => (
    <ScrollArea className="h-full w-full bg-[#0a0a0a]">
      <div className="flex flex-col min-h-full text-white">
        {/* Hero Section */}
        <div className="relative w-full h-[50vh] md:h-[45vh] shrink-0 -mt-6 md:mt-0">
          <div className="absolute inset-0">
            {backdrop ? (
              <Image
                src={`https://image.tmdb.org/t/p/original${backdrop}`}
                alt={title}
                fill
                className="object-cover opacity-40"
                priority
              />
            ) : (
              <Image
                src="/placeholder_backdrop_notfound.png"
                alt={title}
                fill
                className="object-cover w-full h-full opacity-40"
                priority
                quality={100}
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
          </div>

          <div className="absolute top-8 right-4 z-50 md:top-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full bg-black/40 hover:bg-white/20 text-white backdrop-blur-md h-10 w-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 z-10 flex flex-col md:flex-row md:items-end gap-6 md:gap-8 pb-8 md:pb-6">
            {/* Poster */}
            <div className="hidden md:block w-36 lg:w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 relative -mb-12 group z-20">
              <Image
                src={displayItem.poster_path ? `https://image.tmdb.org/t/p/w780${displayItem.poster_path}` : "/placeholder_poster.png"}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="flex-1 space-y-2 md:space-y-4 pb-2">
              <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-none tracking-tight drop-shadow-2xl">
                {title}
              </h2>

              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-base text-gray-300 font-medium">
                <div className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md border border-yellow-400/20">
                  <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                  <span>{displayItem.vote_average?.toFixed(1)}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white/10 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md border border-white/10">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{year}</span>
                </div>

                {metaInfo.map((info, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/10 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md border border-white/10">
                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{info}</span>
                  </div>
                ))}

                {displayItem.genres && displayItem.genres.slice(0, 3).map((g) => (
                  <span key={g.id} className="text-[10px] md:text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full">
                    {g.name}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 md:gap-4 pt-2 md:pt-4">
                <Button
                  onClick={() => window.location.href = `/watch?id=${displayItem.id}&type=${type}`}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full px-6 md:px-8 h-10 md:h-12 text-sm md:text-base shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 mr-2 fill-current" />
                  Watch Now
                </Button>

                <WatchlistButton
                  item={displayItem}
                  type={type}
                  variant="default"
                  className="bg-white/10 hover:bg-white/20 border-white/10 text-white rounded-full h-10 w-10 md:h-12 md:w-12 p-0 flex items-center justify-center transition-transform hover:scale-110"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#0a0a0a] px-4 md:px-8 pb-20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div ref={setSentinelRef} className="absolute top-0 h-px w-full pointer-events-none" />
            <div
              className={`sticky top-0 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) -mx-4 md:-mx-8 px-4 md:px-8 mb-8 ${isSticky
                ? "border-b border-white/10 py-3 shadow-2xl translate-y-0"
                : "bg-transparent border-b border-transparent py-4 md:py-6 translate-y-2"
                }`}
              style={isSticky ? {
                backgroundColor: `rgba(0, 0, 0, ${0.6 + (scrollRatio * 0.4)})`, // Starts at 0.6 opacity, goes to 1.0
                backdropFilter: `blur(${8 + (scrollRatio * 8)}px)` // Blur increases with scroll
              } : undefined}
            >
              <TabsList className={`bg-transparent h-auto p-0 gap-2 md:gap-3 w-full overflow-x-auto scrollbar-hide transition-all duration-500 ${isSticky ? "justify-center scale-95" : "justify-start scale-100"}`}>
                {[
                  "Overview",
                  type === "tv" ? "Episodes" : null,
                  "Cast",
                  "Reviews",
                  "Similar"
                ].filter(Boolean).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab!.toLowerCase()}
                    className={`rounded-full px-3 md:px-6 py-1.5 md:py-2 h-auto font-medium text-xs md:text-sm transition-all duration-300 cursor-pointer select-none ${isSticky
                      ? "bg-white/5 text-gray-300 hover:bg-white/20 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105"
                      : "bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 data-[state=active]:shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                      }`}
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="max-w-6xl mx-auto w-full">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid md:grid-cols-[2fr,1fr] gap-8">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                        Plot Summary
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-base md:text-lg font-light tracking-wide">
                        {displayItem.overview || "No overview available."}
                      </p>
                    </div>

                    {displayItem.tagline && (
                      <blockquote className="border-l-4 border-purple-500/50 pl-6 py-2 italic text-gray-400 text-lg md:text-xl bg-white/5 rounded-r-xl">
                        "{displayItem.tagline}"
                      </blockquote>
                    )}
                  </div>

                  <div className="space-y-6 bg-[#121212] rounded-2xl p-6 border border-white/5 h-fit shadow-xl">
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Production</h4>
                      <div className="flex flex-wrap gap-3">
                        {displayItem.production_companies?.filter(c => c.logo_path).slice(0, 4).map(company => (
                          <div key={company.id} className="bg-white p-2 rounded-lg h-10 md:h-12 flex items-center justify-center min-w-[80px] px-4 opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-105 shadow-lg">
                            <img
                              src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                              alt={company.name}
                              className="max-h-full w-auto object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                      <div>
                        <span className="text-[10px] md:text-xs text-gray-500 uppercase block mb-1.5 tracking-wider">Status</span>
                        <span className="text-white font-medium text-sm md:text-base bg-white/5 px-2 py-1 rounded-md">{displayItem.status || "Unknown"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] md:text-xs text-gray-500 uppercase block mb-1.5 tracking-wider">Original Language</span>
                        <span className="text-white font-medium uppercase text-sm md:text-base bg-white/5 px-2 py-1 rounded-md">{("original_language" in displayItem && displayItem.original_language) || "EN"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Episodes Tab (TV Only) */}
              {type === "tv" && (
                <TabsContent value="episodes" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                      <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                      Season {selectedSeason}
                    </h3>
                    <Select
                      value={selectedSeason.toString()}
                      onValueChange={(val) => setSelectedSeason(parseInt(val))}
                    >
                      <SelectTrigger className="w-[120px] md:w-[180px] bg-white/5 border-white/10 text-white text-xs md:text-sm cursor-pointer rounded-full">
                        <SelectValue placeholder="Select Season" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 text-white z-[10002]">
                        {(displayItem as TVShow).seasons?.map((season) => (
                          <SelectItem key={season.id} value={season.season_number.toString()} className="cursor-pointer focus:bg-purple-600/20 focus:text-purple-400">
                            Season {season.season_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {seasonDetails?.episodes?.map((episode) => (
                      <div
                        key={episode.id}
                        onClick={() => window.location.href = `/watch?id=${displayItem.id}&type=tv&season=${selectedSeason}&episode=${episode.episode_number}`}
                        className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(147,51,234,0.15)]"
                      >
                        {/* Thumbnail with Overlay */}
                        <div className="aspect-video relative overflow-hidden bg-gray-900">
                          {episode.still_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                              alt={episode.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder_backdrop_notfound.png"
                              }}
                            />
                          ) : (
                            <Image
                              src="/placeholder_backdrop_notfound.png"
                              alt={episode.name}
                              fill
                              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                              quality={100}
                            />
                          )}

                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

                          {/* Episode Number Badge */}
                          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-lg">
                            EP {episode.episode_number}
                          </div>

                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-10 h-10 rounded-full bg-purple-600/90 flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3 bg-gradient-to-b from-white/5 to-transparent">
                          <h4 className="font-medium text-white text-xs md:text-sm line-clamp-1 mb-1.5 group-hover:text-purple-400 transition-colors">
                            {episode.name}
                          </h4>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/10">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span className="text-[10px] font-medium">{episode.vote_average > 0 ? episode.vote_average.toFixed(1) : "N/A"}</span>
                            </div>

                            {episode.air_date && (
                              <span className="text-[10px] text-gray-500">
                                {new Date(episode.air_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* Cast Tab */}
              <TabsContent value="cast" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {displayItem.credits?.cast && displayItem.credits.cast.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
                    {displayItem.credits.cast.slice(0, 15).map((actor: CastMember) => (
                      <div key={actor.id} className="group relative bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer hover:shadow-lg">
                        <div className="aspect-[3/4] relative overflow-hidden bg-gray-900">
                          {actor.profile_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w300${actor.profile_path}`}
                              alt={actor.name}
                              fill
                              sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                              No Image
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                            <h4 className="font-bold text-white text-[10px] md:text-sm truncate leading-tight">{actor.name}</h4>
                            <p className="text-[9px] md:text-xs text-purple-400 truncate font-medium leading-tight mt-0.5">{actor.character}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <p>No cast information available.</p>
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {displayItem.reviews?.results && displayItem.reviews.results.length > 0 ? (
                  <div className="grid gap-3 md:gap-4">
                    {displayItem.reviews.results.slice(0, 6).map((review: Review) => (
                      <div key={review.id} className="bg-white/5 border border-white/5 rounded-xl p-4 md:p-6 hover:bg-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-sm md:text-lg uppercase">
                              {review.author.charAt(0)}
                            </div>
                            <h4 className="font-semibold text-white text-sm md:text-base">{review.author}</h4>
                          </div>
                          {review.author_details?.rating && (
                            <div className="flex items-center gap-1 text-yellow-500 text-xs md:text-sm bg-yellow-500/10 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-yellow-500/20">
                              <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                              <span>{review.author_details.rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-gray-300 text-xs md:text-sm leading-relaxed opacity-90 group-hover:opacity-100">
                          {review.content.length > 500
                            ? review.content.substring(0, 500) + "..."
                            : review.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <p>No reviews available.</p>
                  </div>
                )}
              </TabsContent>

              {/* Similar Tab */}
              <TabsContent value="similar" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {displayItem.similar?.results && displayItem.similar.results.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                    {displayItem.similar.results.slice(0, 12).map((similarItem) => (
                      <div key={similarItem.id} className="aspect-[2/3] hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <ContentCard item={similarItem} type={type} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <p>No similar content found.</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </ScrollArea>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="bg-[#0a0a0a] text-white border-gray-800 h-[92vh] max-h-[92vh] flex flex-col rounded-t-[2rem] outline-none z-[10000]">
          <DrawerTitle className="sr-only">{title} Details</DrawerTitle>
          <DrawerDescription className="sr-only">Details for {title}</DrawerDescription>
          {renderContent()}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 bg-[#0a0a0a] text-white border-gray-800 overflow-hidden rounded-2xl shadow-2xl outline-none z-[10000]">
        <DialogTitle className="sr-only">{title} Details</DialogTitle>
        <DialogDescription className="sr-only">Details for {title}</DialogDescription>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
