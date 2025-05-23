"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Channel } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useFavorites } from "@/contexts/favorites-context"
import { VideoPlayerModal } from "@/components/ui/VideoPlayerModal"

// @ts-ignore: No types for clusterize.js
import("clusterize.js")

interface ChannelListProps {
  channels: Channel[]
  searchTerm: string
  selectedGroup: string
}

export function ChannelList({ channels, searchTerm, selectedGroup }: ChannelListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const contentAreaRef = useRef<HTMLDivElement>(null)
  const clusterizeRef = useRef<any>(null)
  const { toast } = useToast()
  const { toggleFavorite, isFavorite, favorites } = useFavorites()
  const [isMounted, setIsMounted] = useState(false)
  const [isClusterizeLoaded, setIsClusterizeLoaded] = useState(false)
  const [Clusterize, setClusterize] = useState<any>(null)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  // Set mounted state after component mounts and load Clusterize
  useEffect(() => {
    setIsMounted(true)

    // Dynamically import Clusterize.js
    import("clusterize.js")
      .then((module) => {
        setClusterize(() => module.default)
        setIsClusterizeLoaded(true)
      })
      .catch((error) => {
        console.error("Failed to load Clusterize.js:", error)
      })

    return () => {
      if (clusterizeRef.current) {
        try {
          clusterizeRef.current.destroy(true)
        } catch (e) {
          console.error("Error destroying Clusterize instance:", e)
        }
      }
    }
  }, [])

  // Force update when favorites change
  useEffect(() => {
    if (clusterizeRef.current) {
      setForceUpdate((prev) => prev + 1)
    }
  }, [favorites])

  const generateChannelHTML = useCallback(
    (channel: Channel, index: number) => {
      // Add comprehensive validation
      if (!channel || typeof channel !== "object") {
        console.warn("Invalid channel object:", channel)
        return ""
      }

      // Ensure all required properties exist with fallbacks
      const safeChannel = {
        title: channel.title || "Unknown Channel",
        tvgLogo: channel.tvgLogo || "",
        tvgName: channel.tvgName || "",
        groupTitle: channel.groupTitle || "No Group",
        url: channel.url || "",
      }

      const imageElement = safeChannel.tvgLogo
        ? `<img src="${safeChannel.tvgLogo}" alt="${safeChannel.tvgName}" class="w-full h-48 object-cover bg-gray-100" onerror="this.outerHTML='<div class=\\'w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 text-sm\\'>No image available</div>'">`
        : '<div class="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">No image available</div>'

      let isChannelFavorite = false
      try {
        isChannelFavorite = isFavorite(channel)
      } catch (error) {
        console.warn("Error checking favorite status:", error)
      }

      const heartClass = isChannelFavorite ? "text-red-500 fill-current" : "text-gray-400"

      // Enhanced HTML escaping function
      const escapeHtml = (text: string | undefined | null) => {
        if (text === undefined || text === null || typeof text !== "string") {
          return ""
        }
        try {
          const div = document.createElement("div")
          div.textContent = text
          return div.innerHTML
        } catch (error) {
          console.warn("Error escaping HTML:", error)
          return String(text).replace(/[&<>"']/g, (match) => {
            const escapeMap: { [key: string]: string } = {
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            }
            return escapeMap[match] || match
          })
        }
      }

      const safeTitle = escapeHtml(safeChannel.title)
      const safeGroupTitle = escapeHtml(safeChannel.groupTitle)
      const safeUrl = escapeHtml(safeChannel.url)

      // Ensure index is a valid number
      const safeIndex = typeof index === "number" && !isNaN(index) ? index : 0

      return `
      <div class="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 transition-all hover:-translate-y-1 hover:shadow-lg">
        ${imageElement}
        <div class="p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="inline-block px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800">${safeGroupTitle}</div>
            <button class="favorite-btn p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer" data-index="${safeIndex}" type="button">
              <svg class="heart-icon h-4 w-4 ${heartClass}" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>
          <h3 class="text-base font-semibold text-gray-800 mb-2 line-clamp-2">${safeTitle}</h3>
          <div class="bg-gray-50 p-2 rounded-lg text-xs text-gray-600 break-all">${safeUrl}</div>
          <button class="copy-btn mt-3 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white px-3 py-1 rounded-md text-xs cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" data-url="${safeChannel.url}" type="button">
            📋 Copy URL
          </button>
          <button class="play-btn mt-3 ml-2 bg-gradient-to-r from-green-600 to-green-800 text-white px-3 py-1 rounded-md text-xs cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" data-url="${safeChannel.url}" type="button">
            ▶️ Play
          </button>
        </div>
      </div>
    `
    },
    [isFavorite],
  )

  useEffect(() => {
    // Only run this effect on the client side after mounting and Clusterize is loaded
    if (!isMounted || !isClusterizeLoaded || !Clusterize) return

    // Clean up previous Clusterize instance
    if (clusterizeRef.current) {
      try {
        clusterizeRef.current.destroy(true)
        clusterizeRef.current = null
      } catch (e) {
        console.error("Error destroying Clusterize instance:", e)
      }
    }

    // Validate channels array
    if (!Array.isArray(channels) || channels.length === 0 || !scrollAreaRef.current || !contentAreaRef.current) {
      return
    }

    // Filter out any invalid channels and generate HTML rows
    const validChannels = channels.filter(
      (channel) =>
        channel && typeof channel === "object" && typeof channel.title === "string" && typeof channel.url === "string",
    )

    if (validChannels.length === 0) {
      console.warn("No valid channels found after filtering")
      return
    }

    try {
      // Generate HTML rows for each valid channel
      const rows = validChannels.map((channel, index) => {
        try {
          const html = generateChannelHTML(channel, index)
          if (!html || typeof html !== "string") {
            console.warn("Invalid HTML generated for channel:", channel.title)
            return `<div class="channel-item" data-index="${index}">Error loading channel</div>`
          }
          return `<div class="channel-item" data-index="${index}">${html}</div>`
        } catch (error) {
          console.error("Error generating HTML for channel:", channel.title, error)
          return `<div class="channel-item" data-index="${index}">Error loading channel</div>`
        }
      })

      // Filter out any empty or invalid rows
      const validRows = rows.filter((row) => row && typeof row === "string" && row.trim().length > 0)

      if (validRows.length === 0) {
        console.warn("No valid rows generated")
        return
      }

      // Make sure the DOM elements have IDs
      if (!scrollAreaRef.current.id) scrollAreaRef.current.id = "scrollArea"
      if (!contentAreaRef.current.id) contentAreaRef.current.id = "contentArea"

      // Initialize Clusterize with error handling
      clusterizeRef.current = new Clusterize({
        rows: validRows,
        scrollId: scrollAreaRef.current.id,
        contentId: contentAreaRef.current.id,
        no_data_text: "No channels found matching your filters",
        rows_in_block: 50,
        blocks_in_cluster: 4,
        show_no_data_row: true,
      })
    } catch (error) {
      console.error("Failed to initialize Clusterize:", error)
      // Fallback: show error message
      if (contentAreaRef.current) {
        contentAreaRef.current.innerHTML =
          '<div class="text-center text-red-500 p-4">Error loading channels. Please try refreshing.</div>'
      }
    }

    // Add event listener for copy and favorite buttons
    const handleClick = async (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement

        // Handle copy button clicks
        if (target.classList.contains("copy-btn") || target.closest(".copy-btn")) {
          const copyBtn = target.classList.contains("copy-btn") ? target : target.closest(".copy-btn")
          const url = copyBtn?.getAttribute("data-url")
          if (url && typeof url === "string") {
            try {
              await navigator.clipboard.writeText(url)
              toast({
                title: "Copied!",
                description: "URL copied to clipboard",
              })
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to copy URL",
                variant: "destructive",
              })
            }
          }
          return
        }

        // Handle favorite button clicks
        if (target.classList.contains("favorite-btn") || target.closest(".favorite-btn")) {
          e.preventDefault()
          e.stopPropagation()

          const favoriteBtn = target.classList.contains("favorite-btn") ? target : target.closest(".favorite-btn")
          const channelIndexStr = favoriteBtn?.getAttribute("data-index")

          if (!channelIndexStr) {
            console.error("No channel index found")
            return
          }

          const channelIndex = Number.parseInt(channelIndexStr, 10)

          if (isNaN(channelIndex) || channelIndex < 0 || channelIndex >= validChannels.length) {
            console.error("Invalid channel index:", channelIndex)
            return
          }

          const channel = validChannels[channelIndex]

          if (channel && typeof channel === "object") {
            try {
              const isNowFavorite = await toggleFavorite(channel)

              toast({
                title: isNowFavorite ? "Added to favorites" : "Removed from favorites",
                description: channel.title || "Unknown channel",
              })

              // Update the button appearance immediately
              const heartIcon = favoriteBtn?.querySelector(".heart-icon")
              if (heartIcon) {
                if (isNowFavorite) {
                  heartIcon.classList.add("text-red-500", "fill-current")
                  heartIcon.classList.remove("text-gray-400")
                } else {
                  heartIcon.classList.remove("text-red-500", "fill-current")
                  heartIcon.classList.add("text-gray-400")
                }
              }
            } catch (error) {
              console.error("Error toggling favorite:", error)
              toast({
                title: "Error",
                description: "Failed to update favorites",
                variant: "destructive",
              })
            }
          }
        }

        // Handle play button clicks
        if (target.classList.contains("play-btn") || target.closest(".play-btn")) {
          const playBtn = target.classList.contains("play-btn") ? target : target.closest(".play-btn")
          const url = playBtn?.getAttribute("data-url")
          if (url && typeof url === "string") {
            setVideoSrc(url)
            setVideoModalOpen(true)
          }
          return
        }
      } catch (error) {
        console.error("Error in click handler:", error)
      }
    }

    // Use event delegation on the scroll area
    const scrollArea = scrollAreaRef.current
    if (scrollArea) {
      scrollArea.addEventListener("click", handleClick)
    }

    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener("click", handleClick)
      }
      if (clusterizeRef.current) {
        try {
          clusterizeRef.current.destroy(true)
        } catch (e) {
          console.error("Error destroying Clusterize instance:", e)
        }
      }
    }
  }, [channels, toast, isMounted, isClusterizeLoaded, Clusterize, toggleFavorite, generateChannelHTML, forceUpdate])

  // Show a message when no filters are applied
  if (!searchTerm && !selectedGroup) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
        Use the search or group filter to view channels
      </div>
    )
  }

  // Show loading state while Clusterize is loading
  if (!isMounted || !isClusterizeLoaded) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  // Show a message when no channels match the filters
  if (!Array.isArray(channels) || channels.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">No channels found matching your filters</div>
    )
  }

  return (
    <div>
      <VideoPlayerModal open={videoModalOpen} onClose={() => { setVideoModalOpen(false); setVideoSrc(null) }} src={videoSrc} />
      <div id="scrollArea" ref={scrollAreaRef} className="h-[600px] overflow-auto">
        <div
          id="contentArea"
          ref={contentAreaRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        ></div>
      </div>
    </div>
  )
}
