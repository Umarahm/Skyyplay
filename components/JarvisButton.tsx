"use client"

import { useState } from "react"
import { JarvisAI } from "./JarvisAI"

export function JarvisButton() {
    const [isJarvisOpen, setIsJarvisOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsJarvisOpen(true)}
                className={`fixed w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-40 group ${isJarvisOpen
                        ? 'bottom-6 right-[calc(24rem+2rem)]' // Move left when chat is open
                        : 'bottom-6 right-6' // Normal position
                    }`}
                aria-label="Ask Jarvis AI"
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Jarvis Logo - Different image when chat is open */}
                    <img
                        src={isJarvisOpen ? "/jarvis-ai-chat-open.png" : "/jarvis-img.png"}
                        alt="Jarvis AI"
                        className="w-8 h-8 group-hover:animate-pulse rounded-full transition-all duration-300"
                    />

                    {/* Pulse Ring Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-75 animate-ping"></div>

                    {/* Glow Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-25 blur-xl"></div>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Ask Jarvis AI
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            </button>

            <JarvisAI
                isOpen={isJarvisOpen}
                onClose={() => setIsJarvisOpen(false)}
            />
        </>
    )
} 