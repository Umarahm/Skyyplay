"use client"

import { useRef } from "react"

interface StreamingService {
    id: string
    name: string
    logo: string
    bgColor: string
}

const STREAMING_SERVICES: StreamingService[] = [
    {
        id: "hbo",
        name: "HBO",
        logo: "/images/HBO_logo.svg.png",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "disney",
        name: "Disney+",
        logo: "/images/Disney+_logo.svg",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "netflix",
        name: "Netflix",
        logo: "/images/Logonetflix.png",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "peacock",
        name: "Peacock",
        logo: "/images/NBCUniversal_Peacock_Logo.svg.png",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "prime",
        name: "Prime Video",
        logo: "/images/Prime_Video.png",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "hulu",
        name: "Hulu",
        logo: "/images/Hulu-Logo.png",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "paramount",
        name: "Paramount+",
        logo: "/images/Paramount_Pictures_Corporation_logo.svg",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "showtime",
        name: "Showtime",
        logo: "/images/showtime.png",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "fox",
        name: "FOX",
        logo: "/images/FOX.svg",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "warner",
        name: "Warner Bros",
        logo: "/images/Warner_Bros.png",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "discovery",
        name: "Discovery+",
        logo: "/images/discovery.png",
        bgColor: "from-gray-800 to-gray-700"
    },
    {
        id: "appletv",
        name: "Apple TV+",
        logo: "/images/Apple_TV_Plus_Logo.svg.png",
        bgColor: "from-gray-800 to-gray-700"
    }
]

interface StreamingServiceHubProps {
    currentTab: "movies" | "shows"
    visibleSections: Set<string> // Keep for compatibility but not used
    observeSection: (element: HTMLElement | null, sectionId: string) => void // Keep for compatibility but not used
    scrollSection: (containerId: string, direction: "left" | "right") => void
}

export function StreamingServiceHub({
    currentTab,
    visibleSections,
    observeSection,
    scrollSection
}: StreamingServiceHubProps) {

    return (
        <div className="category-section container mx-auto mb-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
                <h2 className="text-xl font-bold brand-text">Studios</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => scrollSection("streaming-hub-container", "left")}
                        className="bg-black/50 hover:bg-black/75 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
                        aria-label="Scroll left"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scrollSection("streaming-hub-container", "right")}
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
                {/* Scrollable Container */}
                <div
                    id="streaming-hub-container"
                    className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6"
                    style={{
                        scrollBehavior: 'smooth',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {STREAMING_SERVICES.map((service, index) => {
                        const glareRef = useRef<HTMLDivElement | null>(null);

                        const animateGlareIn = () => {
                            const el = glareRef.current;
                            if (!el) return;

                            el.style.transition = "none";
                            el.style.backgroundPosition = "-100% -100%, 0 0";
                            el.offsetHeight;
                            el.style.transition = "800ms ease";
                            el.style.backgroundPosition = "100% 100%, 0 0";
                        };

                        const animateGlareOut = () => {
                            const el = glareRef.current;
                            if (!el) return;
                            el.style.transition = "800ms ease";
                            el.style.backgroundPosition = "-100% -100%, 0 0";
                        };

                        return (
                            <div
                                key={service.id}
                                className={`relative flex-shrink-0 animate-fade-in-up stagger-animation`}
                                style={{ "--stagger": index } as React.CSSProperties}
                            >
                                <div
                                    className={`
                                        relative bg-gradient-to-br ${service.bgColor} 
                                        rounded-2xl p-6 md:p-8 w-48 h-28 md:w-52 md:h-32
                                        flex items-center justify-center
                                        border border-white/10
                                        cursor-pointer
                                        overflow-hidden
                                    `}
                                    onMouseEnter={animateGlareIn}
                                    onMouseLeave={animateGlareOut}
                                    onClick={() => window.location.href = `/streaming/${service.id}`}
                                >
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-10">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-black/20 rounded-tl-full" />
                                    </div>

                                    {/* Glare Effect */}
                                    <div
                                        ref={glareRef}
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: `linear-gradient(-30deg,
                                                hsla(0,0%,0%,0) 60%,
                                                rgba(255, 255, 255, 0.3) 70%,
                                                hsla(0,0%,0%,0) 100%)`,
                                            backgroundSize: "300% 300%, 100% 100%",
                                            backgroundRepeat: "no-repeat",
                                            backgroundPosition: "-100% -100%, 0 0"
                                        }}
                                    />

                                    {/* Logo */}
                                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                                        <img
                                            src={service.logo}
                                            alt={service.name}
                                            className="max-w-full max-h-full object-contain brightness-0 invert"
                                            style={{
                                                maxHeight: '55px',
                                                maxWidth: '85%'
                                            }}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = "/placeholder-logo.svg"
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Service Name - Hidden on mobile, visible on larger screens */}
                                <p className="hidden sm:block text-center text-xs md:text-sm text-gray-400 mt-2">
                                    {service.name}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
} 