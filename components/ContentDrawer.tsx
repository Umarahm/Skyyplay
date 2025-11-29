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
  const [activeTab, setActiveTab] = useState("overview")
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

  const displayItem = details || initialItem
  const title = "title" in displayItem ? displayItem.title : displayItem.name
  const date = "release_date" in displayItem ? displayItem.release_date : displayItem.first_air_date
  const year = date ? new Date(date).getFullYear() : "N/A"
  const backdrop = displayItem.backdrop_path || displayItem.poster_path
  
  const metaInfo = []
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
        <div className="relative w-full h-[40vh] md:h-[45vh] shrink-0">
          <div className="absolute inset-0">
             <Image
              src={backdrop ? `https://image.tmdb.org/t/p/original${backdrop}` : "/logo.avif"}
              alt={title}
              fill
              className="object-cover opacity-40"
              priority
            />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          </div>

          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full bg-black/40 hover:bg-white/20 text-white backdrop-blur-md h-10 w-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 z-10 flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
            {/* Poster */}
            <div className="hidden md:block w-36 lg:w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 relative -mb-12 group z-20">
              <Image
                src={displayItem.poster_path ? `https://image.tmdb.org/t/p/w500${displayItem.poster_path}` : "/logo.avif"}
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
            <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-xl pt-2 pb-2 md:pt-4 border-b border-white/5 -mx-4 md:-mx-8 px-4 md:px-8 mb-6">
               <TabsList className="bg-transparent h-12 md:h-16 p-0 gap-4 md:gap-8 justify-start w-full overflow-x-auto scrollbar-hide">
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
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 text-gray-400 rounded-none px-0 h-full font-medium text-xs md:text-base hover:text-gray-200 transition-all data-[state=active]:shadow-none cursor-pointer"
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
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                        Plot Summary
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-base md:text-lg font-light">
                        {displayItem.overview || "No overview available."}
                      </p>
                    </div>
                    
                    {displayItem.tagline && (
                       <blockquote className="border-l-4 border-purple-500/50 pl-4 italic text-gray-400 text-base md:text-lg">
                        "{displayItem.tagline}"
                      </blockquote>
                    )}
                  </div>

                  <div className="space-y-6 bg-white/5 rounded-xl p-6 border border-white/5 h-fit">
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Production</h4>
                      <div className="flex flex-wrap gap-3">
                        {displayItem.production_companies?.filter(c => c.logo_path).slice(0, 4).map(company => (
                          <div key={company.id} className="bg-white p-2 rounded-lg h-8 md:h-10 flex items-center justify-center w-auto px-3 opacity-90 hover:opacity-100 transition-opacity">
                            <img 
                              src={`https://image.tmdb.org/t/p/w200${company.logo_path}`} 
                              alt={company.name} 
                              className="max-h-full w-auto object-contain" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                       <div>
                         <span className="text-[10px] md:text-xs text-gray-500 uppercase block mb-1">Status</span>
                         <span className="text-white font-medium text-sm md:text-base">{displayItem.status || "Unknown"}</span>
                       </div>
                       <div>
                         <span className="text-[10px] md:text-xs text-gray-500 uppercase block mb-1">Original Language</span>
                         <span className="text-white font-medium uppercase text-sm md:text-base">{("original_language" in displayItem && displayItem.original_language) || "EN"}</span>
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
                      <SelectTrigger className="w-[120px] md:w-[180px] bg-white/5 border-white/10 text-white text-xs md:text-sm cursor-pointer">
                        <SelectValue placeholder="Select Season" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800 text-white z-[10002]">
                        {(displayItem as TVShow).seasons?.map((season) => (
                          <SelectItem key={season.id} value={season.season_number.toString()} className="cursor-pointer">
                            Season {season.season_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2 md:gap-4">
                    {seasonDetails?.episodes?.map((episode) => (
                      <div 
                        key={episode.id} 
                        onClick={() => window.location.href = `/watch?id=${displayItem.id}&type=tv&season=${selectedSeason}&episode=${episode.episode_number}`}
                        className="flex gap-2 md:gap-4 p-2 md:p-4 rounded-lg md:rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all group cursor-pointer"
                      >
                        <div className="w-20 h-12 md:w-48 md:h-auto md:aspect-video rounded-md md:rounded-lg overflow-hidden bg-black/50 relative shrink-0">
                          {episode.still_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                              alt={episode.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-[8px] md:text-xs">No Image</div>
                          )}
                           <div className="absolute bottom-0.5 right-0.5 md:bottom-2 md:right-2 bg-black/80 px-1 md:px-2 py-0.5 rounded text-[8px] md:text-xs text-white">
                             {episode.episode_number}
                           </div>
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                             <Play className="w-4 h-4 md:w-8 md:h-8 text-white drop-shadow-lg" />
                           </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                           <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-2">
                             <h4 className="font-medium text-white text-xs md:text-lg truncate">{episode.name}</h4>
                             {episode.vote_average > 0 && (
                               <span className="flex items-center gap-0.5 text-[8px] md:text-xs text-yellow-500 shrink-0">
                                 <Star className="w-2 h-2 md:w-3 md:h-3 fill-current" /> {episode.vote_average.toFixed(1)}
                               </span>
                             )}
                           </div>
                           <p className="text-gray-400 text-[10px] md:text-sm line-clamp-1 md:line-clamp-2 leading-snug hidden md:block">
                             {episode.overview || "No overview available for this episode."}
                           </p>
                           <span className="text-[9px] md:text-sm text-gray-500 md:hidden">
                             {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : ""}
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* Cast Tab */}
              <TabsContent value="cast" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {displayItem.credits?.cast && displayItem.credits.cast.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {displayItem.credits.cast.slice(0, 15).map((actor: CastMember) => (
                      <div key={actor.id} className="bg-white/5 rounded-xl p-2 md:p-3 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all group text-center cursor-pointer">
                        <div className="aspect-square rounded-full overflow-hidden mb-2 md:mb-3 mx-auto w-16 h-16 md:w-24 md:h-24 relative bg-gray-800 border-2 border-transparent group-hover:border-purple-500/50 transition-colors">
                          {actor.profile_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                              alt={actor.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] md:text-xs">No Image</div>
                          )}
                        </div>
                        <h4 className="font-medium text-white truncate text-xs md:text-sm">{actor.name}</h4>
                        <p className="text-[10px] md:text-xs text-purple-400 truncate mt-0.5 md:mt-1">{actor.character}</p>
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
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
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
