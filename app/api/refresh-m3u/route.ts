import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Replace with your actual M3U URL
    const response = await fetch("https://example.com/path/to/playlist.m3u", {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch M3U data: ${response.status}`)
    }

    const content = await response.text()

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Error fetching M3U data:", error)

    return NextResponse.json({ error: "Failed to fetch M3U data" }, { status: 500 })
  }
}
