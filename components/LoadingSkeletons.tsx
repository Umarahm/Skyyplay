"use client"

import React from 'react'

// Skeleton for content cards
export function ContentCardSkeleton() {
    return (
        <div className="card-hover rounded-lg overflow-hidden bg-gray-800 border border-purple-500/10 relative animate-pulse">
            <div className="relative aspect-[2/3]">
                <div className="w-full h-full bg-gray-700"></div>
            </div>
        </div>
    )
}

// Skeleton for carousel
export function CarouselSkeleton() {
    return (
        <div className="relative w-full bg-gray-800 rounded-lg overflow-hidden animate-pulse">
            <div className="aspect-video bg-gradient-to-r from-gray-700 to-gray-600"></div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="space-y-3">
                    <div className="h-8 bg-gray-600 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                    <div className="flex space-x-3">
                        <div className="h-10 bg-purple-600/50 rounded w-24"></div>
                        <div className="h-10 bg-gray-600/50 rounded w-32"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Skeleton for content grid
export function ContentGridSkeleton({ count = 20 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: count }, (_, i) => (
                <ContentCardSkeleton key={i} />
            ))}
        </div>
    )
}

// Skeleton for search results
export function SearchResultsSkeleton() {
    return (
        <div className="space-y-8">
            <div className="animate-pulse">
                <div className="h-6 bg-gray-600 rounded w-48 mb-4"></div>
                <ContentGridSkeleton count={12} />
            </div>
        </div>
    )
}

// Skeleton for genre sections
export function GenreSectionSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="h-8 bg-gray-600 rounded w-64 mb-4"></div>
                    <div className="flex space-x-4 overflow-hidden">
                        {Array.from({ length: 8 }, (_, j) => (
                            <div key={j} className="flex-shrink-0">
                                <ContentCardSkeleton />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

// Skeleton for text content
export function TextSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }, (_, i) => (
                <div
                    key={i}
                    className={`h-4 bg-gray-600 rounded animate-pulse ${i === lines - 1 ? 'w-3/4' : 'w-full'
                        }`}
                ></div>
            ))}
        </div>
    )
}

// Skeleton for navbar
export function NavbarSkeleton() {
    return (
        <div className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/10">
            <div className="container mx-auto px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-600 rounded animate-pulse"></div>
                            <div className="h-8 bg-gray-600 rounded w-32 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-10 bg-gray-600 rounded-full w-64 animate-pulse"></div>
                        <div className="w-6 h-6 bg-gray-600 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    )
} 