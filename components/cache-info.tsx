"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2, Database } from "lucide-react"

interface CacheInfoProps {
  cacheInfo: {
    timestamp: number
    source: string
    sourceIdentifier: string
  } | null
  onClearCache: () => void
  onRefreshData: () => void
  onReloadCacheInfo: () => void
  isLoading: boolean
}

export function CacheInfo({ cacheInfo, onClearCache, onRefreshData, onReloadCacheInfo, isLoading }: CacheInfoProps) {
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
        <Button variant="destructive" onClick={onClearCache} disabled={isLoading}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Cache
        </Button>
      </CardFooter>
    </Card>
  )
}
