"use client"

import { motion } from "framer-motion"
import { Plus, Check } from "lucide-react"
import { useWatchlist, type WatchlistItem } from "@/hooks/useWatchlist"
import { useState } from "react"

interface WatchlistButtonProps {
    item: {
        id: number
        title?: string
        name?: string
        poster_path: string | null
        vote_average: number
        release_date?: string
        first_air_date?: string
    }
    type: "movie" | "tv"
    size?: "sm" | "md" | "lg"
    variant?: "default" | "overlay" | "carousel" | "carousel-square"
    className?: string
    showText?: boolean
}

export function WatchlistButton({ item, type, size = "md", variant = "default", className = "", showText = false }: WatchlistButtonProps) {
    const { isInWatchlist, toggleWatchlist } = useWatchlist()
    const [isAnimating, setIsAnimating] = useState(false)

    const title = "title" in item ? item.title : item.name
    const isAdded = isInWatchlist(item.id, type)

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isAnimating) return

        setIsAnimating(true)

        const watchlistItem: Omit<WatchlistItem, "addedAt"> = {
            id: item.id,
            title: title || "Unknown Title",
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            release_date: item.release_date,
            first_air_date: item.first_air_date,
            type
        }

        const wasAdded = toggleWatchlist(watchlistItem)

        // Reset animation state
        setTimeout(() => setIsAnimating(false), 300)
    }

    // Size variants
    const sizeClasses = {
        sm: showText ? "h-8 text-sm" : "w-8 h-8 text-sm",
        md: showText ? "h-10 text-base" : "w-10 h-10 text-base",
        lg: showText ? "h-12 text-lg" : "w-12 h-12 text-lg"
    }

    // Icon size variants
    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    }

    // Variant styles
    const variantStyles = {
        default: "bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50",
        overlay: "bg-black/50 hover:bg-black/70 border border-white/20",
        carousel: "bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50",
        "carousel-square": "bg-gray-800/90 hover:bg-gray-700/90 border border-gray-600/50"
    }

    const isSquareVariant = variant === "carousel-square"
    const borderRadius = isSquareVariant ? "rounded-lg" : "rounded-full"

    return (
        <motion.button
            onClick={handleToggle}
            className={`
                ${sizeClasses[size]} 
                ${variantStyles[variant]}
                ${isAdded ? "bg-purple-600/90 hover:bg-purple-500/90 border-purple-500/60" : ""}
                ${borderRadius} flex items-center justify-center
                transition-all duration-200 ease-out
                hover:shadow-lg backdrop-blur-sm
                ${className}
            `}
            whileHover={{
                scale: 1.05,
                transition: { duration: 0.15, ease: "easeOut" }
            }}
            whileTap={{
                scale: 0.95,
                transition: { duration: 0.1, ease: "easeOut" }
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.2,
                ease: "easeOut"
            }}
            disabled={isAnimating}
            aria-label={isAdded ? "Remove from watchlist" : "Add to watchlist"}
        >
            <motion.div
                className={`flex items-center justify-center ${showText ? "space-x-2" : ""}`}
                animate={{
                    scale: isAnimating ? 0.8 : 1,
                }}
                transition={{
                    duration: 0.15,
                    ease: "easeOut"
                }}
            >
                <motion.div
                    className={`flex items-center ${showText ? "space-x-2" : ""}`}
                    key={isAdded ? "added" : "add"}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{
                        duration: 0.2,
                        ease: "easeOut"
                    }}
                >
                    {isAdded ? (
                        <>
                            <Check className={`${iconSizes[size]} text-white`} />
                            {showText && <span className="text-white">Added</span>}
                        </>
                    ) : (
                        <>
                            <Plus className={`${iconSizes[size]} text-white`} />
                            {showText && <span className="text-white">Watchlist</span>}
                        </>
                    )}
                </motion.div>
            </motion.div>
        </motion.button>
    )
} 