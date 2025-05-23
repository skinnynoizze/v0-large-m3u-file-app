"use client"

import { useState, useEffect } from "react"
import { FileUploader } from "./file-uploader"
import { StatsDisplay } from "./stats-display"
import { FilterControls } from "./filter-controls"
import { ChannelList } from "./channel-list"
import { parseM3U } from "@/lib/m3u-parser"
import type { Channel, ChannelGroup } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function IPTVManager() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [groups, setGroups] = useState<ChannelGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (channels.length > 0) {
      // Extract unique groups
      const uniqueGroups = Array.from(new Set(channels.map((channel) => channel.groupTitle))).map((groupTitle) => ({
        title: groupTitle,
        count: channels.filter((channel) => channel.groupTitle === groupTitle).length,
      }))

      setGroups(uniqueGroups)
    }
  }, [channels])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, selectedGroup, channels])

  const applyFilters = () => {
    if (!searchTerm && !selectedGroup) {
      setFilteredChannels([])
      return
    }

    let filtered = [...channels]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (channel) => channel.title.toLowerCase().includes(term) || channel.tvgName.toLowerCase().includes(term),
      )
    }

    if (selectedGroup) {
      filtered = filtered.filter((channel) => channel.groupTitle === selectedGroup)
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
      const parsedChannels = parseM3U(content)
      setChannels(parsedChannels)

      toast({
        title: "Success",
        description: `File "${file.name}" loaded successfully with ${parsedChannels.length} channels`,
      })
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

  const refreshData = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/refresh-m3u")

      if (!response.ok) {
        throw new Error(`Failed to fetch M3U data: ${response.status}`)
      }

      const content = await response.text()
      const parsedChannels = parseM3U(content)
      setChannels(parsedChannels)

      toast({
        title: "Success",
        description: `Data updated successfully with ${parsedChannels.length} channels`,
      })
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

  return (
    <div className="bg-white/95 rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 text-center">
        <h1 className="text-4xl font-light mb-2">IPTV M3U Manager</h1>
        <p className="text-gray-300">Upload and manage your M3U playlists</p>
      </div>

      <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-200">
        <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />

        <div className="mt-4 text-center">
          <Button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white px-6 py-2 rounded-lg transition-transform hover:-translate-y-1 shadow-md hover:shadow-lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
          </Button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {channels.length > 0 && (
          <>
            <StatsDisplay totalChannels={channels.length} totalGroups={groups.length} />

            <FilterControls
              groups={groups}
              searchTerm={searchTerm}
              selectedGroup={selectedGroup}
              onSearchChange={setSearchTerm}
              onGroupChange={setSelectedGroup}
            />

            <ChannelList channels={filteredChannels} searchTerm={searchTerm} selectedGroup={selectedGroup} />
          </>
        )}
      </div>
    </div>
  )
}
