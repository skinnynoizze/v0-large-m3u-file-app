"use client"

import { useState, useEffect, useCallback } from "react"
import type { Channel } from "@/lib/types"
import {
  addToFavorites,
  removeFromFavorites,
  getFavoriteChannels,
  clearFavorites,
  generateChannelId,
} from "@/lib/indexed-db"

export function useFavoritesHook() {
  const [favorites, setFavorites] = useState<Channel[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Make loadFavorites a useCallback to prevent unnecessary re-renders
  const loadFavorites = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log("Loading favorites from IndexedDB...")
      const favoriteChannels = await getFavoriteChannels()
      console.log(`Loaded ${favoriteChannels.length} favorites:`, favoriteChannels)

      setFavorites(favoriteChannels)

      // Create a set of favorite IDs for quick lookup
      const ids = new Set(favoriteChannels.map(generateChannelId))
      setFavoriteIds(ids)

      return favoriteChannels
    } catch (error) {
      console.error("Failed to load favorites:", error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load favorites on mount
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const addFavorite = async (channel: Channel) => {
    try {
      const channelId = generateChannelId(channel)

      // Check if already a favorite to avoid duplicates
      if (favoriteIds.has(channelId)) {
        console.log("Channel is already a favorite:", channel.title)
        return true
      }

      // Persist to IndexedDB first
      await addToFavorites(channel)

      // Then update the UI state
      setFavorites((prev) => {
        const newFavorites = [...prev, channel]
        console.log("Updated favorites state, new count:", newFavorites.length)
        return newFavorites
      })

      setFavoriteIds((prev) => {
        const newSet = new Set([...prev, channelId])
        console.log("Updated favorite IDs, new count:", newSet.size)
        return newSet
      })

      console.log(`Successfully added channel to favorites: ${channel.title}`)
      return true
    } catch (error) {
      console.error("Failed to add favorite:", error)
      throw error
    }
  }

  const removeFavorite = async (channel: Channel) => {
    try {
      const channelId = generateChannelId(channel)

      // Persist to IndexedDB first
      await removeFromFavorites(channel)

      // Then update the UI state
      setFavorites((prev) => {
        const newFavorites = prev.filter((fav) => generateChannelId(fav) !== channelId)
        console.log("Updated favorites state after removal, new count:", newFavorites.length)
        return newFavorites
      })

      setFavoriteIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(channelId)
        console.log("Updated favorite IDs after removal, new count:", newSet.size)
        return newSet
      })

      console.log(`Successfully removed channel from favorites: ${channel.title}`)
      return true
    } catch (error) {
      console.error("Failed to remove favorite:", error)
      throw error
    }
  }

  const toggleFavorite = async (channel: Channel) => {
    const channelId = generateChannelId(channel)
    console.log(`Toggling favorite for channel: ${channel.title}, currently favorite: ${favoriteIds.has(channelId)}`)

    if (favoriteIds.has(channelId)) {
      return await removeFavorite(channel)
    } else {
      return await addFavorite(channel)
    }
  }

  const isFavorite = (channel: Channel): boolean => {
    if (!channel) return false
    const channelId = generateChannelId(channel)
    const result = favoriteIds.has(channelId)
    return result
  }

  const clearAllFavorites = async () => {
    try {
      // Persist to IndexedDB first
      await clearFavorites()

      // Then update the UI state
      setFavorites([])
      setFavoriteIds(new Set())

      console.log("Successfully cleared all favorites")
      return true
    } catch (error) {
      console.error("Failed to clear favorites:", error)
      throw error
    }
  }

  // Debug logging for state changes
  useEffect(() => {
    console.log("Favorites state updated:", {
      count: favorites.length,
      idsCount: favoriteIds.size,
      isLoading,
    })
  }, [favorites.length, favoriteIds.size, isLoading])

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    loadFavorites,
  }
}
