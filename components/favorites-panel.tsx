"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Trash2, Copy } from "lucide-react"
import { useFavorites } from "@/contexts/favorites-context"
import { useToast } from "@/hooks/use-toast"

interface FavoritesPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function FavoritesPanel({ isOpen, onClose }: FavoritesPanelProps) {
  const { favorites, clearAllFavorites, isLoading, loadFavorites } = useFavorites()
  const { toast } = useToast()
  const [isClearing, setIsClearing] = useState(false)

  // Refresh favorites when the panel opens
  useEffect(() => {
    if (isOpen) {
      loadFavorites()
    }
  }, [isOpen, loadFavorites])

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      await clearAllFavorites()
      toast({
        title: "Favorites cleared",
        description: "All favorite channels have been removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear favorites",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  const copyUrl = async (url: string) => {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Favorite Channels
            </CardTitle>
            <CardDescription>
              {favorites.length} favorite channel{favorites.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {favorites.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={isClearing}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No favorite channels yet</p>
              <p className="text-sm">Click the heart icon on any channel to add it to favorites</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map((channel, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{channel.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyUrl(channel.url)}
                      className="ml-2 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {channel.groupTitle}
                  </Badge>
                  {channel.tvgLogo && (
                    <img
                      src={channel.tvgLogo ? `/api/proxy-logo?url=${encodeURIComponent(channel.tvgLogo)}` : "/placeholder.svg"}
                      alt={channel.tvgName}
                      className="w-full h-24 object-cover rounded mb-2"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  )}
                  <div className="text-xs text-gray-500 break-all">{channel.url}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
