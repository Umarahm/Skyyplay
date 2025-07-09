"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Genre } from '@/lib/tmdb'

interface SmartGenreTagsProps {
    genres: Genre[]
    contentType: 'movie' | 'tv'
    selectedGenre?: number | null
    onGenreSelect: (genre: Genre) => void
    className?: string
}

export function SmartGenreTags({
    genres,
    contentType,
    selectedGenre,
    onGenreSelect,
    className = ""
}: SmartGenreTagsProps) {
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

    const scrollContainer = (direction: 'left' | 'right') => {
        const container = document.querySelector('.genre-tags-container') as HTMLElement
        if (container) {
            const scrollAmount = direction === 'left' ? -200 : 200
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Desktop Navigation Buttons - Hidden on Mobile */}
            <motion.button
                onClick={() => scrollContainer('left')}
                className="bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 z-20 hidden lg:flex"
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

            {/* Genre Tags Container */}
            <motion.div
                className="flex-1 flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 genre-tags-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <AnimatePresence>
                    {genres.map((genre) => (
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
                            `}
                            variants={genreTagVariants}
                            whileHover={selectedGenre !== genre.id ? "hover" : undefined}
                            animate={selectedGenre === genre.id ? "selected" : "visible"}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="relative z-10">
                                <div className="font-medium text-sm">
                                    {genre.name}
                                </div>
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
            </motion.div>

            <motion.button
                onClick={() => scrollContainer('right')}
                className="bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 z-20 hidden lg:flex"
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
        </div>
    )
} 