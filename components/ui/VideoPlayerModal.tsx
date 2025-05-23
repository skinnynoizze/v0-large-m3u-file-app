import React, { useEffect, useRef } from "react"
import videojs from "video.js"
import "video.js/dist/video-js.css"

interface VideoPlayerModalProps {
  open: boolean
  onClose: () => void
  src: string | null
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ open, onClose, src }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    if (open && src && videoRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: true,
        preload: "auto",
        sources: [
          {
            src,
            type: "application/x-mpegURL",
          },
        ],
      })
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [open, src])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg shadow-lg p-4 relative w-full max-w-2xl">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
          onClick={onClose}
        >
          &times;
        </button>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin w-full h-96"
          controls
        />
      </div>
    </div>
  )
} 