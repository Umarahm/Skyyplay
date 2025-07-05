"use client"

import { motion } from "framer-motion"
import { ContinueWatchingCard } from "./ContinueWatchingCard"
import { useContinueWatching } from "@/hooks/useContinueWatching"

interface ContinueWatchingProps {
    isVisible: boolean
    onScrollSection: (containerId: string, direction: "left" | "right") => void
}

export function ContinueWatching({ isVisible, onScrollSection }: ContinueWatchingProps) {
    const { continueWatchingItems, removeFromContinueWatching } = useContinueWatching()

    if (continueWatchingItems.length === 0) {
        return null
    }

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    const staggerContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            className="py-6 px-0 sm:px-6"
            variants={sectionVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
                    <h2 className="text-2xl font-bold brand-text">Continue Watching</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onScrollSection("continueWatchingContainer", "left")}
                            className="bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
                            aria-label="Scroll left"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onScrollSection("continueWatchingContainer", "right")}
                            className="bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
                            aria-label="Scroll right"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="relative overflow-hidden">
                    <motion.div
                        id="continueWatchingContainer"
                        className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        variants={staggerContainerVariants}
                        initial="hidden"
                        animate={isVisible ? "visible" : "hidden"}
                    >
                        {continueWatchingItems.map((item) => (
                            <motion.div
                                key={`${item.id}-${item.type}`}
                                className="flex-shrink-0 w-36 md:w-44"
                                variants={cardVariants}
                            >
                                <ContinueWatchingCard
                                    item={item}
                                    onRemove={removeFromContinueWatching}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
} 