import { NextRequest } from "next/server"

// Proxies poster images from streamed.pk so that the frontend can load them from the same origin.
// URL format expected by the client: /api/images/proxy/<poster>.webp
// Using a catch-all route [...poster] to handle filenames with extensions correctly.
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ poster: string[] }> }
) {
    const { poster } = await params
    const posterPath = poster?.join("/")
    if (!posterPath) {
        return new Response("Missing poster parameter", { status: 400 })
    }

    const remoteUrl = `https://streamed.pk/api/images/proxy/${posterPath}`

    try {
        const upstreamResponse = await fetch(remoteUrl)

        if (!upstreamResponse.ok || !upstreamResponse.body) {
            console.error(`Upstream image fetch failed for ${remoteUrl} with status ${upstreamResponse.status}`)
            return new Response("Unable to fetch image", {
                status: upstreamResponse.status,
            })
        }

        // Clone headers and set caching headers for better performance
        const headers = new Headers(upstreamResponse.headers)
        headers.set(
            "Cache-Control",
            "public, max-age=86400, stale-while-revalidate=43200"
        )

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers,
        })
    } catch (err) {
        console.error("Image proxy error", err)
        return new Response("Internal Server Error", { status: 500 })
    }
} 