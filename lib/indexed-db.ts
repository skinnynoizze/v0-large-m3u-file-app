import type { Channel } from "./types"

interface CachedData {
  channels: Channel[]
  timestamp: number
  source: string // 'file' or 'url'
  sourceIdentifier: string // filename or url
}

interface FavoriteChannel {
  id: string // unique identifier for the channel
  channel: Channel
  timestamp: number
}

const DB_NAME = "iptv-m3u-manager"
const DB_VERSION = 2 // Increased version for favorites support
const CHANNELS_STORE = "channels"
const FAVORITES_STORE = "favorites"
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// Check if IndexedDB is available
const isIndexedDBAvailable = typeof window !== "undefined" && "indexedDB" in window

// Generate a unique ID for a channel based on its properties
// Using a hash function that can handle Unicode characters
function generateChannelId(channel: Channel): string {
  const str = `${channel.title}-${channel.url}-${channel.groupTitle}`

  // Simple hash function that works with Unicode
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Convert to positive number and then to base36 string
  return Math.abs(hash).toString(36)
}

// Open the database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable) {
      reject(new Error("IndexedDB is not available in this browser"))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      reject(new Error("Failed to open IndexedDB"))
    }

    request.onsuccess = (event) => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = request.result

      // Create channels store if it doesn't exist
      if (!db.objectStoreNames.contains(CHANNELS_STORE)) {
        db.createObjectStore(CHANNELS_STORE, { keyPath: "id" })
      }

      // Create favorites store if it doesn't exist
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: "id" })
      }
    }
  })
}

// Save channels to IndexedDB
export async function saveChannelsToCache(
  channels: Channel[],
  source: "file" | "url",
  sourceIdentifier: string,
): Promise<void> {
  if (!isIndexedDBAvailable || channels.length === 0) {
    return
  }

  try {
    const db = await openDB()
    const transaction = db.transaction(CHANNELS_STORE, "readwrite")
    const store = transaction.objectStore(CHANNELS_STORE)

    const cachedData: CachedData = {
      channels,
      timestamp: Date.now(),
      source,
      sourceIdentifier,
    }

    // Use a consistent ID for the cached data
    store.put({ ...cachedData, id: "latest" })

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
      transaction.onerror = () => {
        db.close()
        reject(new Error("Failed to save channels to cache"))
      }
    })
  } catch (error) {
    console.error("Error saving channels to cache:", error)
  }
}

// Get channels from IndexedDB
export async function getChannelsFromCache(): Promise<CachedData | null> {
  if (!isIndexedDBAvailable) {
    return null
  }

  try {
    const db = await openDB()
    const transaction = db.transaction(CHANNELS_STORE, "readonly")
    const store = transaction.objectStore(CHANNELS_STORE)
    const request = store.get("latest")

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        const cachedData = request.result as CachedData | undefined

        if (!cachedData) {
          resolve(null)
          return
        }

        // Check if cache is expired
        const now = Date.now()
        if (now - cachedData.timestamp > CACHE_EXPIRY) {
          resolve(null)
          return
        }

        resolve(cachedData)
      }
      request.onerror = () => {
        db.close()
        reject(new Error("Failed to get channels from cache"))
      }
    })
  } catch (error) {
    console.error("Error getting channels from cache:", error)
    return null
  }
}

// Clear the cache
export async function clearChannelsCache(): Promise<void> {
  if (!isIndexedDBAvailable) {
    return
  }

  try {
    const db = await openDB()
    const transaction = db.transaction(CHANNELS_STORE, "readwrite")
    const store = transaction.objectStore(CHANNELS_STORE)
    store.delete("latest")

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
      transaction.onerror = () => {
        db.close()
        reject(new Error("Failed to clear channels cache"))
      }
    })
  } catch (error) {
    console.error("Error clearing channels cache:", error)
  }
}

// Get cache info (timestamp, source, etc.)
export async function getCacheInfo(): Promise<{
  timestamp: number
  source: string
  sourceIdentifier: string
} | null> {
  if (!isIndexedDBAvailable) {
    return null
  }

  try {
    const db = await openDB()
    const transaction = db.transaction(CHANNELS_STORE, "readonly")
    const store = transaction.objectStore(CHANNELS_STORE)
    const request = store.get("latest")

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        const cachedData = request.result as CachedData | undefined

        if (!cachedData) {
          resolve(null)
          return
        }

        resolve({
          timestamp: cachedData.timestamp,
          source: cachedData.source,
          sourceIdentifier: cachedData.sourceIdentifier,
        })
      }
      request.onerror = () => {
        db.close()
        reject(new Error("Failed to get cache info"))
      }
    })
  } catch (error) {
    console.error("Error getting cache info:", error)
    return null
  }
}

// Add a channel to favorites
export async function addToFavorites(channel: Channel): Promise<void> {
  if (!isIndexedDBAvailable) {
    return
  }

  try {
    const db = await openDB()
    const transaction = db.transaction(FAVORITES_STORE, "readwrite")
    const store = transaction.objectStore(FAVORITES_STORE)

    const favoriteChannel: FavoriteChannel = {
      id: generateChannelId(channel),
      channel,
      timestamp: Date.now(),
    }

    store.put(favoriteChannel)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
      transaction.onerror = () => {
        db.close()
        reject(new Error("Failed to add channel to favorites"))
      }
    })
  } catch (error) {
    console.error("Error adding channel to favorites:", error)
  }
}

// Remove a channel from favorites
export async function removeFromFavorites(channel: Channel): Promise<void> {
  if (!isIndexedDBAvailable) {
    return
  }

  try {
    const db = await openDB()
    const transaction = db.transaction(FAVORITES_STORE, "readwrite")
    const store = transaction.objectStore(FAVORITES_STORE)

    const channelId = generateChannelId(channel)
    store.delete(channelId)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
      transaction.onerror = () => {
        db.close()
        reject(new Error("Failed to remove channel from favorites"))
      }
    })
  } catch (error) {
    console.error("Error removing channel from favorites:", error)
  }
}

// Get all favorite channels
export async function getFavoriteChannels(): Promise<Channel[]> {
  if (!isIndexedDBAvailable) {
    console.warn("IndexedDB is not available")
    return []
  }

  try {
    const db = await openDB()
    const transaction = db.transaction(FAVORITES_STORE, "readonly")
    const store = transaction.objectStore(FAVORITES_STORE)
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        const favorites = request.result as FavoriteChannel[]
        console.log(`Retrieved ${favorites.length} favorites from IndexedDB`)

        if (favorites.length === 0) {
          console.log("No favorites found in IndexedDB")
        }

        const channels = favorites.map((fav) => fav.channel)
        resolve(channels)
      }
      request.onerror = (event) => {
        console.error("Error getting favorites:", event)
        db.close()
        reject(new Error("Failed to get favorite channels"))
      }
    })
  } catch (error) {
    console.error("Error accessing favorites in IndexedDB:", error)
    return []
  }
}

// Check if a channel is in favorites
export async function isChannelFavorite(channel: Channel): Promise<boolean> {
  if (!isIndexedDBAvailable) {
    return false
  }

  try {
    const db = await openDB()
    const transaction = db.transaction(FAVORITES_STORE, "readonly")
    const store = transaction.objectStore(FAVORITES_STORE)
    const channelId = generateChannelId(channel)
    const request = store.get(channelId)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        resolve(!!request.result)
      }
      request.onerror = () => {
        db.close()
        reject(new Error("Failed to check if channel is favorite"))
      }
    })
  } catch (error) {
    console.error("Error checking if channel is favorite:", error)
    return false
  }
}

// Clear all favorites
export async function clearFavorites(): Promise<void> {
  if (!isIndexedDBAvailable) {
    return
  }

  try {
    const db = await openDB()
    const transaction = db.transaction(FAVORITES_STORE, "readwrite")
    const store = transaction.objectStore(FAVORITES_STORE)
    store.clear()

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
      transaction.onerror = () => {
        db.close()
        reject(new Error("Failed to clear favorites"))
      }
    })
  } catch (error) {
    console.error("Error clearing favorites:", error)
  }
}

// Export the generateChannelId function for use in other modules
export { generateChannelId }
