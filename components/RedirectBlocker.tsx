"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export function RedirectBlocker() {
    const { toast } = useToast()

    useEffect(() => {
        const handleLinkClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const anchor = target.closest("a")

            if (anchor && anchor.href) {
                try {
                    const url = new URL(anchor.href)
                    const currentHost = window.location.hostname

                    // Allow if it's the same host, or if it's a relative path (which URL constructor handles if base is provided, but here anchor.href is usually absolute)
                    // Check if the hostname includes 'skyyplay' or is 'localhost'
                    const isAllowed =
                        url.hostname === currentHost ||
                        url.hostname.includes("skyyplay") ||
                        url.hostname === "localhost" ||
                        url.hostname === "127.0.0.1"

                    if (!isAllowed) {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log("Blocked redirection to:", anchor.href)

                        toast({
                            variant: "destructive",
                            title: "Redirect Blocked",
                            description: "External redirections are not allowed.",
                            duration: 3000,
                        })
                    }
                } catch (error) {
                    // If URL parsing fails, it might be a relative link or javascript:void(0), which is fine
                }
            }
        }

        const handleFormSubmit = (e: SubmitEvent) => {
            const target = e.target as HTMLFormElement
            const action = target.action

            if (action) {
                try {
                    const url = new URL(action)
                    const currentHost = window.location.hostname
                    const isAllowed =
                        url.hostname === currentHost ||
                        url.hostname.includes("skyyplay") ||
                        url.hostname === "localhost" ||
                        url.hostname === "127.0.0.1"

                    if (!isAllowed) {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log("Blocked form submission to:", action)
                        toast({
                            variant: "destructive",
                            title: "Redirect Blocked",
                            description: "External form submissions are not allowed.",
                            duration: 3000,
                        })
                    }
                } catch (error) {
                    // ignore
                }
            }
        }

        // Monkey patch window.open
        const originalOpen = window.open
        window.open = function (url?: string | URL, target?: string, features?: string) {
            if (url) {
                try {
                    const urlStr = url.toString()
                    // Check if relative URL (doesn't start with http/https/ftp)
                    const isRelative = !/^https?:\/\//i.test(urlStr)

                    if (isRelative) {
                        return originalOpen.apply(window, [url, target, features])
                    }

                    const urlObj = new URL(urlStr, window.location.origin)
                    const currentHost = window.location.hostname
                    const isAllowed =
                        urlObj.hostname === currentHost ||
                        urlObj.hostname.includes("skyyplay") ||
                        urlObj.hostname === "localhost" ||
                        urlObj.hostname === "127.0.0.1"

                    if (!isAllowed) {
                        console.log("Blocked window.open to:", urlStr)
                        toast({
                            variant: "destructive",
                            title: "Redirect Blocked",
                            description: "External popups are not allowed.",
                            duration: 3000,
                        })
                        return null
                    }
                } catch (e) {
                    // invalid url, block to be safe if it looks external?
                }
            }
            return originalOpen.apply(window, [url, target, features])
        }

        // Monkey patch HTMLFormElement.prototype.submit
        const originalSubmit = HTMLFormElement.prototype.submit
        HTMLFormElement.prototype.submit = function () {
            const action = this.action
            if (action) {
                try {
                    const url = new URL(action)
                    const currentHost = window.location.hostname
                    const isAllowed =
                        url.hostname === currentHost ||
                        url.hostname.includes("skyyplay") ||
                        url.hostname === "localhost" ||
                        url.hostname === "127.0.0.1"

                    if (!isAllowed) {
                        console.log("Blocked programmatic form submission to:", action)
                        toast({
                            variant: "destructive",
                            title: "Redirect Blocked",
                            description: "External form submissions are not allowed.",
                            duration: 3000,
                        })
                        return
                    }
                } catch (error) {
                    // ignore
                }
            }
            return originalSubmit.apply(this)
        }

        document.addEventListener("click", handleLinkClick, true) // Use capture phase
        document.addEventListener("submit", handleFormSubmit, true) // Use capture phase

        return () => {
            document.removeEventListener("click", handleLinkClick, true)
            document.removeEventListener("submit", handleFormSubmit, true)
            window.open = originalOpen
            HTMLFormElement.prototype.submit = originalSubmit
        }
    }, [toast])

    return null
}

