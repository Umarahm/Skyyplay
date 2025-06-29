"use client"

import React, { Component, type ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        // You can log the error to an error reporting service here
        // logErrorToService(error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return this.props.fallback || <ErrorFallback error={this.state.error} />
        }

        return this.props.children
    }
}

interface ErrorFallbackProps {
    error?: Error
}

function ErrorFallback({ error }: ErrorFallbackProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center p-8 max-w-md">
                <div className="mb-6">
                    <svg
                        className="w-16 h-16 mx-auto text-red-500 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                    <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
                    <p className="text-gray-400 mb-6">
                        We encountered an unexpected error. Don't worry, our team has been notified.
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary px-6 py-3 rounded-lg font-medium w-full"
                    >
                        Refresh Page
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn-secondary px-6 py-3 rounded-lg font-medium w-full"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    )
} 