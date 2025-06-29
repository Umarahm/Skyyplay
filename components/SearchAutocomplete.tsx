"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearchHistory, type SearchHistoryItem } from '@/hooks/useSearchHistory'
import Image from 'next/image'

interface SearchSuggestion {
    id: number
    title: string
    subtitle: string
    type: 'movie' | 'tv' | 'person'
    image: string | null
    year: number | null
    rating: string | null
}

interface SearchAutocompleteProps {
    placeholder?: string
    initialValue?: string
    onSearch?: (query: string, type?: string) => void
    searchType?: 'multi' | 'movie' | 'tv' | 'person'
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

function SearchAutocomplete({
    placeholder = "Search for movies, TV shows, or people...",
    initialValue = "",
    onSearch,
    searchType = 'multi',
    className = "",
    size = 'md'
}: SearchAutocompleteProps) {
    const [query, setQuery] = useState(initialValue)
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [showHistory, setShowHistory] = useState(false)

    const debouncedQuery = useDebounce(query, 300)
    const { addToHistory, getRecentSearches, getSearchSuggestions } = useSearchHistory()
    const router = useRouter()

    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    // Fetch suggestions from API
    const fetchSuggestions = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSuggestions([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`/api/tmdb/search/suggestions?q=${encodeURIComponent(searchQuery)}&type=${searchType}`)
            const data = await response.json()
            setSuggestions(data.suggestions || [])
        } catch (error) {
            console.error('Error fetching suggestions:', error)
            setSuggestions([])
        } finally {
            setIsLoading(false)
        }
    }, [searchType])

    // Effect for debounced search
    useEffect(() => {
        if (debouncedQuery.trim()) {
            fetchSuggestions(debouncedQuery)
            setShowHistory(false)
        } else {
            setSuggestions([])
            setShowHistory(true)
        }
    }, [debouncedQuery, fetchSuggestions])

    // Handle input focus
    const handleFocus = () => {
        setIsOpen(true)
        if (!query.trim()) {
            setShowHistory(true)
        }
    }

    // Handle input blur
    const handleBlur = (e: React.FocusEvent) => {
        // Don't close if clicking on suggestions
        if (containerRef.current?.contains(e.relatedTarget as Node)) {
            return
        }
        setTimeout(() => setIsOpen(false), 150)
    }

    // Handle search execution
    const executeSearch = (searchQuery: string, suggestion?: SearchSuggestion) => {
        if (!searchQuery.trim()) return

        addToHistory(searchQuery, suggestion?.type || searchType, suggestions.length)

        if (suggestion) {
            // Navigate to watch page for specific content
            const type = suggestion.type === 'movie' ? 'movie' : 'tv'
            router.push(`/watch?id=${suggestion.id}&type=${type}`)
        } else {
            // Navigate to search results page
            if (onSearch) {
                onSearch(searchQuery, searchType)
            } else {
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
            }
        }

        setIsOpen(false)
        inputRef.current?.blur()
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return

        const totalItems = showHistory
            ? getRecentSearches().length + getSearchSuggestions(query).length
            : suggestions.length

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % totalItems)
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1)
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0) {
                    if (showHistory) {
                        const recentSearches = getRecentSearches()
                        const historySuggestions = getSearchSuggestions(query)
                        const allItems = [...recentSearches, ...historySuggestions]
                        const item = allItems[selectedIndex]
                        if (item) {
                            setQuery(item.query)
                            executeSearch(item.query)
                        }
                    } else {
                        const suggestion = suggestions[selectedIndex]
                        if (suggestion) {
                            executeSearch(suggestion.title, suggestion)
                        }
                    }
                } else {
                    executeSearch(query)
                }
                break
            case 'Escape':
                setIsOpen(false)
                inputRef.current?.blur()
                break
        }
    }

    // Size-based styling
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-6 py-4 text-lg'
    }

    const recentSearches = getRecentSearches(3)
    const historySuggestions = getSearchSuggestions(query, 3)

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Search Input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`
            w-full bg-gray-900 border border-purple-500/20 rounded-full
            focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
            text-white placeholder-gray-400 transition-all duration-200
            ${sizeClasses[size]}
            pr-12
          `}
                />

                {/* Search Icon */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && (showHistory || suggestions.length > 0) && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-2 bg-gray-900 border border-purple-500/20 rounded-xl shadow-2xl max-h-96 overflow-y-auto"
                >
                    {showHistory && (
                        <>
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div className="p-3 border-b border-gray-700/50">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Searches</h4>
                                    {recentSearches.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => executeSearch(item.query)}
                                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors ${selectedIndex === index ? 'bg-gray-800' : ''
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-white">{item.query}</span>
                                                <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* History-based Suggestions */}
                            {historySuggestions.length > 0 && (
                                <div className="p-3">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Suggestions</h4>
                                    {historySuggestions.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => executeSearch(item.query)}
                                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors ${selectedIndex === recentSearches.length + index ? 'bg-gray-800' : ''
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="text-white">{item.query}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* API Suggestions */}
                    {!showHistory && suggestions.length > 0 && (
                        <div className="p-3">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={`${suggestion.type}-${suggestion.id}`}
                                    onClick={() => executeSearch(suggestion.title, suggestion)}
                                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors ${selectedIndex === index ? 'bg-gray-800' : ''
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        {/* Poster/Profile Image */}
                                        <div className="w-12 h-16 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                                            {suggestion.image ? (
                                                <Image
                                                    src={suggestion.image}
                                                    alt={suggestion.title}
                                                    width={48}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-medium text-white truncate">{suggestion.title}</h4>
                                                {suggestion.year && (
                                                    <span className="text-sm text-gray-400">({suggestion.year})</span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-sm text-gray-500 capitalize">{suggestion.subtitle}</span>
                                                {suggestion.rating && (
                                                    <div className="flex items-center space-x-1">
                                                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                        <span className="text-xs text-gray-400">{suggestion.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {!showHistory && !isLoading && query.trim() && suggestions.length === 0 && (
                        <div className="p-6 text-center">
                            <div className="text-gray-500 mb-2">No results found</div>
                            <button
                                onClick={() => executeSearch(query)}
                                className="text-purple-400 hover:text-purple-300 text-sm"
                            >
                                Search for "{query}" anyway
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SearchAutocomplete 