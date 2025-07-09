import { StreamingServiceClient } from "./StreamingServiceClient"

interface StreamingServicePageProps {
    params: {
        service: string
    }
}

interface ServiceConfig {
    name: string
    logo: string
    color: string
    gradient: string
}

const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
    hbo: {
        name: "HBO",
        logo: "/images/HBO_logo.svg.png",
        color: "#8B5CF6",
        gradient: "from-purple-900 via-purple-800 to-black"
    },
    disney: {
        name: "Disney+",
        logo: "/images/Disney+_logo.svg",
        color: "#3B82F6",
        gradient: "from-blue-900 via-blue-800 to-black"
    },
    netflix: {
        name: "Netflix",
        logo: "/images/Logonetflix.png",
        color: "#DC2626",
        gradient: "from-red-900 via-red-800 to-black"
    },
    peacock: {
        name: "Peacock",
        logo: "/images/NBCUniversal_Peacock_Logo.svg.png",
        color: "#10B981",
        gradient: "from-emerald-900 via-emerald-800 to-black"
    },
    prime: {
        name: "Prime Video",
        logo: "/images/Prime_Video.png",
        color: "#06B6D4",
        gradient: "from-cyan-900 via-cyan-800 to-black"
    },
    hulu: {
        name: "Hulu",
        logo: "/images/Hulu-Logo.png",
        color: "#22C55E",
        gradient: "from-green-900 via-green-800 to-black"
    },
    paramount: {
        name: "Paramount+",
        logo: "/images/Paramount_Pictures_Corporation_logo.svg",
        color: "#6366F1",
        gradient: "from-indigo-900 via-indigo-800 to-black"
    },
    showtime: {
        name: "Showtime",
        logo: "/images/showtime.png",
        color: "#DC2626",
        gradient: "from-red-800 via-red-700 to-black"
    },
    fox: {
        name: "FOX",
        logo: "/images/FOX.svg",
        color: "#F59E0B",
        gradient: "from-yellow-800 via-yellow-700 to-black"
    },
    warner: {
        name: "Warner Bros",
        logo: "/images/Warner_Bros.png",
        color: "#6B7280",
        gradient: "from-gray-800 via-gray-700 to-black"
    },
    discovery: {
        name: "Discovery+",
        logo: "/images/discovery.png",
        color: "#06B6D4",
        gradient: "from-cyan-800 via-cyan-700 to-black"
    },
    appletv: {
        name: "Apple TV+",
        logo: "/images/Apple_TV_Plus_Logo.svg.png",
        color: "#6B7280",
        gradient: "from-gray-800 via-gray-700 to-black"
    }
}

export default function StreamingServicePage({ params }: StreamingServicePageProps) {
    const service = params.service
    const serviceConfig = SERVICE_CONFIGS[service]

    if (!serviceConfig) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
                    <p className="text-gray-400">The streaming service you're looking for doesn't exist.</p>
                </div>
            </div>
        )
    }

    return (
        <StreamingServiceClient service={service} serviceConfig={serviceConfig} />
    )
} 