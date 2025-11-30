"use client"

import { ContinueWatchingCard } from "./ContinueWatchingCard"
import { useContinueWatching } from "@/hooks/useContinueWatching"

interface ContinueWatchingProps {
    isVisible: boolean
    onScrollSection: (containerId: string, direction: "left" | "right") => void
}

export function ContinueWatching({ isVisible, onScrollSection }: ContinueWatchingProps) {
    const { continueWatchingItems, removeFromContinueWatching } = useContinueWatching()

    // Force visibility for now to rule out animation issues
    // const isVisible = true 

    // Remove the strict visibility check and complex animation dependency for now
    // The logic below was relying on 'isVisible' prop which might be false initially or not updating correctly

    return (
        <div className="py-6 px-0 sm:px-6 animate-fade-in-up">
            <div className="container mx-auto">
                {continueWatchingItems.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
                            <h2 className="text-2xl font-bold brand-text">Continue Watching</h2>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => onScrollSection("continueWatchingContainer", "left")}
                                    className="section-nav-button prev"
                                    aria-label="Scroll left"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onScrollSection("continueWatchingContainer", "right")}
                                    className="section-nav-button next"
                                    aria-label="Scroll right"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="relative overflow-hidden">
                            <div
                                id="continueWatchingContainer"
                                className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
                                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            >
                                {continueWatchingItems.map((item, index) => (
                                    <div
                                        key={`${item.id}-${item.type}`}
                                        className="flex-shrink-0 category-item animate-fade-in-up stagger-animation"
                                        style={{ "--stagger": index } as React.CSSProperties}
                                    >
                                        <ContinueWatchingCard
                                            item={item}
                                            onRemove={removeFromContinueWatching}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
} 