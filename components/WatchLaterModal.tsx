"use client"

import { useState } from "react"
import { useWatchLater } from "@/contexts/WatchLaterContext"
import { ContentCard } from "./ContentCard"

interface WatchLaterModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WatchLaterModal({ isOpen, onClose }: WatchLaterModalProps) {
  const { watchLaterItems, clearWatchLater } = useWatchLater()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  if (!isOpen) return null

  const handleClearAll = () => {
    clearWatchLater()
    setShowClearConfirm(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-90 flex items-start justify-center">
        <div className="bg-gray-900 rounded-lg w-full max-w-4xl mt-20 modal-animation border border-purple-500/20">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Watch Later</h2>
              <div className="flex items-center space-x-4">
                {watchLaterItems.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-gray-400 hover:text-red-500 flex items-center space-x-2 transition-colors duration-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Clear All</span>
                  </button>
                )}
                <button onClick={onClose} className="text-gray-500 hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            {watchLaterItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No items in your watch later list</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {watchLaterItems.map((item) => (
                  <ContentCard key={item.id} item={item} type={item.type} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] overflow-auto bg-black bg-opacity-90 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-full max-w-md p-6 modal-animation border border-purple-500/20">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Clear Watch Later</h3>
              <p className="text-gray-400 mb-6">Are you sure you want to clear all items from your watch later list?</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
