"use client"

import dynamic from "next/dynamic"

// Dynamically import the IPTVManager component with SSR disabled
const IPTVManager = dynamic(() => import("@/components/iptv-manager"), {
  ssr: false,
  loading: () => (
    <div className="bg-white/95 rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 text-center">
        <h1 className="text-4xl font-light mb-2">IPTV M3U Manager</h1>
        <p className="text-gray-300">Loading...</p>
      </div>
      <div className="p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  ),
})

export default function IPTVManagerClient() {
  return <IPTVManager />
}
