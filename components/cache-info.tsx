"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2, Database } from "lucide-react"
import { clearChannelsCache, getCacheInfo } from "@/lib/indexed-db"
import { useToast } from "@/hooks/use-toast"

interface CacheInfoProps {
  onClearCache: () => void
  onRefreshData: () => void
}

export function CacheInfo({ onClearCache, onRefreshData }: CacheInfoProps) {
  const [cacheInfo, setCacheInfo] = useState<{
    timestamp: number
    source: string
    sourceIdentifier: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCacheInfo()
  }, [])

  const loadCacheInfo = async () => {
    try {
      const info = await getCacheInfo()
      setCacheInfo(info)
    } catch (error) {
      console.error("Failed to load cache info:", error)
    }
  }

  const handleClearCache = async () => {
    setIsLoading(true)
    try {
      await clearChannelsCache()
      setCacheInfo(null)
      onClearCache()
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

  if (!cacheInfo) {
    return null
  }

  const formattedDate = new Date(cacheInfo.timestamp).toLocaleString()
  const sourceLabel = cacheInfo.source === "file" ? "Uploaded file" : "URL"
  const sourceValue =
    cacheInfo.source === "file"
      ? cacheInfo.sourceIdentifier
      : cacheInfo.sourceIdentifier.length > 40
        ? `${cacheInfo.sourceIdentifier.substring(0, 40)}...`
        : cacheInfo.sourceIdentifier

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cached Channel Data
        </CardTitle>
        <CardDescription>Channel data is stored in your browser</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Last updated:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Source:</span>
            <span>
              {sourceLabel}: {sourceValue}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onRefreshData} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
        <Button variant="destructive" onClick={handleClearCache} disabled={isLoading}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Cache
        </Button>
      </CardFooter>
    </Card>
  )
}
