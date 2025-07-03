"use client"

import { useEffect } from "react"

export default function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window === "undefined") return

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .catch((err) => {
                    console.error("ServiceWorker registration failed:", err)
                })
        }
    }, [])

    return null
} 