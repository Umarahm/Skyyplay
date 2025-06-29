"use client"

import React, { useState, useEffect } from 'react'
import type { Genre } from '@/lib/tmdb'

interface SmartGenreTagsProps {
    genres: Genre[]
    contentType: 'movie' | 'tv'
    selectedGenre?: number | null
    onGenreSelect: (genre: Genre) => void
    className?: string
}

interface GenreWithMood extends Genre {
    moodTag?: string
    isLoading?: boolean
}

export function SmartGenreTags({
    genres,
    contentType,
    selectedGenre,
    onGenreSelect,
    className = ""
}: SmartGenreTagsProps) {
    const [genresWithMood, setGenresWithMood] = useState<GenreWithMood[]>(
        genres.map(genre => ({ ...genre, isLoading: true }))
    )

    useEffect(() => {
        if (genres.length === 0) return

        // Start with basic genres immediately
        setGenresWithMood(genres.map(genre => ({
            ...genre,
            moodTag: '',
            isLoading: true
        })))

        const fetchMoodTags = async () => {
            try {
                const response = await fetch('/api/ai/genre-tags', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        genres,
                        contentType
                    })
                })

                if (response.ok) {
                    const { moodTags } = await response.json()

                    setGenresWithMood(genres.map(genre => ({
                        ...genre,
                        moodTag: moodTags[genre.name] || '',
                        isLoading: false
                    })))
                } else {
                    // Fallback: just show genre names without mood tags
                    setGenresWithMood(genres.map(genre => ({
                        ...genre,
                        moodTag: '',
                        isLoading: false
                    })))
                }
            } catch (error) {
                console.error('Error fetching mood tags:', error)
                // Fallback: just show genre names without mood tags
                setGenresWithMood(genres.map(genre => ({
                    ...genre,
                    moodTag: '',
                    isLoading: false
                })))
            }
        }

        // Delay API call to prevent blocking page load
        const timer = setTimeout(fetchMoodTags, 1000)
        return () => clearTimeout(timer)
    }, [genres, contentType])

    return (
        <div className={`flex flex-wrap gap-3 ${className}`}>
            {genresWithMood.map((genre) => (
                <button
                    key={genre.id}
                    onClick={() => onGenreSelect(genre)}
                    className={`
            group relative overflow-hidden rounded-full px-4 py-2 
            transition-all duration-300 border
            ${selectedGenre === genre.id
                            ? 'bg-purple-500 border-purple-500 text-white scale-105'
                            : 'bg-gray-800/50 border-purple-500/20 text-gray-300 hover:bg-purple-500/10 hover:border-purple-500/40 hover:text-white'
                        }
            ${genre.isLoading ? 'animate-pulse' : ''}
          `}
                    disabled={genre.isLoading}
                >
                    <div className="relative z-10">
                        <div className="font-medium text-sm">
                            {genre.name}
                        </div>
                        {genre.moodTag && !genre.isLoading && (
                            <div className={`
                text-xs mt-0.5 transition-opacity duration-300
                ${selectedGenre === genre.id
                                    ? 'text-purple-100'
                                    : 'text-purple-300 group-hover:text-purple-200'
                                }
              `}>
                                {genre.moodTag}
                            </div>
                        )}
                        {genre.isLoading && (
                            <div className="text-xs mt-0.5 text-gray-500">
                                <span className="animate-pulse">Loading...</span>
                            </div>
                        )}
                    </div>

                    {/* Subtle background animation on hover */}
                    <div className={`
            absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0
            transform translate-x-[-100%] group-hover:translate-x-[100%] 
            transition-transform duration-700 ease-out
            ${selectedGenre === genre.id ? 'opacity-0' : ''}
          `} />
                </button>
            ))}

            {/* AI Badge */}
            <div className="flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <svg className="w-3 h-3 mr-1 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-purple-300 font-medium">AI Enhanced</span>
            </div>
        </div>
    )
} 