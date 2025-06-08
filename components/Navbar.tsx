"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useWatchLater } from "@/contexts/WatchLaterContext"
import { WatchLaterModal } from "./WatchLaterModal"

interface NavbarProps {
  showSearch?: boolean
  showTabSwitcher?: boolean
  currentTab?: "movies" | "shows"
  onTabChange?: (tab: "movies" | "shows") => void
}

export function Navbar({ showSearch = true, showTabSwitcher = false, currentTab = "shows", onTabChange }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showWatchLater, setShowWatchLater] = useState(false)
  const { watchLaterCount } = useWatchLater()
  const router = useRouter()

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <>
      <nav className="fixed w-full z-50 glass-effect">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 md:space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <Image src="logo.avif" alt="Logo" width={40} height={40} className="animate-pulse" />
                <span className="hidden sm:inline text-2xl md:text-3xl font-bold logo-text">SkyyPlay</span>
              </Link>

              {/* Mobile search bar */}
              {showSearch && (
                <div className="md:hidden relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search..."
                    className="w-32 bg-gray-900 border border-purple-500/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              )}

              <div className="hidden md:flex space-x-6">
                {showTabSwitcher && onTabChange && (
                  <button
                    onClick={() => onTabChange(currentTab === "movies" ? "shows" : "movies")}
                    className="nav-link"
                  >
                    {currentTab === "movies" ? "Switch to TV Shows" : "Switch to Movies"}
                  </button>
                )}
                <Link href="/livesports" className="nav-link">
                  Live Sports
                </Link>
                <Link href="/search" className="nav-link">
                  Search
                </Link>
                <button onClick={() => setShowWatchLater(true)} className="nav-link flex items-center space-x-2">
                  <span>Watch Later</span>
                  {watchLaterCount > 0 && (
                    <span className="bg-purple-600 text-white text-xs flex items-center justify-center rounded-full w-6 h-6 animate-pulse">
                      {watchLaterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Desktop search */}
              {showSearch && (
                <div className="relative hidden md:block">
                  <div className="search-container w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Search..."
                      className="search-input bg-gray-900 rounded-full px-6 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full pr-20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-gray-400 pointer-events-none select-none">
                      <span className="text-xs bg-gray-700 rounded px-1.5 py-0.5">⌘</span>
                      <span className="text-xs bg-gray-700 rounded px-1.5 py-0.5">K</span>
                    </div>
                  </div>
                </div>
              )}

              <Link href="/settings" className="text-gray-400 hover:text-purple-400 transition-colors duration-300">
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
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-gray-300 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenu && (
            <div className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-4">
                {showTabSwitcher && onTabChange && (
                  <button
                    onClick={() => {
                      onTabChange(currentTab === "movies" ? "shows" : "movies")
                      setMobileMenu(false)
                    }}
                    className="text-left px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {currentTab === "movies" ? "Switch to TV Shows" : "Switch to Movies"}
                  </button>
                )}
                <Link href="/livesports" className="px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors">
                  Live Sports
                </Link>
                <Link href="/search" className="px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors">
                  Search
                </Link>
                <button
                  onClick={() => {
                    setShowWatchLater(true)
                    setMobileMenu(false)
                  }}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <span>Watch Later</span>
                  {watchLaterCount > 0 && (
                    <span className="bg-purple-600 text-white text-xs flex items-center justify-center rounded-full w-6 h-6">
                      {watchLaterCount}
                    </span>
                  )}
                </button>
                <Link
                  href="/settings"
                  className="px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors flex items-center space-x-2"
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
          )}
        </div>
      </nav>

      <WatchLaterModal isOpen={showWatchLater} onClose={() => setShowWatchLater(false)} />
    </>
  )
}
