"use client"

import { useEffect, useRef } from "react"
import type { Channel } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Clusterize from "clusterize.js"

interface ChannelListProps {
  channels: Channel[]
  searchTerm: string
  selectedGroup: string
}

export function ChannelList({ channels, searchTerm, selectedGroup }: ChannelListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const contentAreaRef = useRef<HTMLDivElement>(null)
  const clusterizeRef = useRef<Clusterize | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Clean up previous Clusterize instance
    if (clusterizeRef.current) {
      clusterizeRef.current.destroy(true)
      clusterizeRef.current = null
    }

    if (channels.length === 0) {
      return
    }

    // Generate HTML rows for each channel
    const rows = channels.map((channel, index) => {
      return `<div class="channel-item" data-index="${index}">
        ${generateChannelHTML(channel, index)}
      </div>`
    })

    // Initialize Clusterize
    if (scrollAreaRef.current && contentAreaRef.current) {
      clusterizeRef.current = new Clusterize({
        rows: rows,
        scrollId: scrollAreaRef.current.id,
        contentId: contentAreaRef.current.id,
        no_data_text: "No channels found matching your filters",
      })
    }

    // Add event listener for copy buttons
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains("copy-btn")) {
        const url = target.getAttribute("data-url")
        if (url) {
          navigator.clipboard
            .writeText(url)
            .then(() => {
              toast({
                title: "Copied!",
                description: "URL copied to clipboard",
              })
            })
            .catch(() => {
              toast({
                title: "Error",
                description: "Failed to copy URL",
                variant: "destructive",
              })
            })
        }
      }
    }

    document.addEventListener("click", handleClick)

    return () => {
      document.removeEventListener("click", handleClick)
      if (clusterizeRef.current) {
        clusterizeRef.current.destroy(true)
      }
    }
  }, [channels, toast])

  const generateChannelHTML = (channel: Channel, index: number) => {
    const imageElement = channel.tvgLogo
      ? `<img src="${channel.tvgLogo}" alt="${channel.tvgName}" class="w-full h-48 object-cover bg-gray-100" onerror="this.outerHTML='<div class=\\'w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 text-sm\\'>No image available</div>'">`
      : '<div class="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">No image available</div>'

    return `
      <div class="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 transition-all hover:-translate-y-1 hover:shadow-lg">
        ${imageElement}
        <div class="p-4">
          <div class="inline-block px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 mb-3">${channel.groupTitle}</div>
          <h3 class="text-base font-semibold text-gray-800 mb-2 line-clamp-2">${channel.title}</h3>
          <div class="bg-gray-50 p-2 rounded-lg text-xs text-gray-600 break-all">${channel.url}</div>
          <button class="copy-btn mt-3 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white px-3 py-1 rounded-md text-xs cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" data-url="${channel.url}">
            📋 Copy URL
          </button>
        </div>
      </div>
    `
  }

  if (!searchTerm && !selectedGroup) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
        Use the search or group filter to view channels
      </div>
    )
  }

  return (
    <div>
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
