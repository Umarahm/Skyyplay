"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const genreTagVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.9
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
            transition: {
                duration: 0.2,
                ease: "easeOut" as const
            }
        },
        selected: {
            scale: 1.1,
            transition: {
                duration: 0.3,
                ease: "easeOut" as const
            }
        }
    }

    const aiBadgeVariants = {
        hidden: {
            opacity: 0,
            x: 20
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut" as const,
                delay: 0.5
            }
        }
    }

    const scrollContainer = (direction: 'left' | 'right') => {
        const container = document.querySelector('.genre-tags-container') as HTMLElement
        if (container) {
            const scrollAmount = direction === 'left' ? -200 : 200
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

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
        <div className={`relative ${className}`}>
            {/* Desktop Navigation Buttons - Hidden on Mobile */}
            <motion.button
                onClick={() => scrollContainer('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-2 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hidden lg:flex"
                aria-label="Scroll genres left"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.8 }}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </motion.button>

            <motion.button
                onClick={() => scrollContainer('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/80 text-white p-2 rounded-full z-20 transition-all duration-300 backdrop-blur-sm border border-purple-500/30 hidden lg:flex"
                aria-label="Scroll genres right"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.8 }}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </motion.button>

            {/* Genre Tags Container */}
            <motion.div
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 genre-tags-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <AnimatePresence>
                    {genresWithMood.map((genre) => (
                        <motion.button
                            key={genre.id}
                            onClick={() => onGenreSelect(genre)}
                            className={`
                                group relative overflow-hidden rounded-full px-4 py-2 
                                transition-all duration-300 border flex-shrink-0
                                ${selectedGenre === genre.id
                                    ? 'bg-purple-500 border-purple-500 text-white'
                                    : 'bg-gray-800/50 border-purple-500/20 text-gray-300 hover:bg-purple-500/10 hover:border-purple-500/40 hover:text-white'
                                }
                                ${genre.isLoading ? 'animate-pulse' : ''}
                            `}
                            disabled={genre.isLoading}
                            variants={genreTagVariants}
                            whileHover={selectedGenre !== genre.id ? "hover" : undefined}
                            animate={selectedGenre === genre.id ? "selected" : "visible"}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="relative z-10">
                                <div className="font-medium text-sm">
                                    {genre.name}
                                </div>
                                <AnimatePresence mode="wait">
                                    {genre.moodTag && !genre.isLoading && (
                                        <motion.div
                                            className={`
                                                text-xs mt-0.5 transition-opacity duration-300
                                                ${selectedGenre === genre.id
                                                    ? 'text-purple-100'
                                                    : 'text-purple-300 group-hover:text-purple-200'
                                                }
                                            `}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {genre.moodTag}
                                        </motion.div>
                                    )}
                                    {genre.isLoading && (
                                        <motion.div
                                            className="text-xs mt-0.5 text-gray-500"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <span className="animate-pulse">Loading...</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Subtle background animation on hover */}
                            <motion.div
                                className={`
                                    absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0
                                    ${selectedGenre === genre.id ? 'opacity-0' : ''}
                                `}
                                initial={{ x: '-100%' }}
                                whileHover={{ x: '100%' }}
                                transition={{ duration: 0.7, ease: "easeOut" as const }}
                            />
                        </motion.button>
                    ))}
                </AnimatePresence>

                {/* AI Badge */}
                <motion.div
                    className="flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex-shrink-0"
                    variants={aiBadgeVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg className="w-3 h-3 mr-1 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-purple-300 font-medium">AI Enhanced</span>
                </motion.div>
            </motion.div>
        </div>
    )
} 