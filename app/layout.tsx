import React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { FavoritesProvider } from "@/contexts/favorites-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IPTV M3U Manager",
  description: "A modern application for managing IPTV M3U playlists",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
          <FavoritesProvider>
            {children}
            <Toaster />
          </FavoritesProvider>
      </body>
    </html>
  )
}
