"use client"

import { useState, useEffect } from "react"
import { saveSettings, getSettings, addUrlToHistory } from "@/lib/local-storage"

interface AppSettings {
  m3uUrl: string
  searchTerm: string
  selectedGroup: string
  lastUsedUrls: string[]
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    m3uUrl: "",
    searchTerm: "",
    selectedGroup: "",
    lastUsedUrls: [],
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings on mount (client-side only)
  useEffect(() => {
    const loadedSettings = getSettings()
    setSettings(loadedSettings)
    setIsLoaded(true)
  }, [])

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value }
      saveSettings({ [key]: value })
      return newSettings
    })
  }

  const updateM3uUrl = (url: string) => {
    updateSetting("m3uUrl", url)
    if (url.trim()) {
      addUrlToHistory(url.trim())
      // Update the URL history in state
      const updatedSettings = getSettings()
      setSettings((prev) => ({ ...prev, lastUsedUrls: updatedSettings.lastUsedUrls }))
    }
  }

  const updateSearchTerm = (term: string) => {
    updateSetting("searchTerm", term)
  }

  const updateSelectedGroup = (group: string) => {
    updateSetting("selectedGroup", group)
  }

  return {
    settings,
    isLoaded,
    updateM3uUrl,
    updateSearchTerm,
    updateSelectedGroup,
  }
}
