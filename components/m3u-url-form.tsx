"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

interface M3uUrlFormProps {
  onRefresh: (url: string) => Promise<void>
  isLoading: boolean
  defaultUrl?: string
}

export function M3uUrlForm({ onRefresh, isLoading, defaultUrl = "" }: M3uUrlFormProps) {
  const [url, setUrl] = useState(defaultUrl)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onRefresh(url.trim())
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">M3U Playlist URL</CardTitle>
        <CardDescription>Enter the URL of your M3U playlist to fetch channels</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Label htmlFor="m3u-url" className="sr-only">
              M3U URL
            </Label>
            <Input
              id="m3u-url"
              placeholder="https://example.com/playlist.m3u"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
              required
              type="url"
              pattern="https?://.*"
              title="Please enter a valid URL starting with http:// or https://"
            />
          </div>
          <Button type="submit" disabled={isLoading || !url.trim()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLoading ? "Loading..." : "Fetch Channels"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
