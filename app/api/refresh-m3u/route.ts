import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const response = await fetch(url, {
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

    return NextResponse.json(
      { error: `Failed to fetch M3U data: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
