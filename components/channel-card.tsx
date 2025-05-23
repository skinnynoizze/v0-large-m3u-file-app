"use client"

import { useState } from "react"
import type { Channel } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChannelCardProps {
  channel: Channel
}

export function ChannelCard({ channel }: ChannelCardProps) {
  const [imageError, setImageError] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(channel.url)
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

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 transition-all hover:-translate-y-1 hover:shadow-lg">
      {channel.tvgLogo && !imageError ? (
        <img
          src={channel.tvgLogo || "/placeholder.svg"}
          alt={channel.tvgName}
          className="w-full h-48 object-cover bg-gray-100"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          No image available
        </div>
      )}

      <div className="p-4">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 mb-3">
          {channel.groupTitle}
        </div>

        <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2">{channel.title}</h3>

        <div className="bg-gray-50 p-2 rounded-lg text-xs text-gray-600 break-all">{channel.url}</div>

        <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={copyToClipboard}>
          <Copy className="mr-1 h-3 w-3" /> Copy URL
        </Button>
      </div>
    </div>
  )
}
