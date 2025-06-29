"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Movie, TVShow } from "@/lib/tmdb"

interface Message {
    id: string
    type: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface JarvisAIProps {
    isOpen: boolean
    onClose: () => void
}

export function JarvisAI({ isOpen, onClose }: JarvisAIProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'assistant',
            content: "Hello! I'm Jarvis, your AI movie companion. I can recommend movies and TV shows based on your mood, preferences, or any criteria you have. What kind of content are you looking for today?",
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const clearChat = () => {
        setMessages([
            {
                id: '1',
                type: 'assistant',
                content: "Hello! I'm Jarvis, your AI movie companion. I can recommend movies and TV shows based on your mood, preferences, or any criteria you have. What kind of content are you looking for today?",
                timestamp: new Date()
            }
        ])
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue("")
        setIsLoading(true)

        try {
            const response = await fetch('/api/ai/jarvis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    conversationHistory: messages.map(m => ({
                        role: m.type === 'user' ? 'user' : 'assistant',
                        content: m.content
                    }))
                })
            })

            if (response.ok) {
                const data = await response.json()

                if (data.response) {
                    const assistantMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        type: 'assistant',
                        content: data.response,
                        timestamp: new Date()
                    }
                    setMessages(prev => [...prev, assistantMessage])
                } else {
                    throw new Error('No response data received')
                }
            } else {
                console.error('Jarvis: API returned error status:', response.status)
                throw new Error(`API error: ${response.status}`)
            }
        } catch (error) {
            console.error('Jarvis AI error:', error)

            // Provide more helpful error messages based on the error type
            let errorContent = "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or you can browse our curated collections instead!"

            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorContent = "I'm having trouble connecting to my servers. Please check your internet connection and try again."
            } else if (error instanceof Error && error.message.includes('API error: 429')) {
                errorContent = "I'm a bit busy right now due to high demand. Please try again in a few minutes!"
            } else if (error instanceof Error && error.message.includes('API error: 500')) {
                errorContent = "I'm experiencing some technical difficulties. Please try again in a moment."
            }

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: errorContent,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    // Animation variants
    const containerVariants = {
        hidden: {
            y: "100%",
            scale: 0.95,
            opacity: 0
        },
        visible: {
            y: 0,
            scale: 1,
            opacity: 1,
            transition: {
                type: "spring" as const,
                damping: 25,
                stiffness: 300,
                duration: 0.4
            }
        },
        exit: {
            y: "100%",
            scale: 0.95,
            opacity: 0,
            transition: {
                type: "spring" as const,
                damping: 25,
                stiffness: 300,
                duration: 0.3
            }
        }
    }

    const contentVariants = {
        hidden: {
            opacity: 0,
            y: 20
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.1,
                duration: 0.3,
                ease: "easeOut" as const
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.2
            }
        }
    }

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="fixed bottom-4 right-4 left-4 md:left-auto md:w-full md:max-w-md flex flex-col z-50"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <motion.div
                        className={`bg-gray-900 border border-purple-500/20 rounded-2xl shadow-2xl w-full flex flex-col transition-all duration-300 ease-out ${isMinimized ? 'h-16' : 'h-[70vh] md:h-[600px]'
                            }`}
                        variants={contentVariants}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 md:p-4 border-b border-purple-500/20">
                            <div className="flex items-center space-x-2 md:space-x-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                                    <img
                                        src="/jarvis-img.png"
                                        alt="Jarvis AI"
                                        className="w-5 h-5 md:w-6 md:h-6 rounded-full"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm md:text-base">Jarvis AI</h3>
                                    <div className="flex items-center space-x-1 md:space-x-2">
                                        <p className="text-xs text-purple-400">Your Movie Companion</p>
                                        <span className="text-xs bg-purple-600 text-white px-1.5 md:px-2 py-0.5 rounded-full font-medium">BETA</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1 md:space-x-2">
                                {/* Minimize/Maximize Button */}
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                    title={isMinimized ? "Maximize Chat" : "Minimize Chat"}
                                >
                                    {isMinimized ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    )}
                                </button>
                                {/* Clear Chat Button */}
                                <button
                                    onClick={clearChat}
                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                    title="Clear Chat"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages and Input - Only show when not minimized */}
                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-3 ${message.type === 'user'
                                                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                                    : 'bg-gray-800 text-gray-100 border border-purple-500/20'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                <p className="text-xs opacity-70 mt-1">
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-800 border border-purple-500/20 rounded-2xl px-3 md:px-4 py-2 md:py-3">
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    </div>
                                                    <span className="text-sm text-gray-400">Jarvis is thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSubmit} className="p-3 md:p-4 border-t border-purple-500/20">
                                    <div className="flex space-x-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Ask Jarvis about movies, mood, or preferences..."
                                            className="flex-1 bg-gray-800 border border-purple-500/20 rounded-full px-3 md:px-4 py-2 md:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/40 transition-colors text-sm md:text-base"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputValue.trim() || isLoading}
                                            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full p-2 md:p-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 