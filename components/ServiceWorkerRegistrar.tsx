"use client"

import { useEffect, useState } from "react"

// Extend Window interface to include workbox
declare global {
    interface Window {
        workbox: any;
    }
}

export default function ServiceWorkerRegistrar() {
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            window.workbox !== undefined
        ) {
            const wb = window.workbox

            // Listen for waiting service worker
            const showSkipWaitingPrompt = () => {
                setUpdateAvailable(true)
            }

            // Add event listener for the custom prompt to show when SW is waiting
            wb.addEventListener("waiting", showSkipWaitingPrompt)

            // Add event listener for when the service worker takes control
            wb.addEventListener("controlling", () => {
                window.location.reload()
            })

            // Register the service worker
            wb.register()

            // Get the service worker registration
            navigator.serviceWorker.ready.then((reg) => {
                setRegistration(reg)
            })

            return () => {
                wb.removeEventListener("waiting", showSkipWaitingPrompt)
            }
        }
    }, [])

    const handleUpdate = () => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" })
            setUpdateAvailable(false)
        }
    }

    // Show update notification UI
    if (updateAvailable) {
        return (
            <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
                <p className="mb-2 text-sm">🎉 A new version of SkyPlay is available!</p>
                <div className="flex gap-2">
                    <button
                        onClick={handleUpdate}
                        className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                        Update Now
                    </button>
                    <button
                        onClick={() => setUpdateAvailable(false)}
                        className="bg-transparent border border-white text-white px-3 py-1 rounded text-sm hover:bg-white hover:text-blue-600 transition-colors"
                    >
                        Later
                    </button>
                </div>
            </div>
        )
    }

    return null
} 