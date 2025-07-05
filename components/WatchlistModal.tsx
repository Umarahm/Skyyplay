"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Calendar, Star, Trash2 } from "lucide-react"
import Image from "next/image"
import { useWatchlist } from "@/hooks/useWatchlist"

interface WatchlistModalProps {
    isOpen: boolean
    onClose: () => void
    trigger?: React.ReactNode
}

export function WatchlistModal({ isOpen, onClose, trigger }: WatchlistModalProps) {
    const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist()
    const modalRef = useRef<HTMLDivElement>(null)

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen, onClose])

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen, onClose])

    const handleRemoveItem = (id: number, type: "movie" | "tv") => {
        removeFromWatchlist(id, type)
    }

    const handleClearAll = () => {
        clearWatchlist()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).getFullYear()
    }

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: -10
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 30
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: -10,
            transition: {
                duration: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={modalRef}
                    className="md:absolute md:top-full md:right-0 md:mt-2 w-full md:w-80 max-w-sm bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h3 className="text-lg font-semibold text-white">My Watchlist</h3>
                        <div className="flex items-center space-x-2">
                            {watchlist.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                    title="Clear all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {watchlist.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-gray-400 mb-2">
                                    <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-lg font-medium">No items in watchlist</p>
                                    <p className="text-sm">Add movies and TV shows to your watchlist to see them here</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2">
                                <AnimatePresence>
                                    {watchlist.map((item, index) => (
                                        <motion.div
                                            key={`${item.id}-${item.type}`}
                                            className="group flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => window.location.href = `/watch?id=${item.id}&type=${item.type}`}
                                        >
                                            {/* Poster */}
                                            <div className="w-12 h-16 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                                                {item.poster_path ? (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                                                        alt={item.title}
                                                        width={48}
                                                        height={64}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Star className="w-6 h-6 text-gray-500" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-white truncate text-sm">
                                                    {item.title}
                                                </h4>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-xs text-gray-400 capitalize">
                                                        {item.type}
                                                    </span>
                                                    {(item.release_date || item.first_air_date) && (
                                                        <>
                                                            <span className="text-xs text-gray-500">•</span>
                                                            <span className="text-xs text-gray-400">
                                                                {formatDate(item.release_date || item.first_air_date || "")}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-1 mt-1">
                                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                                    <span className="text-xs text-gray-400">
                                                        {item.vote_average.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Remove button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRemoveItem(item.id, item.type)
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200 p-1 rounded"
                                                title="Remove from watchlist"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {watchlist.length > 0 && (
                        <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                            <p className="text-xs text-gray-400 text-center">
                                {watchlist.length} item{watchlist.length !== 1 ? 's' : ''} in your watchlist
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
} 