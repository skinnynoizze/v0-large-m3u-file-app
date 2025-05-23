"use client"

import { useState, useEffect } from "react"
import { FileUploader } from "./file-uploader"
import { StatsDisplay } from "./stats-display"
import { FilterControls } from "./filter-controls"
import { ChannelList } from "./channel-list"
import { CacheInfo } from "./cache-info"
import { FavoritesPanel } from "./favorites-panel"
import { parseM3U } from "@/lib/m3u-parser"
import type { Channel, ChannelGroup } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/hooks/use-settings"
import { useFavorites } from "@/contexts/favorites-context"
import { saveChannelsToCache, getChannelsFromCache } from "@/lib/indexed-db"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { M3uUrlForm } from "./m3u-url-form"

export default function IPTVManager() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [groups, setGroups] = useState<ChannelGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCache, setIsLoadingCache] = useState(true)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const { toast } = useToast()

  // Get favorites from the context
  const { favorites, isLoading: favoritesLoading } = useFavorites()

  const { settings, isLoaded, updateM3uUrl, updateSearchTerm, updateSelectedGroup } = useSettings()

  // Debug logging for favorites
  useEffect(() => {
    console.log("IPTV Manager - Favorites updated:", {
      count: favorites?.length || 0,
      isLoading: favoritesLoading,
      favorites: favorites,
    })
  }, [favorites, favoritesLoading])

  // Load channels from cache on initial load
  useEffect(() => {
    async function loadFromCache() {
      setIsLoadingCache(true)
      try {
        const cachedData = await getChannelsFromCache()
        if (cachedData && Array.isArray(cachedData.channels)) {
          setChannels(cachedData.channels)
          toast({
            title: "Loaded from cache",
            description: `Loaded ${cachedData.channels.length} channels from browser storage`,
          })
        }
      } catch (error) {
        console.error("Failed to load from cache:", error)
      } finally {
        setIsLoadingCache(false)
      }
    }

    if (isLoaded) {
      loadFromCache()
    }
  }, [isLoaded, toast])

  useEffect(() => {
    if (Array.isArray(channels) && channels.length > 0) {
      try {
        // Extract unique groups and sort them alphabetically
        const groupTitles = channels
          .map((channel) => channel?.groupTitle || "No Group")
          .filter((title) => typeof title === "string")

        const uniqueGroupTitles = Array.from(new Set(groupTitles)).sort((a, b) => a.localeCompare(b))

        const uniqueGroups = uniqueGroupTitles.map((groupTitle) => ({
          title: groupTitle,
          count: channels.filter((channel) => (channel?.groupTitle || "No Group") === groupTitle).length,
        }))

        setGroups(uniqueGroups)
      } catch (error) {
        console.error("Error processing channel groups:", error)
        setGroups([])
      }
    } else {
      setGroups([])
    }
  }, [channels])

  useEffect(() => {
    applyFilters()
  }, [settings?.searchTerm, settings?.selectedGroup, channels])

  const applyFilters = () => {
    if (!settings?.searchTerm && !settings?.selectedGroup) {
      setFilteredChannels([])
      return
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      setFilteredChannels([])
      return
    }

    try {
      let filtered = [...channels]

      if (settings?.searchTerm) {
        const term = settings.searchTerm.toLowerCase()
        filtered = filtered.filter((channel) => {
          if (!channel) return false
          const title = channel.title?.toLowerCase() || ""
          const name = channel.tvgName?.toLowerCase() || ""
          return title.includes(term) || name.includes(term)
        })
      }

      if (settings?.selectedGroup) {
        filtered = filtered.filter(
          (channel) => channel && (channel.groupTitle || "No Group") === settings.selectedGroup,
        )
      }

      setFilteredChannels(filtered)
    } catch (error) {
      console.error("Error applying filters:", error)
      setFilteredChannels([])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) {
      toast({
        title: "Error",
        description: "No file selected",
        variant: "destructive",
      })
      return
    }

    if (!file.name.toLowerCase().endsWith(".m3u") && !file.name.toLowerCase().endsWith(".m3u8")) {
      toast({
        title: "Error",
        description: "Please select a valid M3U file",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setCurrentFile(file)

    try {
      let content
      try {
        content = await file.text()
      } catch (error) {
        console.error("Error reading file:", error)
        throw new Error("Failed to read file content")
      }

      if (content === undefined || content === null) {
        throw new Error("File content is null or undefined")
      }

      if (typeof content !== "string") {
        throw new Error(`Invalid file content type: ${typeof content}`)
      }

      if (content.trim() === "") {
        throw new Error("File is empty")
      }

      console.log("File content loaded, length:", content.length)
      const parsedChannels = parseM3U(content)

      if (!Array.isArray(parsedChannels) || parsedChannels.length === 0) {
        toast({
          title: "Warning",
          description: `No channels found in the file. Please check the file format.`,
          variant: "destructive",
        })
      } else {
        setChannels(parsedChannels)

        // Save to cache
        await saveChannelsToCache(parsedChannels, "file", file.name)

        toast({
          title: "Success",
          description: `File "${file.name}" loaded successfully with ${parsedChannels.length} channels`,
        })
      }
    } catch (error) {
      console.error("File upload error:", error)
      toast({
        title: "Error",
        description: `Failed to process the file: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async (url: string) => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a valid M3U URL",
        variant: "destructive",
      })
      return
    }

    if (typeof url !== "string") {
      toast({
        title: "Error",
        description: "URL must be a string",
        variant: "destructive",
      })
      return
    }

    const trimmedUrl = url.trim()
    if (trimmedUrl === "") {
      toast({
        title: "Error",
        description: "URL cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    updateM3uUrl(trimmedUrl)

    try {
      console.log("Fetching M3U data from API for URL:", trimmedUrl)
      const response = await fetch("/api/refresh-m3u", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: trimmedUrl }),
      })

      if (!response.ok) {
        let errorMessage = `Failed to fetch M3U data: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData?.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // Ignore JSON parsing error
        }
        throw new Error(errorMessage)
      }

      let content
      try {
        content = await response.text()
      } catch (error) {
        console.error("Error reading response text:", error)
        throw new Error("Failed to read response content")
      }

      if (content === undefined || content === null) {
        throw new Error("Received null or undefined content from the server")
      }

      if (typeof content !== "string") {
        throw new Error(`Received invalid content type from the server: ${typeof content}`)
      }

      if (content.trim() === "") {
        throw new Error("Received empty content from the server")
      }

      console.log("M3U content received from API, length:", content.length)
      const parsedChannels = parseM3U(content)

      if (!Array.isArray(parsedChannels) || parsedChannels.length === 0) {
        toast({
          title: "Warning",
          description: "No channels found in the response. Please check the URL.",
          variant: "destructive",
        })
      } else {
        setChannels(parsedChannels)

        // Save to cache
        await saveChannelsToCache(parsedChannels, "url", trimmedUrl)

        toast({
          title: "Success",
          description: `Data updated successfully with ${parsedChannels.length} channels`,
        })
      }
    } catch (error) {
      console.error("Refresh data error:", error)
      toast({
        title: "Error",
        description: `Failed to refresh data: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    updateSearchTerm("")
    updateSelectedGroup("")
  }

  const handleClearCache = () => {
    setChannels([])
    setFilteredChannels([])
    setGroups([])
  }

  const handleRefreshFromCache = () => {
    if (settings?.m3uUrl && typeof settings.m3uUrl === "string" && settings.m3uUrl.trim()) {
      refreshData(settings.m3uUrl)
    } else {
      toast({
        title: "No URL available",
        description: "Please enter a URL to refresh data",
        variant: "destructive",
      })
    }
  }

  // Calculate favorites count safely
  const favoritesCount = Array.isArray(favorites) ? favorites.length : 0

  // Don't render until settings are loaded and cache check is complete
  if (!isLoaded || isLoadingCache) {
    return (
      <div className="bg-white/95 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 text-center">
          <h1 className="text-4xl font-light mb-2">IPTV M3U Manager</h1>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/95 rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 text-center">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-light mb-2">IPTV M3U Manager</h1>
            <p className="text-gray-300">Upload and manage your M3U playlists</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFavorites(true)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Heart className="mr-2 h-4 w-4" />
            Favorites ({favoritesCount})
          </Button>
        </div>
      </div>

      <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-200">
        <CacheInfo onClearCache={handleClearCache} onRefreshData={handleRefreshFromCache} />

        <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />

        <M3uUrlForm
          onRefresh={refreshData}
          isLoading={isLoading}
          defaultUrl={settings?.m3uUrl || ""}
          urlHistory={Array.isArray(settings?.lastUsedUrls) ? settings.lastUsedUrls : []}
          onUrlChange={updateM3uUrl}
        />
      </div>

      <div className="p-6 md:p-8">
        {Array.isArray(channels) && channels.length > 0 && (
          <>
            <StatsDisplay totalChannels={channels.length} totalGroups={groups.length} />

            <FilterControls
              groups={groups}
              searchTerm={settings?.searchTerm || ""}
              selectedGroup={settings?.selectedGroup || ""}
              onSearchChange={updateSearchTerm}
              onGroupChange={updateSelectedGroup}
              onClearFilters={clearFilters}
            />

            <ChannelList
              channels={filteredChannels}
              searchTerm={settings?.searchTerm || ""}
              selectedGroup={settings?.selectedGroup || ""}
            />
          </>
        )}
      </div>

      <FavoritesPanel isOpen={showFavorites} onClose={() => setShowFavorites(false)} />
    </div>
  )
}
