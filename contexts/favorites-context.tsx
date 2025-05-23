"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { Channel } from "@/lib/types"
import {
  addToFavorites,
  removeFromFavorites,
  getFavoriteChannels,
  clearFavorites,
  generateChannelId,
} from "@/lib/indexed-db"

interface FavoritesContextType {
  favorites: Channel[]
  isLoading: boolean
  addFavorite: (channel: Channel) => Promise<void>
  removeFavorite: (channel: Channel) => Promise<void>
  toggleFavorite: (channel: Channel) => Promise<boolean>
  isFavorite: (channel: Channel) => boolean
  clearAllFavorites: () => Promise<void>
  loadFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Channel[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  // Use a ref to track the latest state for isFavorite checks
  const favoriteIdsRef = useRef<Set<string>>(new Set())

  // Update the ref whenever the state changes
  useEffect(() => {
    favoriteIdsRef.current = favoriteIds
  }, [favoriteIds])

  const loadFavorites = useCallback(async () => {
    setIsLoading(true)
    try {
      const favoriteChannels = await getFavoriteChannels()
      setFavorites(favoriteChannels)
      const ids = new Set(favoriteChannels.map(generateChannelId))
      setFavoriteIds(ids)
      favoriteIdsRef.current = ids
    } catch (error) {
      console.error("Failed to load favorites:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const addFavorite = useCallback(async (channel: Channel) => {
    const channelId = generateChannelId(channel)

    // Check if already a favorite
    if (favoriteIdsRef.current.has(channelId)) {
      return
    }

    // Optimistically update UI
    setFavorites((prev) => [...prev, channel])
    setFavoriteIds((prev) => {
      const newSet = new Set([...prev, channelId])
      favoriteIdsRef.current = newSet
      return newSet
    })

    try {
      await addToFavorites(channel)
    } catch (error) {
      // Revert on error
      setFavorites((prev) => prev.filter((fav) => generateChannelId(fav) !== channelId))
      setFavoriteIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(channelId)
        favoriteIdsRef.current = newSet
        return newSet
      })
      throw error
    }
  }, [])

  const removeFavorite = useCallback(async (channel: Channel) => {
    const channelId = generateChannelId(channel)

    // Optimistically update UI
    setFavorites((prev) => prev.filter((fav) => generateChannelId(fav) !== channelId))
    setFavoriteIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(channelId)
      favoriteIdsRef.current = newSet
      return newSet
    })

    try {
      await removeFromFavorites(channel)
    } catch (error) {
      // Revert on error
      setFavorites((prev) => [...prev, channel])
      setFavoriteIds((prev) => {
        const newSet = new Set([...prev, channelId])
        favoriteIdsRef.current = newSet
        return newSet
      })
      throw error
    }
  }, [])

  const toggleFavorite = useCallback(
    async (channel: Channel) => {
      const channelId = generateChannelId(channel)
      const isCurrentlyFavorite = favoriteIdsRef.current.has(channelId)

      if (isCurrentlyFavorite) {
        await removeFavorite(channel)
        return false
      } else {
        await addFavorite(channel)
        return true
      }
    },
    [addFavorite, removeFavorite],
  )

  const isFavorite = useCallback((channel: Channel): boolean => {
    if (!channel) return false
    const channelId = generateChannelId(channel)
    return favoriteIdsRef.current.has(channelId)
  }, [])

  const clearAllFavorites = useCallback(async () => {
    // Optimistically update UI
    setFavorites([])
    setFavoriteIds(new Set())
    favoriteIdsRef.current = new Set()

    try {
      await clearFavorites()
    } catch (error) {
      // Reload on error
      await loadFavorites()
      throw error
    }
  }, [loadFavorites])

  const value = {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    loadFavorites,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
