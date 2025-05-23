"use client"

import { useState, useEffect } from "react"
import { FileUploader } from "./file-uploader"
import { StatsDisplay } from "./stats-display"
import { FilterControls } from "./filter-controls"
import { ChannelList } from "./channel-list"
import { CacheInfo } from "./cache-info"
import { parseM3U } from "@/lib/m3u-parser"
import type { Channel, ChannelGroup } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { M3uUrlForm } from "./m3u-url-form"
import { useSettings } from "@/hooks/use-settings"
import { saveChannelsToCache, getChannelsFromCache } from "@/lib/indexed-db"

export default function IPTVManager() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [groups, setGroups] = useState<ChannelGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCache, setIsLoadingCache] = useState(true)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const { toast } = useToast()

  const { settings, isLoaded, updateM3uUrl, updateSearchTerm, updateSelectedGroup } = useSettings()

  // Load channels from cache on initial load
  useEffect(() => {
    async function loadFromCache() {
      setIsLoadingCache(true)
      try {
        const cachedData = await getChannelsFromCache()
        if (cachedData) {
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
    if (channels.length > 0) {
      // Extract unique groups and sort them alphabetically
      const uniqueGroups = Array.from(new Set(channels.map((channel) => channel.groupTitle)))
        .sort((a, b) => a.localeCompare(b))
        .map((groupTitle) => ({
          title: groupTitle,
          count: channels.filter((channel) => channel.groupTitle === groupTitle).length,
        }))

      setGroups(uniqueGroups)
    }
  }, [channels])

  useEffect(() => {
    applyFilters()
  }, [settings.searchTerm, settings.selectedGroup, channels])

  const applyFilters = () => {
    if (!settings.searchTerm && !settings.selectedGroup) {
      setFilteredChannels([])
      return
    }

    let filtered = [...channels]

    if (settings.searchTerm) {
      const term = settings.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (channel) => channel.title.toLowerCase().includes(term) || channel.tvgName.toLowerCase().includes(term),
      )
    }

    if (settings.selectedGroup) {
      filtered = filtered.filter((channel) => channel.groupTitle === settings.selectedGroup)
    }

    setFilteredChannels(filtered)
  }

  const handleFileUpload = async (file: File) => {
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
      const content = await file.text()

      if (!content) {
        throw new Error("File is empty")
      }

      const parsedChannels = parseM3U(content)

      if (parsedChannels.length === 0) {
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

    setIsLoading(true)
    updateM3uUrl(url)

    try {
      const response = await fetch("/api/refresh-m3u", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch M3U data: ${response.status}`)
      }

      const content = await response.text()

      if (!content) {
        throw new Error("Received empty content from the server")
      }

      const parsedChannels = parseM3U(content)

      if (parsedChannels.length === 0) {
        toast({
          title: "Warning",
          description: "No channels found in the response. Please check the URL.",
          variant: "destructive",
        })
      } else {
        setChannels(parsedChannels)

        // Save to cache
        await saveChannelsToCache(parsedChannels, "url", url)

        toast({
          title: "Success",
          description: `Data updated successfully with ${parsedChannels.length} channels`,
        })
      }
    } catch (error) {
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
    if (settings.m3uUrl) {
      refreshData(settings.m3uUrl)
    } else {
      toast({
        title: "No URL available",
        description: "Please enter a URL to refresh data",
        variant: "destructive",
      })
    }
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
        <h1 className="text-4xl font-light mb-2">IPTV M3U Manager</h1>
        <p className="text-gray-300">Upload and manage your M3U playlists</p>
      </div>

      <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-200">
        <CacheInfo onClearCache={handleClearCache} onRefreshData={handleRefreshFromCache} />

        <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />

        <M3uUrlForm
          onRefresh={refreshData}
          isLoading={isLoading}
          defaultUrl={settings.m3uUrl}
          urlHistory={settings.lastUsedUrls}
          onUrlChange={updateM3uUrl}
        />
      </div>

      <div className="p-6 md:p-8">
        {channels.length > 0 && (
          <>
            <StatsDisplay totalChannels={channels.length} totalGroups={groups.length} />

            <FilterControls
              groups={groups}
              searchTerm={settings.searchTerm}
              selectedGroup={settings.selectedGroup}
              onSearchChange={updateSearchTerm}
              onGroupChange={updateSelectedGroup}
              onClearFilters={clearFilters}
            />

            <ChannelList
              channels={filteredChannels}
              searchTerm={settings.searchTerm}
              selectedGroup={settings.selectedGroup}
            />
          </>
        )}
      </div>
    </div>
  )
}
