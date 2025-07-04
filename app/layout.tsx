import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type React from "react"
import type { Metadata } from "next"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar"
import "./globals.css"

export const metadata: Metadata = {
  title: "SkyyPlay - Free Movies & TV Shows",
  description:
    "Click, watch, enjoy. SkyyPlay breaks down the paywall, ensuring that quality content is accessible to everyone.",
  keywords:
    "free movies, free streaming, watch movies online, free tv shows, streaming service, watch movies free, online streaming, SkyyPlay, free movies online, free series online",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SkyyPlay'
  },
  openGraph: {
    type: 'website',
    siteName: 'SkyyPlay',
    title: 'SkyyPlay - Free Movies & TV Shows',
    description: 'Click, watch, enjoy. SkyyPlay breaks down the paywall, ensuring that quality content is accessible to everyone.',
    images: ['/placeholder-logo.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkyyPlay - Free Movies & TV Shows',
    description: 'Click, watch, enjoy. SkyyPlay breaks down the paywall, ensuring that quality content is accessible to everyone.',
    images: ['/placeholder-logo.png']
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/avif" href="/logo.avif" />
        {/* Preload critical logo for faster LCP fallback */}
        <link rel="preload" href="/logo.avif" as="image" type="image/avif" />
        {/* Preconnect to TMDB image CDN to improve LCP */}
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <meta name="theme-color" content="#A855F7" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SkyyPlay" />
        <link rel="apple-touch-icon" href="/logo.avif" />
      </head>
      <body className="bg-black text-white min-h-screen">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <ServiceWorkerRegistrar />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
