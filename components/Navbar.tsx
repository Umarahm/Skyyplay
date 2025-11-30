"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

import { useWatchlist } from "@/hooks/useWatchlist"
import { WatchlistModal } from "./WatchlistModal"
import { ContentDrawer } from "./ContentDrawer"
import type { Movie, TVShow } from "@/lib/tmdb"

const SearchAutocomplete = dynamic(() => import("./SearchAutocomplete"), {
  ssr: false,
  loading: () => (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-gray-900 border border-purple-500/20 rounded-full
            text-gray-400 transition-all duration-200 pr-12 px-4 py-2 text-sm"
          disabled
          readOnly
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  )
})


interface NavbarProps {
  showSearch?: boolean
  showTabSwitcher?: boolean
  currentTab?: "movies" | "shows"
  onTabChange?: (tab: "movies" | "shows") => void
}

export function Navbar({ showSearch = true, showTabSwitcher = false, currentTab = "shows", onTabChange }: NavbarProps) {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [watchlistOpen, setWatchlistOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null)
  const [selectedItemType, setSelectedItemType] = useState<'movie' | 'tv' | null>(null)
  const { watchlistCount } = useWatchlist()

  const handleDrawerOpen = (item: Movie | TVShow, type: 'movie' | 'tv') => {
    setSelectedItem(item)
    setSelectedItemType(type)
    setDrawerOpen(true)
  }

  // Mark as hydrated after component mounts
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <>
      <nav className="fixed w-full z-50 glass-effect">
        <div className="container mx-auto px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <Image src="/logo.avif" alt="Logo" width={40} height={40} className="animate-pulse" />
                <span className="hidden sm:inline text-2xl md:text-3xl font-bold logo-text">SkyyPlay</span>
              </Link>

              {/* Mobile search bar */}
              {showSearch && (
                <div className="md:hidden relative w-60 sm:w-200">
                  <SearchAutocomplete
                    placeholder="Search..."
                    size="sm"
                    onDrawerOpen={handleDrawerOpen}
                  />
                </div>
              )}

              <div className="hidden md:flex space-x-6">
                {showTabSwitcher && onTabChange && (
                  <button
                    onClick={() => onTabChange(currentTab === "movies" ? "shows" : "movies")}
                    className="nav-link"
                  >
                    {currentTab === "movies" ? "TV-Hub" : "Movies-Hub"}
                  </button>
                )}
                <Link href="/livesports" className="nav-link">
                  Live Sports
                </Link>
                <Link href="/search" className="nav-link">
                  Search
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setWatchlistOpen(!watchlistOpen)}
                    className="nav-link relative"
                  >
                    Watchlist
                    {isHydrated && watchlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {watchlistCount > 9 ? '9+' : watchlistCount}
                      </span>
                    )}
                  </button>
                  <WatchlistModal
                    isOpen={watchlistOpen}
                    onClose={() => setWatchlistOpen(false)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Desktop search */}
              {showSearch && (
                <div className="hidden md:block relative w-64 lg:w-80">
                  <SearchAutocomplete
                    placeholder="Search..."
                    size="md"
                    onDrawerOpen={handleDrawerOpen}
                  />
                </div>
              )}



              {/* Settings icon - hidden on mobile */}
              <Link href="/settings" className="hidden md:block text-gray-400 hover:text-purple-400 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 settings-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>

              {/* Mobile menu button */}
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-gray-300 hover:text-white transition-colors duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 transition-transform duration-200 ${mobileMenu ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu with smooth animation */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenu ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="mt-4 pb-4 space-y-2">
              {showTabSwitcher && onTabChange && (
                <button
                  onClick={() => {
                    onTabChange(currentTab === "movies" ? "shows" : "movies")
                    setMobileMenu(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  {currentTab === "movies" ? "Switch to TV Shows" : "Switch to Movies"}
                </button>
              )}
              <Link href="/livesports" className="block px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors duration-200">
                Live Sports
              </Link>
              <Link href="/search" className="block px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors duration-200">
                Search
              </Link>
              <button
                onClick={() => {
                  setWatchlistOpen(!watchlistOpen)
                  setMobileMenu(false)
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center justify-between"
              >
                <span>Watchlist</span>
                {watchlistCount > 0 && (
                  <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {watchlistCount > 9 ? '9+' : watchlistCount}
                  </span>
                )}
              </button>
              <Link
                href="/settings"
                className="block px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Settings</span>
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Watchlist Modal */}
      {watchlistOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <WatchlistModal
              isOpen={watchlistOpen}
              onClose={() => setWatchlistOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Content Drawer for search results */}
      {selectedItem && selectedItemType && (
        <ContentDrawer
          item={selectedItem}
          type={selectedItemType}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  )
}
