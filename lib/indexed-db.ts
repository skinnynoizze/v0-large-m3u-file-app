import type { Channel } from "./types"

interface CachedData {
  channels: Channel[]
  timestamp: number
  source: string // 'file' or 'url'
  sourceIdentifier: string // filename or url
}

const DB_NAME = "iptv-m3u-manager"
const DB_VERSION = 1
const STORE_NAME = "channels"
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// Check if IndexedDB is available
const isIndexedDBAvailable = typeof window !== "undefined" && "indexedDB" in window

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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
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
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)

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
    const transaction = db.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
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
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
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
    const transaction = db.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
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
