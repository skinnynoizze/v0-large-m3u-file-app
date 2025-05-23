import IPTVManagerClient from "@/components/iptv-manager-client"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <IPTVManagerClient />
      </div>
    </main>
  )
}
