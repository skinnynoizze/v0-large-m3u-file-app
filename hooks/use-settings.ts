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
  }

  const updateSearchTerm = (term: string) => {
    updateSetting("searchTerm", term)
  }

  const updateSelectedGroup = (group: string) => {
    updateSetting("selectedGroup", group)
  }

  const setLastUsedUrls = (urls: string[]) => {
    setSettings((prev) => {
      const newSettings = { ...prev, lastUsedUrls: urls }
      saveSettings({ lastUsedUrls: urls })
      return newSettings
    })
  }

  return {
    settings,
    isLoaded,
    updateM3uUrl,
    updateSearchTerm,
    updateSelectedGroup,
    setLastUsedUrls,
  }
}
