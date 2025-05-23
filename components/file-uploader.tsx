"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
}

export function FileUploader({ onFileUpload, isLoading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileUpload(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0])
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      <div
        className={`border-3 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragging ? "border-green-500 bg-green-50" : "border-blue-500 hover:border-blue-700 hover:bg-blue-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <h3 className="text-xl font-medium mb-2">📁 Drag your M3U file here</h3>
        <p className="text-gray-500">or click to select</p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".m3u,.m3u8"
          onChange={handleFileInputChange}
          disabled={isLoading}
        />
      </div>

      <div className="mt-4 text-center">
        <Button
          onClick={handleUploadClick}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-6 py-2 rounded-lg transition-transform hover:-translate-y-1 shadow-md hover:shadow-lg"
        >
          <Upload className="mr-2 h-4 w-4" /> Upload M3U File
        </Button>
      </div>
    </div>
  )
}
