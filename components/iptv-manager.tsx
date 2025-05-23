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
import { saveChannelsToCache, getChannelsFromCache, getCacheInfo, clearChannelsCache } from "@/lib/indexed-db"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { M3uUrlForm } from "./m3u-url-form"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { addUrlToHistory, getSettings } from "@/lib/local-storage"

export default function IPTVManager() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [groups, setGroups] = useState<ChannelGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCache, setIsLoadingCache] = useState(true)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const { toast } = useToast()
  const [cacheInfo, setCacheInfo] = useState<{
    timestamp: number
    source: string
    sourceIdentifier: string
  } | null>(null)

  // Get favorites from the context
  const { favorites, isLoading: favoritesLoading } = useFavorites()

  const { settings, isLoaded, updateM3uUrl, updateSearchTerm, updateSelectedGroup, setLastUsedUrls } = useSettings()

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
        await loadCacheInfo()

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
        addUrlToHistory(trimmedUrl)
        const updatedSettings = getSettings()
        updateM3uUrl(trimmedUrl)
        setLastUsedUrls(updatedSettings.lastUsedUrls)
        await loadCacheInfo()

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

  const handleClearCache = async () => {
    setIsLoading(true)
    try {
      await clearChannelsCache()
      setChannels([])
      setFilteredChannels([])
      setGroups([])
      setCacheInfo(null)
      toast({
        title: "Cache cleared",
        description: "Channel data has been cleared from browser storage",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

  // Load cache info on mount and after relevant actions
  useEffect(() => {
    loadCacheInfo()
  }, [])

  const loadCacheInfo = async () => {
    const info = await getCacheInfo()
    setCacheInfo(info)
  }

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
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <M3uUrlForm
          onRefresh={refreshData}
          isLoading={isLoading}
          defaultUrl={settings?.m3uUrl || ""}
          urlHistory={Array.isArray(settings?.lastUsedUrls) ? settings.lastUsedUrls : []}
          onUrlChange={updateM3uUrl}
          onFileUpload={handleFileUpload}
          isLoadingFileUpload={isLoading}
        />

        <div className="mt-3">
          <CacheInfo
            cacheInfo={cacheInfo}
            onClearCache={handleClearCache}
            onRefreshData={handleRefreshFromCache}
            onReloadCacheInfo={loadCacheInfo}
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="p-6 md:p-8">
        {Array.isArray(channels) && channels.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <StatsDisplay totalChannels={channels.length} totalGroups={groups.length} />
              <Button
                variant="outline"
                onClick={() => setShowFavorites(true)}
                className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Heart className="mr-2 h-4 w-4" />
                Favorites ({favoritesCount})
              </Button>
            </div>

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
