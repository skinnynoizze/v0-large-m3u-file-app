"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, History, Upload } from "lucide-react"
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { FileUploader } from "@/components/file-uploader"

interface M3uUrlFormProps {
  onRefresh: (url: string) => Promise<void>
  isLoading: boolean
  defaultUrl?: string
  urlHistory?: string[]
  onUrlChange?: (url: string) => void
  onFileUpload?: (file: File) => void
  isLoadingFileUpload?: boolean
}

export function M3uUrlForm({ onRefresh, isLoading, defaultUrl = "", urlHistory = [], onUrlChange, onFileUpload, isLoadingFileUpload }: M3uUrlFormProps) {
  const [url, setUrl] = useState(defaultUrl)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    setUrl(defaultUrl)
  }, [defaultUrl])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onRefresh(url.trim())
    }
  }

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    onUrlChange?.(newUrl)
  }

  const handleHistorySelect = (selectedUrl: string) => {
    if (selectedUrl && selectedUrl !== "select-history") {
      handleUrlChange(selectedUrl)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (onFileUpload) {
      await onFileUpload(file)
      setModalOpen(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          M3U Playlist URL
        </CardTitle>
        <CardDescription>Enter the URL of your M3U playlist to fetch channels</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="m3u-url">M3U URL</Label>
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
              <Input
                id="m3u-url"
                placeholder="https://example.com/playlist.m3u"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="flex-1"
                required
                type="url"
                pattern="https?://.*"
                title="Please enter a valid URL starting with http:// or https://"
              />
              <Button type="submit" disabled={isLoading || !url.trim()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isLoading ? "Loading..." : "Fetch Channels"}
              </Button>
            </div>
          </div>

          {urlHistory.length > 0 && (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="url-history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent URLs
              </Label>
              <Select value="select-history" onValueChange={handleHistorySelect}>
                <SelectTrigger id="url-history">
                  <SelectValue placeholder="Select from recent URLs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select-history" disabled>
                    Select from recent URLs
                  </SelectItem>
                  {urlHistory.map((historyUrl, index) => (
                    <SelectItem key={index} value={historyUrl}>
                      <div className="flex items-center justify-between w-full">
                        <span className="break-all" title={historyUrl}>{historyUrl}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form>
        <div className="mt-4">
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:underline">
                <Upload className="mr-1 h-4 w-4" />
                Upload local M3U file
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">Advanced</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Upload a local M3U file</DialogTitle>
              <FileUploader onFileUpload={handleFileUpload} isLoading={isLoadingFileUpload || false} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
