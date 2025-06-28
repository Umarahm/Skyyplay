"use client"

import React, { useState } from 'react'
import { useSearchHistory } from '@/hooks/useSearchHistory'

interface SearchFiltersProps {
    currentTab: 'movies' | 'shows'
    genres: { id: number; name: string }[]
    selectedGenre: string
    minRating: string
    yearRange: string
    sortBy: string
    onGenreChange: (genre: string) => void
    onRatingChange: (rating: string) => void
    onYearChange: (year: string) => void
    onSortChange: (sort: string) => void
    onQuickSearch?: (query: string) => void
    clearAllFilters: () => void
    hasActiveFilters: boolean
}

export function SearchFilters({
    currentTab,
    genres,
    selectedGenre,
    minRating,
    yearRange,
    sortBy,
    onGenreChange,
    onRatingChange,
    onYearChange,
    onSortChange,
    onQuickSearch,
    clearAllFilters,
    hasActiveFilters
}: SearchFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false)
    const { getRecentSearches } = useSearchHistory()

    // Trending/Popular search suggestions based on content type (limited to 3)
    const trendingSearches = currentTab === 'movies'
        ? ['Marvel', 'Star Wars', 'Christopher Nolan']
        : ['Breaking Bad', 'Game of Thrones', 'The Office']

    const recentSearches = getRecentSearches(3) // Limited to 3

    const sortOptions = [
        { value: 'popularity.desc', label: 'Most Popular' },
        { value: 'vote_average.desc', label: 'Highest Rated' },
        { value: 'release_date.desc', label: 'Newest First' },
        { value: 'release_date.asc', label: 'Oldest First' },
        { value: 'title.asc', label: 'A-Z' },
        { value: 'title.desc', label: 'Z-A' }
    ]

    const ratingOptions = [
        { value: '', label: 'Any Rating' },
        { value: '9', label: '9+ ⭐ Masterpiece' },
        { value: '8', label: '8+ ⭐ Excellent' },
        { value: '7', label: '7+ ⭐ Good' },
        { value: '6', label: '6+ ⭐ Decent' },
        { value: '5', label: '5+ ⭐ Average' }
    ]

    const yearOptions = [
        { value: '', label: 'Any Year' },
        { value: '2020,2024', label: '2020s' },
        { value: '2010,2019', label: '2010s' },
        { value: '2000,2009', label: '2000s' },
        { value: '1990,1999', label: '1990s' },
        { value: '1980,1989', label: '1980s' },
        { value: '1970,1979', label: '1970s' }
    ]

    const getGenreName = (genreId: string) => {
        const genre = genres.find(g => g.id === parseInt(genreId))
        return genre ? genre.name : ''
    }

    const getYearRangeName = (range: string) => {
        if (!range) return ''
        const option = yearOptions.find(opt => opt.value === range)
        return option ? option.label : range
    }

    const getRatingName = (rating: string) => {
        if (!rating) return ''
        return `${rating}+ ⭐`
    }

    return (
        <div className="space-y-6">
            {/* Quick Search Suggestions */}
            {onQuickSearch && (
                <div className="space-y-4">
                    {/* Trending Searches */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Trending {currentTab === 'movies' ? 'Movies' : 'TV Shows'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {trendingSearches.map((search) => (
                                <button
                                    key={search}
                                    onClick={() => onQuickSearch(search)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-violet-600/20 
                           hover:from-purple-600/40 hover:to-violet-600/40 
                           border border-purple-500/30 rounded-full text-sm 
                           text-gray-300 hover:text-white transition-all duration-200
                           hover:scale-105 backdrop-blur-sm"
                                >
                                    {search}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Recent Searches
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map((search) => (
                                    <button
                                        key={search.id}
                                        onClick={() => onQuickSearch(search.query)}
                                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 
                             border border-gray-600 rounded-full text-sm 
                             text-gray-300 hover:text-white transition-all duration-200
                             flex items-center space-x-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{search.query}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filter Controls */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Filters</h3>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-purple-400 hover:text-purple-300 text-sm flex items-center space-x-1"
                    >
                        <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
                        <svg
                            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Quick Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Genre Filter */}
                    <select
                        value={selectedGenre}
                        onChange={(e) => onGenreChange(e.target.value)}
                        className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm
                     border border-gray-600 hover:border-purple-500/50
                     focus:border-purple-500 focus:ring-1 focus:ring-purple-500 
                     focus:outline-none transition-colors appearance-none"
                    >
                        <option value="">All Genres</option>
                        {genres.map((genre) => (
                            <option key={genre.id} value={genre.id}>
                                {genre.name}
                            </option>
                        ))}
                    </select>

                    {/* Rating Filter */}
                    <select
                        value={minRating}
                        onChange={(e) => onRatingChange(e.target.value)}
                        className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm
                     border border-gray-600 hover:border-purple-500/50
                     focus:border-purple-500 focus:ring-1 focus:ring-purple-500 
                     focus:outline-none transition-colors appearance-none"
                    >
                        {ratingOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Year Filter */}
                    <select
                        value={yearRange}
                        onChange={(e) => onYearChange(e.target.value)}
                        className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm
                     border border-gray-600 hover:border-purple-500/50
                     focus:border-purple-500 focus:ring-1 focus:ring-purple-500 
                     focus:outline-none transition-colors appearance-none"
                    >
                        {yearOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Sort Filter */}
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm
                     border border-gray-600 hover:border-purple-500/50
                     focus:border-purple-500 focus:ring-1 focus:ring-purple-500 
                     focus:outline-none transition-colors appearance-none"
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 space-y-4">
                        <h4 className="font-medium text-gray-300 mb-3">Advanced Options</h4>

                        {/* Custom Year Range */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">From Year</label>
                                <input
                                    type="number"
                                    min="1900"
                                    max="2024"
                                    placeholder="1990"
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm
                           text-white placeholder-gray-500
                           focus:border-purple-500 focus:ring-1 focus:ring-purple-500 
                           focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">To Year</label>
                                <input
                                    type="number"
                                    min="1900"
                                    max="2024"
                                    placeholder="2024"
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm
                           text-white placeholder-gray-500
                           focus:border-purple-500 focus:ring-1 focus:ring-purple-500 
                           focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Runtime Filter (for movies) */}
                        {currentTab === 'movies' && (
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Runtime (minutes)</label>
                                <select className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white
                               focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none appearance-none">
                                    <option value="">Any Length</option>
                                    <option value="0,90">Short (&lt; 90 min)</option>
                                    <option value="90,120">Standard (90-120 min)</option>
                                    <option value="120,180">Long (2-3 hours)</option>
                                    <option value="180,">Epic (3+ hours)</option>
                                </select>
                            </div>
                        )}

                        {/* Language Filter */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Language</label>
                            <select className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white
                               focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none appearance-none">
                                <option value="">Any Language</option>
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="ja">Japanese</option>
                                <option value="ko">Korean</option>
                                <option value="hi">Hindi</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-400">Active Filters</h4>
                        <button
                            onClick={clearAllFilters}
                            className="text-xs text-purple-400 hover:text-purple-300 
                       flex items-center space-x-1 transition-colors"
                        >
                            <span>Clear All</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {selectedGenre && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs 
                             bg-purple-600 text-white space-x-2">
                                <span>{getGenreName(selectedGenre)}</span>
                                <button
                                    onClick={() => onGenreChange('')}
                                    className="hover:text-gray-300 transition-colors"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {minRating && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs 
                             bg-yellow-600 text-white space-x-2">
                                <span>{getRatingName(minRating)}</span>
                                <button
                                    onClick={() => onRatingChange('')}
                                    className="hover:text-gray-300 transition-colors"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {yearRange && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs 
                             bg-blue-600 text-white space-x-2">
                                <span>{getYearRangeName(yearRange)}</span>
                                <button
                                    onClick={() => onYearChange('')}
                                    className="hover:text-gray-300 transition-colors"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
} 