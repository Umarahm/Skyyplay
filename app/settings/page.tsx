"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { StreamingSource } from "@/lib/sources"
import { Navbar } from "@/components/Navbar"
import { availableSources } from "@/lib/sources"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("default-source")
  const [isLoading, setIsLoading] = useState(true)
  const [showParticles, setShowParticles] = useState(true)
  const [showUpdateNotice, setShowUpdateNotice] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [selectedSource, setSelectedSource] = useState("rive")

  useEffect(() => {
    // Initialize settings from localStorage
    const particles = localStorage.getItem("showParticles")
    const updateNotice = localStorage.getItem("showUpdateNotice")
    const language = localStorage.getItem("selectedLanguage")

    setShowParticles(particles === null ? true : particles !== "false")
    setShowUpdateNotice(updateNotice === null ? true : updateNotice !== "false")
    setSelectedLanguage(language || "en")

    // Ensure default source is set to rivestream
    if (!localStorage.getItem("defaultSource")) {
      localStorage.setItem("defaultSource", "rive")
    }

    // Sync selected source from storage
    setSelectedSource(localStorage.getItem("defaultSource") || "rive")

    // Hide loading after a short delay
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  const toggleParticles = () => {
    const newValue = !showParticles
    setShowParticles(newValue)
    localStorage.setItem("showParticles", newValue.toString())
    window.dispatchEvent(new Event("appearance-changed"))
  }

  const toggleUpdateNotice = () => {
    const newValue = !showUpdateNotice
    setShowUpdateNotice(newValue)
    localStorage.setItem("showUpdateNotice", newValue.toString())
    window.dispatchEvent(new Event("appearance-changed"))
  }

  const changeLanguage = (newLanguage: string) => {
    setSelectedLanguage(newLanguage)
    localStorage.setItem("selectedLanguage", newLanguage)
    window.dispatchEvent(new Event("language-changed"))
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center backdrop-blur-sm">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <img src="/logo.avif" alt="SkyyPlay Logo" className="w-24 h-24 loading-logo" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 logo-text">Loading Settings</h2>
          <p className="text-gray-400">Please wait while we prepare your settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar showSearch={false} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 logo-text">Settings</h1>
            <p className="text-gray-400 text-base md:text-lg">Customize your SkyyPlay experience</p>
          </div>

          {/* Notice Banner */}
          <div className="notice-banner p-4 md:p-6 rounded-xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-500/10 px-4 py-1 rounded-bl-lg text-purple-400 text-xs font-medium">
              WIP
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Settings Under Development</h3>
                <p className="text-purple-100">
                  We're continuously improving SkyyPlay. More customization options coming soon!
                </p>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-8">
            {/* Default Source Section */}
            <div className="animate-fade-in-up">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold mb-2 logo-text">Default Source</h2>
                <p className="text-gray-400">
                  Choose your preferred default source for streaming content. This setting will be remembered across
                  sessions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSources.map((source, index) => (
                  <SourceOption
                    key={source.id}
                    source={source}
                    index={index}
                    selectedSource={selectedSource}
                    onSelect={(id: string) => {
                      setSelectedSource(id)
                      localStorage.setItem("defaultSource", id)
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Appearance Section */}
            <div className="animate-fade-in-up space-y-6 md:space-y-8">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold mb-2 logo-text">Appearance</h2>
                <p className="text-gray-400">Customize SkyyPlay's look and feel</p>
              </div>

              <div className="space-y-4 md:space-y-6">
                {/* Background Particles Toggle */}
                <div className="settings-section rounded-lg p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="space-y-1">
                      <h3 className="font-medium text-lg">Background Particles</h3>
                      <p className="text-sm text-gray-400">Toggle the animated particle effect in the background</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={showParticles} onChange={toggleParticles} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Content Language Dropdown */}
                <div className="settings-section rounded-lg p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="space-y-1">
                      <h3 className="font-medium text-lg">Content Language</h3>
                      <p className="text-sm text-gray-400">Select the language for content information</p>
                    </div>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => changeLanguage(e.target.value)}
                      className="rounded-lg px-4 py-2 pr-8 appearance-none transition-all duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none min-w-[150px] bg-gray-800 text-white border border-purple-500/20"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="hi">Hindi</option>
                      <option value="ur">Urdu</option>
                    </select>
                  </div>
                </div>

                {/* Update Notices Toggle */}
                <div className="settings-section rounded-lg p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="space-y-1">
                      <h3 className="font-medium text-lg">Update Notices</h3>
                      <p className="text-sm text-gray-400">Show notifications about new features and updates</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={showUpdateNotice} onChange={toggleUpdateNotice} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full p-4 shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 z-50 floating-button"
        aria-label="Scroll to top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  )
}

interface SourceOptionProps {
  source: StreamingSource
  index: number
  selectedSource: string
  onSelect: (id: string) => void
}

const SourceOption: React.FC<SourceOptionProps> = ({ source, index, selectedSource, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(source.id)}
      className={`source-option rounded-lg p-4 cursor-pointer stagger-animation ${selectedSource === source.id ? "selected" : ""}`}
      style={{ "--stagger": index } as React.CSSProperties}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-white">{source.name}</div>
          <div className="text-sm text-gray-400">{source.isFrench ? "French Content" : "English Content"}</div>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedSource === source.id ? "border-purple-500 bg-purple-500" : "border-gray-600"}`}
        >
          {selectedSource === source.id && <div className="w-3 h-3 rounded-full bg-white"></div>}
        </div>
      </div>
    </div>
  )
}
