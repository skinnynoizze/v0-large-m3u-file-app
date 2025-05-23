interface AppSettings {
  m3uUrl: string
  searchTerm: string
  selectedGroup: string
  lastUsedUrls: string[]
}

const STORAGE_KEY = "iptv-m3u-manager-settings"
const MAX_URL_HISTORY = 10

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

export function saveSettings(settings: Partial<AppSettings>): void {
  if (!isBrowser) return

  try {
    const currentSettings = getSettings()
    const updatedSettings = { ...currentSettings, ...settings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings))
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error)
  }
}

export function getSettings(): AppSettings {
  if (!isBrowser) {
    return {
      m3uUrl: "",
      searchTerm: "",
      selectedGroup: "",
      lastUsedUrls: [],
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error)
  }

  return {
    m3uUrl: "",
    searchTerm: "",
    selectedGroup: "",
    lastUsedUrls: [],
  }
}

export function addUrlToHistory(url: string): void {
  if (!isBrowser) return

  try {
    const settings = getSettings()
    const urls = settings.lastUsedUrls || []

    // Remove the URL if it already exists
    const filteredUrls = urls.filter((existingUrl) => existingUrl !== url)

    // Add the new URL to the beginning
    const updatedUrls = [url, ...filteredUrls].slice(0, MAX_URL_HISTORY)

    saveSettings({ lastUsedUrls: updatedUrls })
  } catch (error) {
    console.error("Failed to add URL to history:", error)
  }
}

export function clearSettings(): void {
  if (!isBrowser) return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear settings:", error)
  }
}
