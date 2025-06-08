import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ParticlesBackground } from "@/components/ParticlesBackground"
import { WatchLaterProvider } from "@/contexts/WatchLaterContext"

export const metadata: Metadata = {
  title: "SkyyPlay - Free Movies & TV Shows",
  description:
    "Click, watch, enjoy. SkyyPlay breaks down the paywall, ensuring that quality content is accessible to everyone.",
  keywords:
    "free movies, free streaming, watch movies online, free tv shows, streaming service, watch movies free, online streaming, SkyyPlay, free movies online, free series online",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/logo.png" />
        <meta name="theme-color" content="#A855F7" />
      </head>
      <body className="bg-black text-white min-h-screen">
        <WatchLaterProvider>
          <ParticlesBackground />
          {children}
        </WatchLaterProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
